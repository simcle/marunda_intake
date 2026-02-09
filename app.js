import startPoolingflow from "./flow.js";
import startPoolingPump from "./pump.js";
import eventBus from "./event.js";
import { startACS580 } from "./acs580.js";
import { startTcpServer, holdingRegisters } from "./tcpServer.js";   

import mqtt from "mqtt";
let mqttClient = null
let mqttIsConnected = false
mqttClient = mqttClient = mqtt.connect('mqtt://mqtt.ndpteknologi.com', {
    clientId: 'marunda_ipa' + Math.random().toString(16).slice(2, 8),
    reconnectPeriod: 3000
})

mqttClient.on('connect', () => {
    console.log('MQTT is connected')
    mqttIsConnected = true
})

mqttClient.on('close', () => {
    mqttIsConnected = false
})

mqttClient.on('error', () => {
    mqttIsConnected = false
})

const data = {
    flowrate: 0,
    pmp1: {},
    pmp2: {}
}

const acs580RegisterMap = {
    speed: { reg: 8003, },
    frequency: { reg: 8005},
    current: { reg: 8007},
    torque: {reg: 8009},
    motor_power: {reg: 8011},
    dc_volt: {reg: 8015},
    running_time: {reg: 8025},
    kWh_counter: {reg: 8027},
    mWh_counter: {reg: 8031}
}
function writeInt16ToHR(hrAddr, value) {
  const reg0 = hrAddr - 1;
  const offset = reg0 * 2;
  holdingRegisters.writeInt16BE(value, offset);
}

function writeInt32ToHR(hrAddr, rawValue) {
    const reg0 = hrAddr
    const offset = reg0 * 2; // register → byte
    holdingRegisters.writeFloatBE(rawValue, offset);
}
        
function writeBitToHR(hrAddr, bitIndex, value) {
  const reg0 = hrAddr;      // 0-based
  const offset = reg0 * 2;      // byte offset

  let current = holdingRegisters.readUInt16BE(offset);

  if (value) {
    current |= (1 << bitIndex);   // set bit
  } else {
    current &= ~(1 << bitIndex);  // clear bit
  }

  holdingRegisters.writeUInt16BE(current, offset);
}

// flowrate
eventBus.on('flowrate', (val) => {
    data.flowrate = val
    const toInt = Math.round(val * 100)
    writeInt32ToHR(8301, val) // FP di scada tidak presisi
    writeInt16ToHR(8304, toInt) // 4x untuk integer dibagi 100
})

// pmp status
eventBus.on('pmpStatus', (val) => {
    if(val) {
        const pmp1 = val[1] === true
        data.pmp1['pmp_run_sts'] = pmp1
        writeBitToHR(7900, 0, pmp1)
        const pmp2 = val[0] === true
        data.pmp2['pmp_run_sts'] = pmp2
        writeBitToHR(7901, 0, pmp2)   
    }
})
eventBus.on('acs580', (val) => {
    val.forEach(p => {
        data.pmp1[p.name] = p.value
        
        // save to modbus TCP
        const map = acs580RegisterMap[p.name]
        if(!map) return
        if(p.name === 'running_time') {
            const hours = Math.floor(p.value / 3600)
            console.log('hours', p.value)
            writeInt32ToHR(8025, hours)
        } else {
            writeInt32ToHR(map.reg, p.value)
        }
    })
})


async function start() {
    await startTcpServer()
    setInterval(() => {
        mqttClient.publish('marunda/intake', JSON.stringify(data))
    }, 1000)

    startPoolingflow()
    startPoolingPump()
    startACS580()
}

start()
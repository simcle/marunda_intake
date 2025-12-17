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
    kWh_counter: {reg: 8027},
    mWh_counter: {reg: 8031}
}

function writeInt32ToHR(hrAddr, rawValue) {
    const reg0 = hrAddr - 1
    const offset = reg0 * 2; // register → byte
    holdingRegisters.writeInt32BE(rawValue, offset);
}
        
function writeBitToHR(hrAddr, bitIndex, value) {
  const reg0 = hrAddr - 1;      // 0-based
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
})

// pmp status
eventBus.on('pmpStatus', (val) => {
    if(val) {
        const pmp1 = val[8] === 1
        data.pmp1['pmp_run_sts'] = pmp1
        writeBitToHR(7901, 0, pmp1)
        
    }
})
eventBus.on('acs580', (val) => {
    val.forEach(p => {
        data.pmp1[p.name] = p.value
        
        // save to modbus TCP
        const map = acs580RegisterMap[p.name]
        if(!map) return

        writeInt32ToHR(map.reg, p.raw)
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
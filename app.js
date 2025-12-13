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
    speed: { reg: 0, },
    frequency: { reg: 2},
    current: { reg: 4},
    torque: {reg: 6},
    dc_volt: {reg: 8},
    motor_power: {reg: 10},
    mWh_counter: {reg: 12},
    kWh_counter: {reg: 14}
}
function writeInt32ToHR(register, rawValue) {
    const offset = register * 2; // register → byte
    holdingRegisters.writeInt32BE(rawValue, offset);
}
// flowrate
eventBus.on('flowrate', (val) => {
    data.flowrate = val
})

// pmp status
eventBus.on('pmpStatus', (val) => {
    if(val) {
        data.pmp1['pmp_run_sts'] = val[8]
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
import startPoolingflow from "./flow.js";
// import startPoolingPump from "./pump.js";
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
    pmp1: 0,
    pmp2: 1
}

// flowrate
eventBus.on('flowrate', (val) => {
    data.flowrate = val
})
eventBus.on('acs580', (val) => {
    console.log(val)
})


async function start() {
    await startTcpServer()
    setInterval(() => {
        mqttClient.publish('marunda/intake', JSON.stringify(data))
    }, 1000)

    // startPoolingPump()
    startPoolingflow()
    startACS580()
}

start()
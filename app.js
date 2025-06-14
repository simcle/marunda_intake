import startPoolingflow from "./flow.js";
import startPoolingPump from "./pump.js";
import eventBus from "./event.js";

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
    console.log('ini data darai event flow', val)
    data.flowrate = val
})

setInterval(() => {
    mqttClient.publish('marunda/intake', JSON.stringify(data))
}, 1000)

startPoolingPump()
startPoolingflow()
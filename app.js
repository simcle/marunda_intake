import startPoolingflow from "./flow.js";
import startPoolingPump from "./pump.js";
import eventBus from "./event.js";



// flowrate
eventBus.on('flowrate', (data) => {
    console.log('ini data darai event flow', data)
})

startPoolingPump()
startPoolingflow()
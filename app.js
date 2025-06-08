import startPooling from "./flow.js";
import eventBus from "./event.js";


eventBus.on('flowrate', (data) => {
    console.log('ini data darai event flow', data)
})


startPooling()
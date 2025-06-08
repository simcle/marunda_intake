import startPooling from "./flow.js";
import eventBus from "./event.js";


eventBus.on('flowmeter', (data) => {
    console.log('ini data darai event flow', data)
})


startPooling()
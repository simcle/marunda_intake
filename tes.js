let adcRaw = 31198;
const adcMin = 30000;
const adcMax = 32350;




setInterval(() => {
    adcRaw+= 1
    const ma = ((adcRaw - adcMin) / (adcMax - adcMin)) * 16 + 4;
    const flowMax = 60;
    const flow = ((ma - 4) / 16) * flowMax;

    console.log("ADC:", adcRaw);
    console.log("mA :", ma.toFixed(3));
    console.log("Flowrate:", flow.toFixed(3), "L/s");
}, 1000)
import ModbusRTU from "modbus-serial";
import eventBus from "./event.js";

const client = new ModbusRTU()


const SERIAL_PORT = '/dev/ttyS3';
const BAUD_RATE = 9600;
const SLAVE_ID = 1;
const POLLING_INTERVAL_MS = 1000;
const RECONNECT_DELAY_MS = 3000;


let isConnected = false;

const connectClient = async () => {
    try {
        if (!client.isOpen) {
            await client.connectRTUBuffered(SERIAL_PORT, { baudRate: BAUD_RATE });
            client.setID(SLAVE_ID);
            client.setTimeout(1000);
            isConnected = true;
            console.log("✔️ Modbus connected");
        }
    } catch (err) {
        isConnected = false;
        console.error("❌ Connection failed:", err.message);
        setTimeout(connectClient, RECONNECT_DELAY_MS); // retry later
    }
};


const pollData = async () => {
    if (!isConnected) return;
    try {
        const data = await client.readHoldingRegisters(0, 1);
        const val = data.data[0]
        const currMa = adcToMilliamp(val)
        // console.log('ma', currMa)
        const flow = milliampToFlow(currMa)
        eventBus.emit('flowrate', flow)
    } catch (err) {
        console.error("⚠️ Read error:", err.message);
        isConnected = false;
        try {
            client.close(); // ensure clean state
        } catch (closeErr) {
            console.error("❌ Error closing port:", closeErr.message);
        }
        setTimeout(connectClient, RECONNECT_DELAY_MS);
    }
};

// Main loop
const startPoolingflow = async () => {
    await connectClient();
    setInterval(async () => {
        await pollData();
    }, POLLING_INTERVAL_MS);
};



// Konversi ADC 16-bit ke mA dan flow rate
const ADC_4MA  = 31004;
const ADC_20MA = 35020;
const SPAN = ADC_20MA - ADC_4MA; // 4016

function adcToMilliamp(raw) {
    console.log('raw ADC:',raw)

    const mA = 4 + ((raw - ADC_4MA) * 16) / SPAN;
    console.log('current mA:', mA)
    return Number(mA.toFixed(2));
}

// Konversi mA ke flow rate (contoh: 4 mA = 0, 20 mA = 100 m³/h)
const FLOW_MAX_M3H = 1700
function milliampToFlow(mA) {
    if (mA <= 4) return 0;
    if (mA >= 20) mA = 20;

    const flowM3h = ((mA - 4) * FLOW_MAX_M3H) / 16;
    const lps = flowM3h * (1000 / 3600);
    console.log('flow m3 :', flowM3h)
    console.log('flow lps :',lps)
    return lps.toFixed(2);
}
// startPoolingflow()
export default startPoolingflow
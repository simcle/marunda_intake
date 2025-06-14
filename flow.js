import ModbusRTU from "modbus-serial";
import eventBus from "./event.js";

const client = new ModbusRTU()


const SERIAL_PORT = '/dev/ttyS2';
const BAUD_RATE = 9600;
const SLAVE_ID = 1;
const POLLING_INTERVAL_MS = 1000;
const RECONNECT_DELAY_MS = 3000;
const FLOW_MAX = 60

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
        const val = data.data
        console.log(val)
        const currMa = adcToMilliamp(val)
        console.log('ma', currMa)
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
const ADC_MIN = 31200; // ADC value at 4 mA (dari hasil pengukuran)
const ADC_MAX = 62400; // ADC value at 20 mA

function adcToMilliamp(adcValue) {
    const clamped = Math.max(ADC_MIN, Math.min(adcValue, ADC_MAX));
    return ((clamped - ADC_MIN) / (ADC_MAX - ADC_MIN)) * 16 + 4;
}

// Konversi mA ke flow rate (contoh: 4 mA = 0, 20 mA = 100 m³/h)
function milliampToFlow(mA) {
    if (mA < 4) return 0;
    if (mA > 20) mA = 20;
    return ((mA - 4) / 16) * FLOW_MAX; // linear scale
}

export default startPoolingflow
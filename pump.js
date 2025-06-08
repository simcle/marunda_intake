import ModbusRTU from "modbus-serial";
import eventBus from "./event.js";

const client = new ModbusRTU()
const ADVANTECH_IP = '192.168.1.2'
const ADVANTECH_PORT = 502
const POLLING_INTERVAL_MS = 1000
const RECONNECT_DELAY_MS = 3000;

let isConnected = false

const connectClient = async () => {
    try {
        await client.connectTCP(ADVANTECH_IP, {port: ADVANTECH_PORT})
        client.setID(1)
        isConnected = true
        console.log('ADVANTECH is Connected')
    } catch (error) {
        isConnected = false
        console.log('ADVANTECH error connection')
    }
}

const pollData = async () => {
    if(!isConnected) return
    try {
        const data = await client.readDiscreteInputs(0, 4)
        console.log(data)
    } catch (error) {
        console.error("⚠️ Read error:", err.message);
        isConnected = false;
        try {
            client.close(); // ensure clean state
        } catch (closeErr) {
            console.error("❌ Error closing port:", closeErr.message);
        }
        setTimeout(connectClient, RECONNECT_DELAY_MS);
    }
}

const startPoolingPump = async () => {
    await connectClient();
    setInterval(async () => {
        await pollData();
    }, POLLING_INTERVAL_MS);
}

export default startPoolingPump
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
        const res = await client.readHoldingRegisters(0, 10)
        console.log(res.data)
        eventBus.emit('pmpStatus', res.data)
    } catch (error) {
        console.error("⚠️ Read error:", error.message);
        isConnected = false;
        try {
            client.close(); // ensure clean state
        } catch (closeErr) {
            console.error("❌ Error closing port:", closeErr.message);
        }
        setTimeout(connectClient, RECONNECT_DELAY_MS);
    }
}

const startPollingPump = async () => {
    await connectClient();
    setInterval(async () => {
        await pollData();
    }, POLLING_INTERVAL_MS);
}
startPollingPump()
// export default startPollingPump
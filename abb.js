import ModbusRTU from "modbus-serial";
import { startPolling } from "./acs580";
console.log('Starting Modbus RTU test...');

const client = new ModbusRTU();

async function connect() {
    try {
        await client.connectRTUBuffered("/dev/ttyS2", {
            baudRate: 19200,
            dataBits: 8,
            stopBits: 1,
            parity: "none",
        });

        client.setID(1);       // Ganti sesuai slave ID
        client.setTimeout(1000);

        console.log("Connected to /dev/ttyS2");

    } catch (err) {
        console.error("❌ Error connecting:", err.message);
    }
}


async function run() {
    await connect();
    startPolling(client, 1000, (data) => {
        console.log(data)
    })
}

run();
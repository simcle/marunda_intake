import ModbusRTU from "modbus-serial";

console.log('Starting Modbus RTU test...');

const client = new ModbusRTU();

async function connect() {
    try {
        await client.connectRTUBuffered("/dev/ttyACM0", {
            baudRate: 19200,
            dataBits: 8,
            stopBits: 1,
            parity: "none",
        });

        client.setID(1);       // Ganti sesuai slave ID
        client.setTimeout(1000);

        console.log("Connected to /dev/ttyS1");

    } catch (err) {
        console.error("❌ Error connecting:", err.message);
    }
}

async function readRegisters() {
    try {
        const res = await client.readHoldingRegisters(0, 10);  
        // mulai dari reg 0, length 4
        console.log("Data:", res.data);
        console.log('DATA Voltage: ', res.data[2] / 10)

    } catch (err) {
        console.error("❌ Read error:", err.message);
    }
}

async function run() {
    await connect();

    // Tambahkan delay setelah connect
    await new Promise(resolve => setTimeout(resolve, 300));

    setInterval(async () => {
        if (client.isOpen) {
            await readRegisters();
        } else {
            console.log("⚠ Port not open");
        }
    }, 1000);
}

run();
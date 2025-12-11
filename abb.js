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
        const res = await client.readHoldingRegisters(262, 2);  
        // mulai dari reg 0, length 4
        console.log("Data:", res.data);
        const buf = Buffer.alloc(4);
        buf.writeUInt16BE(res.data[0], 0);  // high word
        buf.writeUInt16BE(res.data[1], 2);  // low word
        const motorTorque = buf.readFloatBE(0); // atau LE jika format-nya little endian
        console.log('Motor Torque (%) =', motorTorque);

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
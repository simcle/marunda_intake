import ModbusRTU from "modbus-serial";

console.log('Starting Modbus RTU test...');

const client = new ModbusRTU();

async function connect() {
    try {
        await client.connectRTUBuffered("/dev/ttyS2", {
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: "none",
        });

        client.setID(2);  // pastikan sesuai ACS550 param 5302
        client.setTimeout(1000);

        console.log("Connected to /dev/ttyS2");

    } catch (err) {
        console.error("❌ Error connecting:", err.message);
    }
}

async function readRegisters() {
    try {
        // Baca 4 register: status, speed, current, DC voltage
        const res = await client.readHoldingRegisters(0, 4);

        const status = res.data[0];
        const speed = res.data[1] / 100;     // speed dalam Hz
        const current = res.data[2] / 10;    // arus dalam Ampere
        const dcVolt = res.data[3];          // DC link voltage (Volt)

        console.log("Status Word :", status.toString(16).toUpperCase());
        console.log("Speed (Hz)  :", speed);
        console.log("Current (A) :", current);
        console.log("DC Voltage  :", dcVolt);

    } catch (err) {
        console.error("❌ Read error:", err.message);
    }
}

async function run() {
    await connect();

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
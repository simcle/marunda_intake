import ModbusRTU from "modbus-serial";

console.log('Starting Modbus RTU test...');

const client = new ModbusRTU();

client.on("debug", msg => {
    console.log("[MODBUS]", msg);
});


async function connect() {
    try {
        await client.connectRTUBuffered("/dev/ttyS2", {
            baudRate: 19200,
            dataBits: 8,
            stopBits: 1,
            parity: "none",
        });

        client.setID(2);  // pastikan sesuai ACS550 param 5302
        client.setTimeout(1000);

        console.log("Connected to /dev/ttyS2");
        if (client._port) {
            client._port.on("data", d => {
                console.log("RX RAW:", d);
            });
        }


    } catch (err) {
        console.error("❌ Error connecting:", err.message);
    }
}

async function readRegisters() {
    try {
        // Baca 4 register: status, speed, current, DC voltage
        const res = await client.readHoldingRegisters(4, 1);
        console.log(res)
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
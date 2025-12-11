import ModbusRTU from "modbus-serial";

const rtu = new ModbusRTU()

const connectRtu = async () => {
    await rtu.connectRTUBuffered('/dev/ttyS2', {baudRate: 19200})
    rtu.setID(1)
}

await connectRtu()

const serverTCP = new ModbusRTU.ServerTCP({
    holding: Buffer.alloc(200), // tidak digunakan (gateway), tapi wajib ada
    input: Buffer.alloc(200)
}, {
    host: "0.0.0.0",
    port: 5020,
    debug: true,
    unitID: 1,
});

serverTCP.on("readHoldingRegisters", async (addr, length, cb) => {
    try {
        const res = await rtu.readHoldingRegisters(addr, length);
        cb(null, res.data);
    } catch (err) {
        console.log("RTU error:", err.message);
        cb(err);
    }
});


console.log("Modbus TCP Gateway running on port 5020");
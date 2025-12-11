import net from "net";
import Modbus from "jsmodbus";
import ModbusRTU from "modbus-serial";

// ==========================
// CONNECT TO RTU (MASTER)
// ==========================
const rtu = new ModbusRTU();

async function connectRTU() {
    try {
        await rtu.connectRTUBuffered("/dev/ttyS2", { baudRate: 19200 });
        rtu.setID(1);
        console.log("RTU connected");
    } catch (err) {
        console.log("RTU connection error:", err.message);
    }
}

await connectRTU();

// ==========================
// TCP SERVER (SLAVE)
// ==========================
const server = new net.Server();

const tcpServer = new Modbus.server.TCP(server, {
    holding: Buffer.alloc(0),  // tidak dipakai
    coils: Buffer.alloc(0),
    discrete: Buffer.alloc(0),
    input: Buffer.alloc(0),
    debug: true
});

// ==========================
// EVENT: READ HOLDING REGISTER (FC03)
// ==========================
tcpServer.on("readHoldingRegisters", async (request, reply) => {
    try {
        const addr = request.address;
        const len  = request.quantity;

        const res = await rtu.readHoldingRegisters(addr, len);
        console.log(res)
        reply(res.data);   // kirim balik ke TCP client
    } catch (err) {
        console.log("RTU read error:", err.message);
        reply(Modbus.errors.eio); // I/O error code
    }
});

// ==========================
// EVENT: READ INPUT REGISTER (FC04)
// ==========================
tcpServer.on("readInputRegisters", async (request, reply) => {
    try {
        const res = await rtu.readInputRegisters(request.address, request.quantity);
        reply(res.data);
    } catch (err) {
        reply(Modbus.errors.eio);
    }
});

// ==========================
// EVENT: WRITE SINGLE REGISTER (FC06)
// ==========================
tcpServer.on("writeSingleRegister", async (request, reply) => {
    try {
        await rtu.writeRegister(request.address, request.value);
        reply(request.value);
    } catch (err) {
        reply(Modbus.errors.eio);
    }
});

// ==========================
// START TCP SERVER
// ==========================
server.listen(5020, () => {
    console.log("Modbus Gateway transparent running on port 5020");
});
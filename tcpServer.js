import ModbusRTU from "modbus-serial";

const rtu = new ModbusRTU()

const connectRtu = async () => {
    await rtu.connectRTUBuffered('/dev/ttyS2', {baudRate: 19200})
    rtu.setID(1)
}

await connectRtu()

const vector = {
    getHoldingRegister: function(addr, unitID, callback) {
        // Asynchronous handling (with callback)
        setTimeout(function() {
            // callback = function(err, value)
            callback(null, addr + 8000);
        }, 10);
    },
}

const serverTCP = new ModbusRTU.ServerTCP(vector, { host: "0.0.0.0", port: 8502, debug: true, unitID: 1 });
serverTCP.on("socketError", function(err){
    // Handle socket error if needed, can be ignored
    console.error(err);
});
console.log("Modbus TCP Gateway running on port 5020");
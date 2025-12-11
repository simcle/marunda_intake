import ModbusRTU from "modbus-serial";

console.log('hallo')
const client = new ModbusRTU()

const connect = async () => {
    try {
        await client.connectRTUBuffered('/dev/ttyS2', {baudRate: 19200})
        client.setID(1)
        client.setTimeout(1000)
        
    } catch (error) {
        console.log('error connection', error)
    }
}

const readRegisters = async () => {
    try {
        const res = await client.readHoldingRegisters(1, 4)
        console.log(res)
    } catch (error) {
        console.log('Read Error', error)
    }
}

const run = async () => {
    await connect()
    setInterval(async () => {
        await readRegisters()
    }, 1000)
}

run()
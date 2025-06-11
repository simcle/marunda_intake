import ModbusRTU from "modbus-serial";

const client = new ModbusRTU()


const connectClient = async () => {
    await client.connectRTUBuffered('/dev/ttyS2', {baudRate: 9600})
    client.setID(1)

    setInterval(async () => {
        console.log('send request')
        const data = await client.readHoldingRegisters(0, 10)
        console.log('response')
        console.log(data) 
    }, 1000)
}

connectClient()
import ModbusRTU from "modbus-serial";

const client = new ModbusRTU()


const connectClient = async () => {
    await client.connectRTUBuffered('/dev/ttyS2', {baudRate: 19200})
    client.setID(1)

    setInterval(async () => {
        console.log('send request')
        try {
            const data = await client.readHoldingRegisters(1, 2)
            console.log('response')
            console.log(data) 
        } catch (error) {
            console.log(error.message)
        }
    }, 1000)
}

connectClient()
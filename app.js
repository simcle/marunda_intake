import ModbusRTU from "modbus-serial";

const client = new ModbusRTU()

const startPooling = async () => {
    await client.connectRTUBuffered('', {baudRate: 9600})
    client.setID(1)

    setInterval(() => {
        client.readHoldingRegisters(0, 10, (err, data) => {
            console.log(err)
            console.log(data)
        })
    }, 1000)
    
}


startPooling()
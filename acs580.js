// ======================================================
//  ACS580 Modebus Parameter Engine - Final Version
//  Supports: 16-bit & 32-bit Mode 0 addressing 
// ======================================================
import ModbusRTU from "modbus-serial";
const client = new ModbusRTU();

let pollingStopper = null;
let reconnecting = false;


// -----------------------
// LISTING PARAMETER
// -----------------------
const listing = [
    {
        name: 'Motor Speed Used',
        num: '01.01',
        unit: 'rpm',
        type: '32bit',
        scale: 100
    },
    {
        name: 'Output Frequency',
        num: '01.06',
        unit: 'Hz',
        type: '32bit',
        scale: 100
    },
    {
        name: 'Motor Current',
        num: '01.07',
        unit: 'A',
        type: '32bit',
        scale: 100
    },
    {
        name: 'Motor Torque',
        num: '01.10',
        unit: '%',
        type: '32bit',
        scale: 10
    },
    {
        name: 'DC Volt',
        num: '01.11',
        unit: 'V',
        type: '32bit',
        scale: 100
    },
    {
        name: 'Motor Power',
        num: '01.14',
        unit: 'kW/hp',
        type: '32bit',
        scale: 100
    },
    {
        name: 'mWh counter',
        num: '01.19',
        unit: 'mWh',
        type: '32bit',
        scale: 1
    },
    {
        name: 'kWh counter',
        num: '01.20',
        unit: 'kWh',
        type: '32bit',
        scale: 10
    },
]

// -----------------------
// HELPER: Parse "01.11"
// -----------------------
const parseNum = (num) => {
    const [group, index] = num.split(".").map(n => parseInt(n, 10))
    return {group, index}
}

// -----------------------
// HELPER: Get ABB Register (Mode 0)
// -----------------------
const getAbbRegister = (group, index, type) => {
    if(type === '16bit') {
        return 400000 + (100 * group) + index
    } else if(type === '32bit') {
        return 420000 + (200 * group) + (2 * index)
    }
}

// -----------------------
// HELPER: Convert ABB → Node.js address (zero-based)
// -----------------------
const abbToNodeAddress = (abb) => {
    return abb - 400001
}


// -----------------------
// GENERATE FINAL PARAM INFO
// -----------------------
const getParamInfo = (param) => {
    const { group, index } = parseNum(param.num)
    const abbRegister = getAbbRegister(group, index, param.type);
    const nodeRegister = abbToNodeAddress(abbRegister);

    return {
        ...param,
        group: group,
        index: index,
        abbRegister,
        nodeRegister,
        words: param.type === '32bit' ? 2 : 1
    }
}

// ======================================================
// UNIVERSAL READ FUNCTION
// ======================================================
const readParameter = async (client, param) => {
    const info = getParamInfo(param);

    // read registers
    const res = await client.readHoldingRegisters(info.nodeRegister, info.words);
    let buf = Buffer.from(res.buffer);

    let raw;

    if (info.type === "16bit") {
        raw = buf.readInt16LE(0);
    } else {
        // MOST ABB DRIVES USE LO-HI IN 32-bit
        raw = buf.swap16().readInt32LE(0);
    }

    const value = raw / info.scale;

    return {
        name: info.name,
        num: info.num,
        unit: info.unit,
        raw: raw,
        scale: info.scale,
        value
    };
}

// ======================================================
// READ ALL PARAMETERS
// ======================================================
const readAllParameters = async (client) => {
    const result = [];

    for (const param of listing) {
        try {
            const res = await readParameter(client, param);
            result.push(res);
        } catch (err) {
            result.push({
                name: param.name,
                error: err.message
            });
        }
    }

    return result;
}


const startPolling = async (client, intervalMs = 1000, callback = console.log) => {
    let timer = null;

    async function loop() {
        try {
            const data = await readAllParameters(client);
            callback(data);    // kirim hasilnya
        } catch (err) {
            console.error("Polling error:", err.message);
        }
    }

    // mulai interval
    timer = setInterval(loop, intervalMs);

    // panggilan pertama langsung execute
    loop();

    // return fungsi untuk stop polling
    return () => {
        clearInterval(timer);
        console.log("Polling stopped");
    };
}

async function connect() {
    try {
        await client.connectRTUBuffered("/dev/ttyS2", {
            baudRate: 19200,
            dataBits: 8,
            stopBits: 1,
            parity: "none",
        });

        client.setID(1);
        client.setTimeout(1000);

        console.log("✅ Connected to /dev/ttyS2");
        return true;

    } catch (err) {
        console.error("❌ Connection error:", err.message);
        return false;
    }
}

// =========================
// AUTO RECONNECT ENGINE
// =========================
async function ensureConnected() {
    if (client.isOpen) return true;

    if (reconnecting) return false;  // cegah reconnect ganda
    reconnecting = true;

    console.log("🔄 Attempting reconnect...");

    let ok = false;

    for (let i = 0; i < 5; i++) {
        ok = await connect();
        if (ok) break;

        console.log(`⏳ Retry ${i + 1} failed, waiting 2s...`);
        await new Promise(r => setTimeout(r, 2000));
    }

    reconnecting = false;

    if (!ok) {
        console.log("❌ Failed reconnecting after 5 attempts");
    }

    return ok;
}

// =========================
// READ LOOP WITH SELF-HEALING
// =========================
async function run() {
    await ensureConnected();

    // Start polling only once
    if (!pollingStopper) {
        pollingStopper = startPolling(client, 1000, (data) => {
            console.log("📊 Data:", data);
        });
    }

    // Loop forever to monitor disconnection and auto-reconnect
    while (true) {
        if (!client.isOpen) {
            console.log("⚠️ Connection lost, reconnecting...");
            await ensureConnected();
        }

        await new Promise(r => setTimeout(r, 1000));
    }
}

run();
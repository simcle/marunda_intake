// ======================================================
//  ACS580 Parameter Engine - Final Version
//  Supports: 16-bit & 32-bit Mode 0 addressing
// ======================================================

// -----------------------
// LISTING PARAMETER
// -----------------------
const listing = [
    {
        name: 'DC Volt',
        num: '01.11',
        unit: 'V',
        type: '32bit',
        scale: 100
    },
    {
        name: 'Motor Current',
        num: '01.07',
        unit: 'A',
        type: '32bit',
        scale: 100
    }
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
const getRegisterInfo = (param) => {
    const { group, index } = parseNum(param.num)
    const abb = getAbbRegister(group, index, param.type)
    const node = abbToNodeAddress(abb)

    return {
        ...param,
        group: group,
        index: index,
        abbRegister: abb,
        nodeRegister: node,
        words: param.type === '32bit' ? 2 : 1
    }
}

// ======================================================
// UNIVERSAL READ FUNCTION
// ======================================================
export async function readParameter(client, param) {
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
export async function readAllParameters(client) {
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


export function startPolling(client, intervalMs = 1000, callback = console.log) {
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
import ModbusRTU from "modbus-serial";
import { startPolling } from "./acs580.js";

const client = new ModbusRTU();

let pollingStopper = null;
let reconnecting = false;

async function connect() {
    try {
        console.log("🔌 Connecting to /dev/ttyS2 ...");

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
    console.log('checking client', client.isOpen)
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
const data = Buffer.from([0x7a, 0x33]);

const val = data.readInt16BE()
console.log('Buffer:', val);
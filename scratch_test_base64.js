const fs = require('fs');
const path = require('path');
try {
    const file = fs.readFileSync(path.join(__dirname, 'test_real_gen.pdf'));
    const b64 = file.toString('base64');
    const dec = Buffer.from(b64, 'base64');
    console.log('Original size:', file.length);
    console.log('Decoded size:', dec.length);
    console.log('Equal:', file.equals(dec));
} catch (e) {
    console.error(e);
}

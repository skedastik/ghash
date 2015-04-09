var sharp = require('sharp');

module.exports = ghash;

var MIN_RESOLUTION  = 2;
var MAX_RESOLUTION  = 8;
var OUTPUT_BUF_SIZE = MAX_RESOLUTION * MAX_RESOLUTION / 8;

// generate a 64-bit hash given an input image (buffer or file path)
function ghash(input, resolution, callback) {
    if (resolution > MAX_RESOLUTION || resolution < MIN_RESOLUTION) {
        throw 'Invalid resolution (' + resolution + ') passed to ghash';
    }
    // normalize before processing
    sharp(input)
    .interpolateWith(sharp.interpolator.bilinear)
    .resize(resolution, resolution)
    .flatten()
    .grayscale()
    .raw()
    .toBuffer()
    .then(calculateHash)
    .then(function(hash) { callback(null, hash); })
    .error(callback);
}

function calculateHash(inputBuf) {
    var outputBuf = new Buffer(OUTPUT_BUF_SIZE);
    var octet = 0;
    var bit = 0;
    var iters = inputBuf.length - 1;
    outputBuf.fill(0);
    // calculate hash from luminosity gradient
    for (var i = 0; i < iters; i++) {
        if (inputBuf[i] < inputBuf[i + 1]) {
            outputBuf[octet] |= 1 << bit;
        }
        if (++bit == 8) {
            octet++;
            bit = 0;
        }
    }
    // wrap to first pixel
    if (inputBuf[i] < inputBuf[0]) {
        outputBuf[octet] |= 1 << bit;
    }
    return outputBuf;
}
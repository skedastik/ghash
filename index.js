var sharp = require('sharp');
var Promise = require('bluebird');

module.exports = GHash;

var MIN_RESOLUTION  = 2;
var MAX_RESOLUTION  = 8;
var OUTPUT_BUF_SIZE = MAX_RESOLUTION * MAX_RESOLUTION / 8;

function GHash(input) {
    if (!(this instanceof GHash)) {
        return new GHash(input);
    }
    this.input = input;
    this.options = {
        resolution: MAX_RESOLUTION
    };
    return this;
}

GHash.prototype.resolution = function(resolution) {
    if (resolution > MAX_RESOLUTION || resolution < MIN_RESOLUTION) {
        throw 'Invalid resolution (' + resolution + ') passed to ghash';
    }
    this.options.resolution = resolution;
    return this;
}

GHash.prototype.debugOut = function(pathAndPrefix) {
    this.options.debugOut = pathAndPrefix;
    return this;
}

GHash.prototype.calculate = function(callback) {
    var image = sharp(this.input)
    .interpolateWith(sharp.interpolator.bilinear)
    .resize(this.options.resolution, this.options.resolution)
    .flatten()
    .grayscale();
    
    if (this.options.debugOut) {
        image.toFile(this.options.debugOut + '-ghash' + this.options.resolution + '.png');
    }
    
    var hash = image
    .raw()
    .toBuffer()
    .then(calculateHash);
    
    if (callback) {
        return hash.then(function(hash) {
            callback(null, hash);
        })
        .error(callback);
    }
    
    return hash;
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
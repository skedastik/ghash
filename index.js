var sharp = require('sharp');
var Promise = require('bluebird');

module.exports = GHash;

var MIN_RESOLUTION  = 2;
var MAX_RESOLUTION  = 32;
var DEFAULT_RESOLUTION = 8;
var MIN_FUZZINESS   = 0;
var MAX_FUZZINESS   = 255;

function GHash(input) {
    if (!(this instanceof GHash)) {
        return new GHash(input);
    }
    this.input = input;
    this.options = {
        resolution: DEFAULT_RESOLUTION,
        fuzziness: 0
    };
    return this;
}

GHash.prototype.resolution = function(resolution) {
    if (resolution > MAX_RESOLUTION || resolution < MIN_RESOLUTION) {
        throw 'Invalid resolution (' + resolution + ') passed to ghash';
    }
    this.options.resolution = resolution;
    return this;
};

GHash.prototype.debugOut = function(pathAndPrefix) {
    this.options.debugOut = pathAndPrefix;
    return this;
};

GHash.prototype.fuzziness = function(fuzziness) {
    if (fuzziness > MAX_FUZZINESS || fuzziness < MIN_FUZZINESS) {
        throw 'Invalid resolution (' + fuzziness + ') passed to ghash';
    }
    this.options.fuzziness = fuzziness;
    return this;
};

GHash.prototype.calculate = function(callback) {
    var that = this;
    var image = sharp(this.input)
    // note: choice of interpolator affects hash value
    .resize(this.options.resolution, this.options.resolution, { interpolator: sharp.interpolator.bilinear })
    .flatten()
    .grayscale();

    // TODO: An additional dynamic-range normalization pass (essentially zero-mean + feature-scaling) would probably be helpful here, as a static `fuzziness` value will have disproportionate effect for low vs. high contrast images.

    if (this.options.debugOut) {
        image.toFile(this.options.debugOut + '.png');
    }

    var hash = image
    .raw()
    .toBuffer()
    .then(function(buf) {
        return calculateHash(buf, that.options.resolution, that.options.fuzziness);
    });

    if (callback) {
        return hash.then(function(hash) {
            callback(null, hash);
        })
        .error(callback);
    }

    return hash;
};

function calculateHash(inputBuf, resolution, fuzziness) {
    var outputBuf = new Buffer(2 * resolution * resolution / 8);
    outputBuf.fill(0);

    var octet = 0;
    var bit = 0;

    // calculate 1st half of hash, scanning horizontally
    for (var i = 0; i < inputBuf.length - 1; i++) {
        if (Math.abs(inputBuf[i + 1] - inputBuf[i]) > fuzziness) {
            outputBuf[octet] |= 1 << bit;
        }
        if (++bit == 8) {
            octet++;
            bit = 0;
        }
    }
    // wrap to top-left pixel
    if (Math.abs(inputBuf[0] - inputBuf[i]) > fuzziness) {
        outputBuf[octet] |= 1 << bit;
    }

    // calculate 2nd half of hash, scanning vertically
    var iv = [];
    for (var x = resolution - 1; x >= 0; x--) {
        for (var y = 0; y < resolution; y++) {
            iv.push(y * 4 + x);
        }
    }
    for (var i = 0; i < iv.length - 1; i++) {
        if (Math.abs(inputBuf[iv[i + 1]] - inputBuf[iv[i]]) > fuzziness) {
            outputBuf[octet] |= 1 << bit;
        }
        if (++bit == 8) {
            octet++;
            bit = 0;
        }
    }
    // wrap to top-right pixel
    if (Math.abs(inputBuf[iv[0]] - inputBuf[iv[i]]) > fuzziness) {
        outputBuf[octet] |= 1 << bit;
    }

    return outputBuf;
}

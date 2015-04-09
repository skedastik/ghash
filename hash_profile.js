// compare hashing results under various attacks and resolutions

var hd = require('hamming-distance');
var sprintf = require('sprintf-js').sprintf;
var Promise = require('bluebird');
var ghash = Promise.promisify(require('./index'));

var BASE_PATH = 'test/sample/';

var resolutions = [8, 4, 3];

var files = [
    'orig.jpg',
    'attacked-compressed.jpg',
    'attacked-color-curved.jpg',
    'attacked-grayscale.jpg',
    'attacked-contrast.jpg',
    'attacked-gamma.jpg',
    'attacked-noise.jpg',
    'attacked-gaussian-blur.jpg',
    'attacked-scaled.jpg',
    'attacked-new-feature.jpg',
    'attacked-padded.jpg',
    'attacked-sheared.jpg',
    'attacked-crop-centered.jpg',
    'attacked-rotated.jpg',
    'control.jpg',
];

var hashes = Promise.map(resolutions, function(resolution) {
    return Promise.map(files, function(path) {
        return ghash(BASE_PATH + path, resolution);
    });
});

console.log('Calculating hashes at the following resolutions: ' + resolutions + '\n');

Promise.all(hashes).then(function(hashSets) {
    var format = '%-32s %-6s %-6s %s';
    console.log(sprintf(format, 'Input', '8', '4', '3'));
    console.log(sprintf('------------------------------------------------'));
    for (var i = 0; i < files.length; i++) {
        console.log(sprintf('%-32s %-6d %-6d %d',
            files[i],
            hd(hashSets[0][0], hashSets[0][i]),
            hd(hashSets[1][0], hashSets[1][i]),
            hd(hashSets[2][0], hashSets[2][i])
        ));
    }
    console.log('\nNumbered columns indicate Hamming distance from original image at respective resolutions.');
});
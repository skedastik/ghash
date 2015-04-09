// compare hashing results under various attacks and resolutions

var hd = require('hamming-distance');
var sprintf = require('sprintf-js').sprintf;
var Promise = require('bluebird');
var ghash = require('./index');

var BASE_PATH = 'test/sample/';
var resolutions = [8, 4, 3];
var extension = '.jpg';
var files = [
    'orig',
    'attacked-compressed',
    'attacked-color-curved',
    'attacked-grayscale',
    'attacked-contrast',
    'attacked-gamma',
    'attacked-noise',
    'attacked-gaussian-blur',
    'attacked-scaled',
    'attacked-new-feature',
    'attacked-padded',
    'attacked-sheared',
    'attacked-crop-centered',
    'attacked-rotated',
    'control',
];

var hashes = Promise.map(resolutions, function(resolution) {
    return Promise.map(files, function(filename) {  
        return ghash(BASE_PATH + filename + extension)
        .resolution(resolution)
        .debugOut('var/' + filename)
        .calculate();
    });
});

Promise.all(hashes).then(function(hashSets) {
    console.log('\nHashes / Hamming distance from original at respective resolutions:\n');
    console.log(sprintf('%-32s %-24s %-24s %s', 'Input', '8', '4', '3'));
    console.log(sprintf('-------------------------------------------------------------------------------------------------------'));
    for (var i = 0; i < files.length; i++) {
        console.log(sprintf(
            '%-32s %s / %-5d %s / %-5d %s / %d',
            files[i],
            hashSets[0][i].toString('hex'), hd(hashSets[0][0], hashSets[0][i]),
            hashSets[1][i].toString('hex'), hd(hashSets[1][0], hashSets[1][i]),
            hashSets[2][i].toString('hex'), hd(hashSets[2][0], hashSets[2][i])
        ));
    }
    console.log('');
});
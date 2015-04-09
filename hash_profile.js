// compare hashing results under various attacks and resolutions

var hd = require('hamming-distance');
var sprintf = require('sprintf-js').sprintf;
var Promise = require('bluebird');
var ghash = require('./index');

var BASE_PATH = 'test/sample/';
var EXTENSION = '.jpg';

var fuzzinesses = [0, 5, 10];
var resolutions = [8, 4, 3];
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
    'control'
];

var hashes = Promise.map(fuzzinesses, function(fuzziness) {
    return Promise.map(resolutions, function(resolution) {
        return Promise.map(files, function(filename) {  
            return ghash(BASE_PATH + filename + EXTENSION)
            .resolution(resolution)
            // .debugOut('var/' + filename)
            .fuzziness(fuzziness)
            .calculate();
        });
    });
});

Promise.all(hashes).then(function(hashSets) {
    console.log('(Hashes / Hamming distance) at...\n');
    for (var j = 0; j < fuzzinesses.length; j++) {
        console.log('fuzziness = ' + fuzzinesses[j] + '\n');
        console.log(sprintf('    %-32s %-24s %-24s %s', 'Input', 'resolution = 8', 'resolution = 4', 'resolution = 3'));
        console.log(sprintf('    -------------------------------------------------------------------------------------------------------'));
        for (var i = 0; i < files.length; i++) {
            console.log(sprintf(
                '    %-32s %s / %-5d %s / %-5d %s / %d',
                files[i],
                hashSets[j][0][i].toString('hex'), hd(hashSets[j][0][0], hashSets[j][0][i]),
                hashSets[j][1][i].toString('hex'), hd(hashSets[j][1][0], hashSets[j][1][i]),
                hashSets[j][2][i].toString('hex'), hd(hashSets[j][2][0], hashSets[j][2][i])
            ));
        }
        console.log('');
    }
});
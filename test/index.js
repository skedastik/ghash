// test

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var Promise = require('bluebird');
var ghash = require('../index');

chai.use(chaiAsPromised);
chai.should();

describe('ghash', function() {
    it('should fail when given a bad input image', function() {
        return ghash('test/sample/nonexistent.png').calculate().should.eventually.be.rejected;
    });
    
    it('should succeed when given an a valid input image', function() {
        return ghash('test/sample/solid.png').calculate().should.eventually.be.fulfilled;
    });
    
    it('should return a zeroed-out hash for a solid input image', function() {
        var zeroBuffer = new Buffer([0,0,0,0,0,0,0,0]);
        return ghash('test/sample/solid.png')
        .calculate()
        .call('compare', zeroBuffer).should.eventually.equal(0);
    });

    it('should generate identical hashes for identical images', function() {
        return Promise.all([
            ghash('test/sample/orig.jpg').calculate(),
            ghash('test/sample/orig-copy.jpg').calculate()
        ]).then(function(hashes) {
            return Buffer.compare(hashes[0], hashes[1]);
        }).should.eventually.equal(0);
    });

    it('should generate different hashes for different images', function() {
        return Promise.all([
            ghash('test/sample/orig.jpg').calculate(),
            ghash('test/sample/control.jpg').calculate()
        ]).then(function(hashes) {
            return Buffer.compare(hashes[0], hashes[1]);
        }).should.eventually.not.equal(0);
    });
});
// test

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var Promise = require('bluebird');
var ghash = Promise.promisify(require('../index'));

chai.use(chaiAsPromised);
chai.should();

describe('ghash', function() {
    it('should fail when given a bad input image', function() {
        return ghash('test/sample/nonexistent.png', 8).should.eventually.be.rejected;
    });
    
    it('should succeed when given an a valid input image', function() {
        return ghash('test/sample/solid.png', 8).should.eventually.be.fulfilled;
    });
    
    it('should return a zeroed-out hash for a solid input image', function() {
        var zeroBuffer = new Buffer([0,0,0,0,0,0,0,0]);
        return ghash('test/sample/solid.png', 8).call('compare', zeroBuffer).should.eventually.equal(0);
    });
    
    it('should generate identical hashes for identical images', function() {
        return Promise.all([
            ghash('test/sample/orig.jpg', 8),
            ghash('test/sample/orig-copy.jpg', 8)
        ]).then(function(hashes) {
            return Buffer.compare(hashes[0], hashes[1]);
        }).should.eventually.equal(0);
    });
    
    it('should generate different hashes for different images', function() {
        return Promise.all([
            ghash('test/sample/orig.jpg', 8),
            ghash('test/sample/control.jpg', 8)
        ]).then(function(hashes) {
            return Buffer.compare(hashes[0], hashes[1]);
        }).should.eventually.not.equal(0);
    });
});
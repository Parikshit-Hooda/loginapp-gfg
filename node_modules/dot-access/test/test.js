var dot = require('..');
var should = require('chai').should();
var assert = require('chai').assert;

describe('dot', function () {
  it('should return get the correct value', function () {
    var user = {
      name: {
        first: 'Joe',
        last: 'M',
        status: {
          banned: true
        }
      }
    };
    dot.get(user, 'name').should.be.an('object');
    dot.get(user, 'name.first').should.equal('Joe');
    dot.get(user, 'name.last').should.equal('M');
    dot.get(user, 'name.status.banned').should.equal(true);
    assert.equal(dot.get(user, 'nam'), undefined);
  });

  it('should set the correct value at the correct path', function () {
    var user = {
      name: {
        first: 'Joe',
        last: 'M',
        status: {
          banned: true
        }
      }
    };
    dot.set(user, 'name.first', 'Bob');
    user.name.first.should.equal('Bob');
    dot.set(user, 'name.status.banned', false);
    user.name.status.banned.should.equal(false);
    dot.set(user, 'name.middle', 'H');
    user.name.middle.should.equal('H');
    dot.set(user, 'name', 'Bob');
    user.name.should.equal('Bob');
    dot.set(user, 'location.address', 'Sydney');
    user.location.address.should.equal('Sydney');
  });
});
const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  test('1 stock', function(done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({stock: 'goog'})
      .end(function(err, res) {
        assert.Equals(res.body['stockData']['stock'], 'goog')
        assert.NotNull(res.body['stockData']['price'])
        assert.NotNull(res.body['stockData']['likes'])
        done();
    });
  });
  
  test('1 stock with Like', function(done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({stock: 'aapl', like: true})
      .end(function(err,res) {
        assert.Equals(res.body['stockData']['stock'], 'aapl')
        assert.Equals(res.body['stockData']['likes'], 1)
        done();
    });
  });
  
  test('1 stock with Like again (ensure likes arent double counted)', function(done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({stock: 'aapl', like: true})
      .end(function(err,res) {
        assert.Equals(res.body, 'Error: Only 1 Like per IP Allowed')
        done();
    });
  });
  

});

'use strict';

var request = require('supertest'),
app = require('../example');

describe('create routes', function () {
  describe('/login', function () {
    it('should GET', function (done) {
      request(app).get('/login')
        .expect(200, done);
    });

    it('should POST', function (done) {
      request(app).post('/login')
        .expect(200, done);
    });

    it("shouldn't PUT", function (done) {
      request(app).put('/login')
        .expect(404, done);
    });

    it("shouldn't DELETE", function (done) {
      request(app).delete('/login')
        .expect(404, done);
    });
  });
  describe('/test', function () {
    it('should GET', function (done) {
      request(app).get('/test')
        .expect('Location', '/login?returnUrl=%2Ftest')
        .expect(302, done);
    });

    it("shouldn't POST", function (done) {
      request(app).post('/test')
        .expect(404, done);
    });

    it("shouldn't PUT", function (done) {
      request(app).put('/test')
        .expect(404, done);
    });

    it("shouldn't DELETE", function (done) {
      request(app).delete('/test')
        .expect(404, done);
    });
  });
});

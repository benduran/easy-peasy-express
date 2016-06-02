'use strict';

// Set working directory to the test app so require paths are resolved correctly
var request = require('supertest'),
    _ = require('lodash'),
    app = require('../example'),
    chai = require('chai');

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
    it('should GET & redirects to /login?returnUrl=%2Ftest', function (done) {
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

  describe('/redirectPlease', function () {
    it('should GET & does not redirect to /login?returnUrl=%2Ftest', function (done) {
      request(app).get('/redirectPlease')
        .expect("Login")
        .expect(200, done);
    });

    it("shouldn't POST", function (done) {
      request(app).post('/redirectPlease')
        .expect(404, done);
    });

    it("shouldn't PUT", function (done) {
      request(app).put('/redirectPlease')
        .expect(404, done);
    });

    it("shouldn't DELETE", function (done) {
      request(app).delete('/redirectPlease')
        .expect(404, done);
    });
  });
});

describe('redirects', function () {
  describe('Redirects', function () {
    it('should GET /test & redirects to /login?returnUrl=%2Ftest', function (done) {
      request(app).get('/test')
        .expect(function (res) {
          chai.expect(res.headers.location).to.be.equal('/login?returnUrl=%2Ftest');
        })
        .expect(302, done);
    });
  });

  describe('Redirects & Keeps URL', function () {
    it('should GET /redirectPlease & does not set header.location', function (done) {
      request(app).get('/redirectPlease')
        .expect("Login")
        .expect(function (res) {
          chai.expect(res.headers.location).to.be.undefined;
        })
        .expect(200, done);
    });
  });
});

describe('POST Redirects', function () {
  describe('Redirects', function () {
    it('should POST /post/redirectto & redirects to /post/redirectionpost', function (done) {
      request(app).post('/post/redirectto')
      .expect(function (res) {
        chai.expect(_.trimEnd(res.headers.location, '?')).to.be.equal('/post/redirectionpost');
      })
      .expect(307, done);
    });
  });
  describe('Redirects', function () {
    it('shouldn\'t GET /post/redirectto', function (done) {
      request(app).get('/post/redirectto')
      .expect(404, done);
    });
  });
  describe('Redirects', function () {
    it('should POST /post/redirectionpost', function (done) {
      request(app).post('/post/redirectionpost')
      .expect(function (res) {
        chai.expect(res.body.postRedirect).to.be.equal('success!');
      })
      .expect(200, done);
    });
  });
  describe('Redirects', function () {
    it('should not GET /post/redirectionpost', function (done) {
      request(app).get('/post/redirectionpost')
      .expect(404, done);
    });
  });
});

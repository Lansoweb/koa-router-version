'use strict';

const request = require('supertest');
const expect = require('chai').expect;
const Koa = require('koa');
const KoaRouter = require('koa-router');
const api = require('../index');

const handler = () => (ctx, next) => {
  ctx.body = (ctx.body || []);
  return next();
};

describe('KoaRouterVersion', function() {
  let app;
  let server;

  before(() => {
    app = new Koa();
    let router = new KoaRouter();
    router.get('todo.list', '/todo', api.version(
      {
        '1.1.0': handler(),
        '1.0.0': handler(),
        '2.0.0': handler()
      }
    ));

    router.get('path.list', '/:version(v\\d)?/path', api.version(
      {
        '1.1.0': handler(),
        '1.0.0': handler(),
        '2.0.0': handler()
      }
    ));

    router.get('renamed.list', '/:renamed(v\\d)?/renamed', api.version(
      {
        '1.1.0': handler(),
        '1.0.0': handler(),
        '2.0.0': handler()
      },
      {
        routeParam: 'renamed'
      }
    ));

    router.get('defaultVersion', '/default-todo-version', api.version(
      {
        '1.1.0': handler(),
        '1.0.0': handler(),
        '2.0.0': handler()
      },
      {
        defaultVersion: '1.0.0'
      }
    ));
    router.get('todo2.list', '/todo2', api.version({'1.0.0': handler()}));
    router.get('todo3.list', '/todo3', api.version({'1.3.0': handler()}, { fallbackLatest:true }));
    app.use(router.routes());
    server = app.listen(3001);
  });

  after(async () => {
    await server.close();
  });

  it('should match a single version', function(done) {

    request(server)
      .get('/todo2')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['x-api-version']).to.equal('1.0.0');
        done();
      });
  });

  it('should match the latest version', function(done) {

    request(server)
      .get('/todo')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['x-api-version']).to.equal('2.0.0');
        done();
      });
  });

  it('should respect request header with exact version', function(done) {

    request(server)
      .get('/todo')
      .set('Accept-Version', '1.0.0')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['x-api-version']).to.equal('1.0.0');
        done();
      });
  });

  it('should respect request header with caret version', function(done) {

    request(server)
      .get('/todo')
      .set('Accept-Version', '^1.0')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['x-api-version']).to.equal('1.1.0');
        done();
      });
  });

  it('should respect request header with more versions', function(done) {

    request(server)
      .get('/todo')
      .set('Accept-Version', '^2.0')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['x-api-version']).to.equal('2.0.0');
        done();
      });
  });

  it('should throw an error if requested an invalid version', function(done) {

    request(server)
      .get('/todo')
      .set('Accept-Version', '^3.0')
      .end(function(err, res) {
        expect(res.statusCode).to.equal(400);
        expect(res.text).to.equal('Version ^3.0 is not supported');
        done();
      });
  });

  it('should use latest if requested an invalid version', function(done) {

    request(server)
      .get('/todo3')
      .set('Accept-Version', '^3.0')
      .end(function(err, res) {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['x-api-version']).to.equal('1.3.0');
        done();
      });
  });

  it('should match a single version via path', function(done) {

    request(server)
      .get('/v1/path')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['x-api-version']).to.equal('1.1.0');
        done();
      });
  });

  it('should match a single version via path', function(done) {

    request(server)
      .get('/v2/path')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['x-api-version']).to.equal('2.0.0');
        done();
      });
  });

  it('should match latest version via empty path', function(done) {

    request(server)
      .get('/path')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['x-api-version']).to.equal('2.0.0');
        done();
      });
  });


  it('should choose path over header', function(done) {

    request(server)
      .get('/v2/path')
      .set('Accept-Version', '^1.0')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['x-api-version']).to.equal('2.0.0');
        done();
      });
  });

  it('should throw an error if requested an invalid version via path', function(done) {

    request(server)
      .get('/v3/path')
      .end(function(err, res) {
        expect(res.statusCode).to.equal(400);
        expect(res.text).to.equal('Version 3 is not supported');
        done();
      });
  });

  it('should accept a renamed version path', function(done) {

    request(server)
      .get('/v1/renamed')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['x-api-version']).to.equal('1.1.0');
        done();
      });
  });

  it('should use default version', function(done) {

    request(server)
      .get('/default-todo-version')
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['x-api-version']).to.equal('1.0.0');
        done();
      });
  });

});

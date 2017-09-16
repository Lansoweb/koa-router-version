'use strict';

const semver = require('semver');

function KoaRouterVersion() {

  this.options = {
    requestHeader: 'Accept-Version',
    responseHeader: 'X-Api-Version',
    fallbackLatest: false
  };
}

KoaRouterVersion.prototype.set = function(key, value) {
  if (arguments.length === 1) {
    return this.options[key];
  }

  this.options[key] = value;
  return this;
};

KoaRouterVersion.prototype.get = KoaRouterVersion.prototype.set;

function find(requested, tuples, fallbackUnknown = false) {
  if (requested === null || requested === '*') {
    return tuples[0];
  }
  for (let i=0; i<tuples.length; i++) {
    if (semver.satisfies(tuples[i].version, requested)) {
      return tuples[i];
    }
  }
  if (fallbackUnknown) {
    return tuples[0];
  }

  return null;
}

KoaRouterVersion.prototype.version = function(versions, options = {}) {
  let tuples = [];

  for (let key in versions) tuples.push({version: key, cb: versions[key]});
  tuples.sort(function(a, b) {
    a = a.version;
    b = b.version;

    return semver.lt(a, b) ? 1 : (semver.gt(a, b) ? -1 : 0);
  });

  return (ctx, next) => {
    const requested = ctx.get(options.requestHeader || this.options.requestHeader) || null;

    let found =find(requested, tuples, options.fallbackLatest || this.options.fallbackLatest);
    if (found) {
      ctx.state.apiVersion = found.version;
      ctx.set(options.responseHeader || this.options.responseHeader, ctx.state.apiVersion);
      return found.cb(ctx, next);
    }
    ctx.throw(400, requested + ' version is not supported2');
  };
};

let koaApiVersion = module.exports = exports = new KoaRouterVersion;

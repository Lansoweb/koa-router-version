'use strict';

const semver = require('semver');

function KoaRouterVersion() {

  this.options = {
    requestHeader: 'Accept-Version',
    responseHeader: 'X-Api-Version',
    routeParam: 'version',
    fallbackLatest: false,
    defaultVersion: null
  };
}

function find(requested, tuples, fallbackLatest = false) {
  if (requested === null || requested === '*') {
    return tuples[0];
  }
  for (let i=0; i<tuples.length; i++) {
    if (semver.satisfies(tuples[i].version, requested)) {
      return tuples[i];
    }
  }
  if (fallbackLatest) {
    return tuples[0];
  }

  return null;
}

KoaRouterVersion.prototype.version = function(versions, options = {}) {
  let tuples = [];

  if (options.fallbackLatest && options.defaultVersion) {
    throw new Error('Can not set options "fallbackLatest" and "defaultVersion" at same time');
  }

  for (let key in versions) tuples.push({version: key, cb: versions[key]});
  tuples.sort(function(a, b) {
    a = a.version;
    b = b.version;

    return semver.lt(a, b) ? 1 : -1;
  });

  return (ctx, next) => {
    let requested = null;

    const routeParam = options.routeParam || this.options.routeParam;
    if (
      routeParam !== '' &&
      ctx.params.hasOwnProperty(routeParam) &&
      typeof ctx.params[routeParam] === 'string'
    ) {
      requested = ctx.params[routeParam].substr(1);
    } else {
      requested = ctx.get(options.requestHeader || this.options.requestHeader) || null;
    }
    if (!requested && options.defaultVersion) {
      requested = options.defaultVersion;
    }
    let found = find(requested, tuples, options.fallbackLatest || this.options.fallbackLatest);
    if (found) {
      ctx.state.apiVersion = found.version;
      ctx.set(options.responseHeader || this.options.responseHeader, ctx.state.apiVersion);
      return found.cb(ctx, next);
    }
    ctx.throw(400, 'Version ' + requested + ' is not supported');
  };
};

let koaRouterVersion = module.exports = exports = new KoaRouterVersion;

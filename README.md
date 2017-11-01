# koa-router-version

[![Build Status](http://img.shields.io/travis/Lansoweb/koa-router-version.svg?style=flat)](http://travis-ci.org/Lansoweb/koa-router-version)
[![NPM Downloads](https://img.shields.io/npm/dm/koa-router-version.svg?style=flat)](https://npmjs.org/package/koa-router-version)
[![Coverage Status](https://coveralls.io/repos/github/Lansoweb/koa-router-version/badge.svg?branch=develop)](https://coveralls.io/github/Lansoweb/koa-router-version?branch=develop)

Semantic Versioning routing for [Koa](https://github.com/koajs/koa)

Allows you to use [Semantic Versioning](http://semver.org/) routes.

**Requisites:**

*   [Node.js](https://nodejs.org) >= 7.6.0
*   [Koa](https://github.com/koajs/koa) >= 2.0.0
*   [Koa Router](https://github.com/alexmingoia/koa-router) >= 7.0.0

## Installation

```sh
npm install --save koa-router-version

# with yarn:
yarn add koa-router-version
```

## Usage

A basic usage:

```js
const Koa = require('koa');
const Router = require('koa-router');
const api = require('koa-router-version');

const list = require('./list');
const detail = require('./detail');
const detail2 = require('./detail2');

const app = new Koa();
const router = new Router();

// Defines a version 1.0.0 for todo list
router.get('todo.list', '/todo', api.version({'1.0.0': list}));

// Defines 2 versions (order is NOT important)
router.get('todo.detail', '/todo/:id', api.version({
    '1.1.0': detail,
    '2.1.3': detail2
}))

// You can specify a route param as version. Will accept both /todo/321 and /v1/todo/321 
router.get('todo.detail', '/:version(v\\d)?/todo/:id', api.version({
    '1.1.0': detail,
    '2.1.3': detail2
}))

app.use(router.routes());

app.listen(3000);
```

For client usage:

```sh
# Latest version
$ curl -i http://localhost:3000/todo/1
HTTP/1.1 200 Accepted
X-Api-Version: 2.1.3
<more headers>

{"todo": {}}

# Specifying a version
$ curl -i -H "Accept-Version: ^1.0" http://localhost:3000/todo/1
HTTP/1.1 200 Accepted
X-Api-Version: 1.1.0
<more headers>

{"todo": {}}

# Specifying a version via path
$ curl -i http://localhost:3000/v1/todo/1
HTTP/1.1 200 Accepted
X-Api-Version: 1.1.0
<more headers>

{"todo": {}}

$ curl -i -H "Accept-Version: ~2" http://localhost:3000/todo/1
HTTP/1.1 200 Accepted
X-Api-Version: 2.1.3
<more headers>

{"todo": {}}

# Path has higher priority than header
$ curl -i -H "Accept-Version: ~2" http://localhost:3000/v1/todo/1
HTTP/1.1 200 Accepted
X-Api-Version: 1.1.0
<more headers>

{"todo": {}}

# Unknown version
$ curl -H "Accept-Version: ^3.0" http://localhost:3000/todo/1
HTTP/1.1 400 Bad Request
<more headers>

Version ^3 is not supported
```

### Version state variable

You can access the used version through the ctx.state:

```js
router.get('todo.list', '/todo', api.version({'1.0.0': ctx => {
  ctx.body = ctx.state.apiVersion;
}));
```

## Options

### requestHeader

The default header is ```Accept-Version```, but you can change:
 
```js
router.get('todo.list', '/todo', api.version(
  {'1.0.0': list},
  { requestHeader: 'X-Request-Version' }
));
```

### responseHeader

The default header is ```X-Api-Version```, but you can change:
 
```js
router.get('todo.list', '/todo', api.version(
  {'1.0.0': list},
  { responseHeader: 'X-Version' }
));
```

### routeParam

This module expects the path as ```v``` followed by a single number:
* v1 is equivalent to ^1
* v2 is equivalent to ^2
* v11 is equivalent to ^11

The default param is ```version```, but you can change it:
 
```js
router.get('todo.list', '/:myversion(v\\d)/todo', api.version(
  {'1.0.0': list},
  { routeParam: 'myversion' }
));
```

In order to make version optional and use the latest, use the ```?``` regex at the end:
 
```js
router.get('todo.list', '/:myversion(v\\d)?/todo', api.version(
  {'1.0.0': list},
  { routeParam: 'myversion' }
));
```
 
### fallbackLatest

When the requested version is not found, the default response is an error, 
but you can choose to use the latest version:
   
```js
router.get('todo.list', '/todo', api.version(
  {'1.0.0': list},
  { fallbackLatest: true }
));
```

```sh
$ curl -i -H "Accept-Version: ^3.1.9" http://localhost:3000/todo/1
HTTP/1.1 200 Accepted
X-Api-Version: 2.1.3
<more headers>

{"todo": {}}
```

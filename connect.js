const EventEmitter = require('events').EventEmitter;
const finalhandler = require('finalhandler');
const http = require('http');
const merge = require('utils-merge');
const parseUrl = require('parseurl');
const { env } = require('process');

module.exports = createServer;

var proto = {};

var defer = typeof setImmediate === 'function'
  ? setImmediate
  : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }

function createServer() {
  
  function app(req, res, next) {
    app.handle(req, res, next);
  }
  merge(app, proto);
  merge(app, EventEmitter.prototype);
  app.route = '/';
  app.stack = [];
  return app;
}

proto.use = function use(route, fn) {
  var handle = fn;
  var path = route;

  if (typeof route !== 'string') {
    handle = route;
    path = '/';
  }

  if (typeof handle.handle === 'function') {
    var server = handle;
    server.route = path;
    handle = function (req, res, next) {
      server.handle(req, res, next);
    }
  }

  if (handle instanceof http.Server) {
    handle = handle.listeners('request')[0];
  }

  if (path[path.length - 1] === '/') {
    path = path.slice(0, -1);
  }

  this.stack.push({ route: path, handle: handle });
  return this;
}

proto.handle = function handle(req, res, out) {
  var index = 0;
  var protohost = getProtohost(req.url) || '';
  var removed = '';
  var slashAdded = false;
  var stack = this.stack;

  var done = out || finalhandler(req, res, {
    env: env,
    onerror: logerror
  })

  req.originalUrl = req.originalUrl || req.url;

  function next(err) {
    if (slashAdded) {
      req.url = req.url.substr(1);
      slashAdded = false;
    }

    if (removed.length ) {
      req.url = protohost + removed + req.url.substr(protohost.length);
      removed = '';
    }

    var layer = stack[index++];

    if (!layer) {
      defer(done, err);
      return;
    }

    var path = parseUrl(req).pathname || '/';
    var route = layer.route;

    if (path.toLowerCase().substr(0, route.length) !== route.toLowerCase()) {
      return next(err);
    }

    var c = path.length > route.length && path[route.length];
    if (c && c !== '/' && c !== '.') {
      return next(err);
    }

    if (route.length !== 0 && route !== '/') {
      removed = route;
      req.url = protohost + req.url.substr(protohost.length + removed.length);

      if (!protohost && req.url[0] !== '/') {
        req.url = '/' + req.url;
        slashAdded = true;
      }
    }

    call(layer.handle, route, err, req, res, next)
  }

  next();
}

proto.listen = function listen() {

}

function call(handle, route, err, req, res, next) {
  var arity = handle.length;
  var error = err;
  var hasError = Boolean(err);

  // debug('%s %s : %s', handle.name || '<anonymous>', route, req.originalUrl);

  try {
    if (hasError && arity === 4) {
      handle(err, req, res, next);
      return;
    } else if (!hasError && arity < 4) {
      handle(req, res, next);
      return;
    }
  } catch (e) {
    error = e;
  }
  next(error);
}

function logerror(err) {
  if (env !== 'test') console.error(err.stack || err.toString());
}

function getProtohost(url) {
  if (url.length === 0 || url[0] === '/') {
    return undefined;
  }

  var fadnIndex = url.indexOf('://');

  return fadnIndex !== -1 && url.lastIndexOf('?', fadnIndex) === -1
    ? url.substr(0, url.indexOf('/', 3 + fadnIndex))
    : undefined;
}

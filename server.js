const http = require('http');
const Koa = require('koa');
const log = require('log');
const opn = require('better-opn');
const path = require('path');
const fs = require('fs');
const Router = require('@koa/router');
const serve = require('koa-static');
const mysql = require('mysql2');
const bodyParser = require('koa-bodyparser');
const proxyMiddleware = require('http-proxy-middleware');
const k2c = require('koa2-connect');
const app = new Koa();
const port = 3000;
const env = process.env.NODE_ENV;
const router = new Router();

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Tricker_zhou_678',
  database: 'test',
});

const promisePool = pool.promise();

app.use(bodyParser());

app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// app.use(async ctx => {
//   ctx.body = 'Hello world!!';
// });

app.use(serve('public/images'));

app.use(k2c(proxyMiddleware('/api', {
  target: 'http://sep-xueshan.snowballfinance.com/',
  changeOrigin: true,
  pathRewrite: {
    '/api': '/brand',
  },
})))

app.on('error', err => {
  log.error('server error', err)
});
const reactHtml = fs.readFileSync(path.resolve(__dirname, 'public', 'index.html'));

router.get('/', (ctx, next) => {
  ctx.type = 'html';
  ctx.body = reactHtml;
});

router.get('/user/:name', async (ctx, next) => {
  try {
    const name = ctx.params.name;
    const [rows, fields] = await promisePool.query('SELECT * FROM user WHERE name = ?', [name]);

    ctx.body = rows;
  } catch (err) {
    console.log(err);
  }
})

router.post('/user/add', async (ctx, next) => {
  try {
    const { name, age, gender } = ctx.request.body;
    const [rows, fields] = await promisePool.query('INSERT INTO user(name, age, gender) VALUES(?, ?, ?)', [name, age, gender]);
    ctx.body = `${name}，添加成功`;
  } catch (err) {
    console.log(err);
  }
})

// router.get('/img/:name', (ctx, next) => {
//   const fileName = ctx.params.name;
//   const filePath = path.resolve(__dirname, './public/images', fileName);
//   try {
//     fs.accessSync(filePath, fs.constants.R_OK);
//     const file = fs.readFileSync(filePath);
//     ctx.type = 'image/png';
//     ctx.status = 200;
//     ctx.body = file;
//   } catch (err) {
//     console.error('no access!');
//   }
// })

app
  .use(router.routes())
  .use(router.allowedMethods());

const server = http.createServer(app.callback()).listen(port);

server.on('listening', () => {
  console.log('listening on port: %d', port);
  // opn('http://localhost:3000');
})

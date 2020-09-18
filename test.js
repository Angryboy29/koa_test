const http = require('http');

const connect = require('./connect.js');

const app = connect();

app.use((req, res, next) => {
  console.log('1111111');
  next();
  console.log('3333333');
})

app.use((req, res, next) => {
  console.log('2222222');
  next();
  console.log('4444444');
})

app.use((req, res, next) => {
  console.log('output')
  res.end('Hello');
})

http.createServer(app).listen(3000);
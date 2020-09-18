const express = require('express');
const app = express();
const port = 3001;

app.use(function (req, res, next) {
  console.log('1111');
  next();
  console.log('2222');
})

app.get('/', (req, res) => {
  console.log('3333');
  res.send('Hello world');
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})
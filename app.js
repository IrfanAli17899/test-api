const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();
const cors = require('cors');
const routers = require('./routes');

if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
}

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api', routers.publicRouter);
app.use('/api/v1', routers.privateRouter);

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.statusCode || err.status || err.code || 500).send({
    success: false,
    message: err.message,
  });
});

module.exports = app;

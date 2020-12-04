const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const serviceTypeRoutes = require('./routes/serviceType');
const serviceRoutes = require('./routes/service');
const labRoutes = require('./routes/lab');

// import seed
const seedFunctions = require('./seedFunctions');

// app
const app = express();

// prevent cors error
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    req.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

// db
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true, // idk what this does
  })
  .then(() => {
    console.log('Connected to FLF database.');
    seedFunctions.execute();
  });

// middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());

// routes middleware
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', serviceTypeRoutes);
app.use('/api', serviceRoutes);
app.use('/api', labRoutes);

// setting up port variable
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`FLF server is running on port ${port}.`);
});

// handle db error
mongoose.connection.on('error', err => {
  console.log(`DB connection error: ${err.message}.`);
});

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressValidator = require('express-validator');
require('dotenv').config();

// import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

// app
const app = express();

// db
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true, // idk what this does
  })
  .then(() => console.log('Connected to FLF database'));

// middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());

// routes middleware
app.use('/api', authRoutes);
app.use('/api', userRoutes);

// setting up port variable
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`FLF server is running on port ${port}.`);
});

// handle db error
mongoose.connection.on('error', err => {
  console.log(`DB connection error: ${err.message}`);
});

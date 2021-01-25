const express = require('express');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require("body-parser");
const path = require('path');

// Route Imports
const userRoutes = require('./routes/userRoute');
const solutionRoutes = require('./routes/solutionRoute');


// Development Plugins Import i.e [Logging]
const morgan = require('morgan');

// security imports
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');


// Error Handling Dependencies
const { errorHandler } = require('./controller/errorController');
const appError = require('./utils/appError');
const { startSitemap } = require('./controller/sitemapController');





// 1) GLOBAL MIDDLEWARES

// Security HTTP headers
app.use(helmet());

// Limit the number of requests from a certain ip
const limter = rateLimit({
  // 100 requests from same ip in 1 hour
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too Many requests from this IP, please try again in an hour!'
});


// Limit the no of request per ip
app.use('/api', limter); 



// Data Sanatization agains noSQL query injection
app.use(mongoSanitize());


// Data sanitization against XSS
app.use(xss());



//mongodb connection string
mongoose.connect(
  process.env.MONGO_DATABASE, { useNewUrlParser: true })
  .then(() => {
    console.log("Done: connected to database")
  })
  .catch((err) => {
    console.log(err);
    console.log("connection failed");
  });


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// CORS Functionality
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  next();
});


app.use("/public", express.static(path.join(__dirname, 'public')));

// 2) Routes
app.use('/api/user', userRoutes);
app.use('/api/solution', solutionRoutes);




// 3) Error Handeling


// 4) Start sitemap

startSitemap();

// Generate 404 error on from server when the URL not found
app.all('*', (req, res, next) => {
  // generate the new error from the error class
  next(new appError(`Can't find ${req.originalUrl} on this server!`, 404));
})


// Handle errors of application
app.use(errorHandler);

module.exports = app;

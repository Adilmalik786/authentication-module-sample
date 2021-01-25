const dotenv = require('dotenv');
dotenv.config({path: './config.env'})

const app = require("./app");
const debug = require("debug")("node-angular");
const http = require("http");


// Handle Uncaught exceptions before any of the code execution
process.on('uncaughtException', err => {
  console.log('Unhandled Exception : Shutting down...')
  console.log(err);
  process.exit(1);

}) 


const normalizePort = val => {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
};

const onError = error => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port === "string" ? "pipe " + port : "port " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const onListening = () => {
  const addr = server.address();
  const bind = typeof port === "string" ? "pipe " + port : "port " + port;
  debug("Listening on " + bind);
};


const port = normalizePort(process.env.PORT || "3001");
app.set("port", port);

const server = http.createServer(app);
server.on("error", onError);
server.on("listening", onListening);
server.listen(port);


// Handle Uncaught rejections - Like db password error
process.on('unhandledRejection', err => {
  console.log('Unhandled Rejection : Shutting down...')
  console.log(err.name, err.message);
  server.close(() => {
      process.exit(1);
  })
})


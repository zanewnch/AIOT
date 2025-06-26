#!/usr/bin/env node

import app from './app.js';
import debug from 'debug';
import http from 'http';
import sequelize from './infrastructure/SequelizeConfig.js';
import { createRabbitChannel } from './infrastructure/RabbitMQConfig.js';

const debugLogger = debug('aiot:server');

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '8000');
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * 等待 Sequelize 同步後再啟動 HTTP server。
 */
(async () => {
  try {
    await sequelize.sync();
    const rabbitChannel = await createRabbitChannel();
    console.log('✅ RabbitMQ ready');
    app.locals.rabbitMQChannel = rabbitChannel;
    console.log('✅ Database synced');
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
  } catch (err) {
    console.error('❌ Database sync failed', err);
    process.exit(1);
  }
})();

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string): number | string | false {
  const portNum = parseInt(val, 10);

  if (isNaN(portNum)) {
    // named pipe
    return val;
  }

  if (portNum >= 0) {
    // port number
    return portNum;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + (addr && typeof addr === 'object' && 'port' in addr ? addr.port : 'unknown');
  debugLogger('Listening on ' + bind);
  console.log('🚀 Server listening on ' + bind);
} 
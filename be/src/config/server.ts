import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import passport from 'passport';

export interface ServerConfig {
  port: number | string | false;
  viewsPath: string;
  publicPath: string;
  docsPath: string;
  viewEngine: string;
}

export const getServerConfig = (): ServerConfig => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  return {
    port: normalizePort(process.env.PORT || '8010'),
    viewsPath: path.join(__dirname, '../../views'),
    publicPath: path.join(__dirname, '../../public'),
    docsPath: path.join(__dirname, '../../docs'),
    viewEngine: 'jade'
  };
};

export const setupExpressMiddleware = (app: express.Application): void => {
  const config = getServerConfig();

  app.set('views', config.viewsPath);
  app.set('view engine', config.viewEngine);
  app.set('port', config.port);

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(config.publicPath));
  app.use('/api/docs', express.static(config.docsPath));
  app.use(passport.initialize());
};

export const normalizePort = (val: string): number | string | false => {
  const portNum = parseInt(val, 10);

  if (isNaN(portNum)) {
    return val;
  }

  if (portNum >= 0) {
    return portNum;
  }

  return false;
};
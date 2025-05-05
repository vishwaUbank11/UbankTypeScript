// const greet = (name: string): string => {
//     return `Hello, ${name}!`;
//   };
  
//   console.log(greet("Vishwa"));
  

import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
// import csrf from 'csurf';
import cors from 'cors';
import path from 'path';
import config from './config/config';
import crypto from 'crypto';

const app = express();
const port: number = 9240;

// Cors error
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3002"] }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(cookieParser());

// Set view engine to EJS
app.set('view engine', 'ejs');

// routing
import route from './routes/route';
app.use(route);

import routeMerchant from './routeMerchant/route'
app.use(routeMerchant)

// Run website
app.listen(port, () => {
  console.log(`http://${config.DB_HOST}:${port}`);
});

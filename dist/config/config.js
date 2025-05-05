"use strict";
// interface Config {
//   JWT_SECRET: string;
//   JWT_EXPIRY: string;
//   // other config values
// }
Object.defineProperty(exports, "__esModule", { value: true });
// Define the config object with the Config type
const config = {
    DB_HOST: "localhost",
    DB_PORT: "3306",
    DB_USERNAME: "root",
    DB_PASSWORD: "",
    DB_NAME: "ubankconnect",
    // JWT Data
    JWT_EXPIRY: "2h", // Token expiry time (e.g., "1h", "2d")
    JWT_ALGO: "HS256", // JWT signing algorithm
    JWT_SECRET: "UBankConnect.15.05.22", // Secret key for JWT
    PWD_SALT: 10, // bcrypt salt rounds (10 is a good default)
};
exports.default = config;

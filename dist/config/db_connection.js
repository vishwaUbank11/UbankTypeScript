"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("./config"));
const mysql_1 = __importDefault(require("mysql"));
const util_1 = __importDefault(require("util"));
// Create connection
const connection = mysql_1.default.createConnection({
    host: config_1.default.DB_HOST,
    user: config_1.default.DB_USERNAME,
    password: config_1.default.DB_PASSWORD,
    database: config_1.default.DB_NAME,
    // Note: `connectionLimit` is for `createPool`, not `createConnection`
});
// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.log("error to connect database ❌❌");
    }
    else {
        console.log("connection success to database ✅");
    }
});
// Promisify query
const query = util_1.default.promisify(connection.query).bind(connection);
exports.default = query;

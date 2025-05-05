import config from "./config";
import mysql from "mysql";
import util from "util";

// Create connection
const connection = mysql.createConnection({
  host: config.DB_HOST,
  user: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  // Note: `connectionLimit` is for `createPool`, not `createConnection`
});

// Connect to MySQL
connection.connect((err: mysql.MysqlError | null) => {
  if (err) {
    console.log("error to connect database ❌❌");
  } else {
    console.log("connection success to database ✅");
  }
});

// Promisify query
const query = util.promisify(connection.query).bind(connection) as (sql: string, values?: any) => Promise<any>;

export default query;

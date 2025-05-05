// interface Config {
//   JWT_SECRET: string;
//   JWT_EXPIRY: string;
//   // other config values
// }

// const config = {
//     DB_HOST: "localhost",
//     DB_PORT: "3306",
//     DB_USERNAME: "root",
//     DB_PASSWORD: "",
//     DB_NAME: "ubankconnect",
  
//     // JWT DATA
//     JWT_EXPIRY: "1h",
//     JWT_ALGO: "sha512",
//     JWT_SECRET: "UBankConnect.15.05.22",
//     PWD_SALT: 10,
//   };
  
//   export default config;
  // Define the Config interface
  interface Config {
    DB_HOST: string;
    DB_PORT: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    JWT_EXPIRY: string;    // JWT Expiry time (e.g., "1h")
    JWT_ALGO: string;      // JWT algorithm (e.g., "HS256")
    JWT_SECRET: string;    // Secret for signing JWTs
    PWD_SALT: number;      // bcrypt salt rounds for password hashing
  }
  
  // Define the config object with the Config type
  const config: Config = {
    DB_HOST: "localhost",
    DB_PORT: "3306",
    DB_USERNAME: "root",
    DB_PASSWORD: "",
    DB_NAME: "ubankconnect",
  
    // JWT Data
    JWT_EXPIRY: "2h",      // Token expiry time (e.g., "1h", "2d")
    JWT_ALGO: "HS256",     // JWT signing algorithm
    JWT_SECRET: "UBankConnect.15.05.22",  // Secret key for JWT
    PWD_SALT: 10,          // bcrypt salt rounds (10 is a good default)
  };
  
  export default config;
  

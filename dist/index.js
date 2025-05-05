"use strict";
// const greet = (name: string): string => {
//     return `Hello, ${name}!`;
//   };
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//   console.log(greet("Vishwa"));
const express_1 = __importDefault(require("express"));
// import csrf from 'csurf';
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("./config/config"));
const app = (0, express_1.default)();
const port = 9240;
// Cors error
app.use((0, cors_1.default)({ origin: ["http://localhost:3000", "http://localhost:3002"] }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// app.use(cookieParser());
// Set view engine to EJS
app.set('view engine', 'ejs');
// routing
const route_1 = __importDefault(require("./routes/route"));
app.use(route_1.default);
const route_2 = __importDefault(require("./routeMerchant/route"));
app.use(route_2.default);
// Run website
app.listen(port, () => {
    console.log(`http://${config_1.default.DB_HOST}:${port}`);
});

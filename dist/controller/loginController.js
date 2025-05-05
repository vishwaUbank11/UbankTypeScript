"use strict";
// import { Request, Response } from 'express';
// import mysqlcon from '../config/db_connection';
// import config from '../config/config';
// import jwt from 'jsonwebtoken';
// import emailvalidator from 'email-validator';
// import md5 from 'md5';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const db_connection_1 = __importDefault(require("../config/db_connection"));
const config_1 = __importDefault(require("../config/config"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_validator_1 = __importDefault(require("email-validator"));
const md5_1 = __importDefault(require("md5"));
let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password } = req.body;
    try {
        if (email_validator_1.default.validate(email)) {
            if (email && password) {
                const sql = 'SELECT * FROM tbl_login WHERE email = ? AND password = ?';
                // Use the mysqlcon query function with email and hashed password
                const result = yield (0, db_connection_1.default)(sql, [email, (0, md5_1.default)(password)]);
                if (((_a = result[0]) === null || _a === void 0 ? void 0 : _a.role) === 0) {
                    res.status(202).json({
                        message: 'Role not assigned'
                    });
                    return;
                }
                else if (result.length > 0) {
                    const Email = result[0].email;
                    const loginSql = 'UPDATE tbl_login SET last_login_date = ? WHERE email = ?';
                    const loginResult = yield (0, db_connection_1.default)(loginSql, [dateTime, Email]);
                    // Ensure the `JWT_EXPIRY` value is treated correctly as a string
                    const token = jsonwebtoken_1.default.sign({ id: result[0].user_id, role: result[0].role, Status: result[0].status }, config_1.default.JWT_SECRET, {
                        expiresIn: config_1.default.JWT_EXPIRY
                    });
                    if (result[0].status === 1) {
                        res.status(200).json({
                            message: 'Login Successful ✅',
                            token,
                            role: result[0].role,
                            Status: result[0].status,
                            loginData: loginResult,
                            name: `${result[0].firstname} ${result[0].lastname}`
                        });
                    }
                    else {
                        res.status(201).json({
                            message: 'Error! Your account has been deactivated. Please contact the admin.'
                        });
                    }
                }
                else {
                    res.status(201).json({
                        message: 'Invalid Email or Password'
                    });
                }
            }
            else {
                res.status(201).json({
                    message: 'Please fill all the fields'
                });
            }
        }
        else {
            res.status(201).json({
                Status: 0,
                message: 'Invalid Email'
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'An error occurred',
            error
        });
    }
});
exports.login = login;

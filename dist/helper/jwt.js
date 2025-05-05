"use strict";
// import { Request, Response, NextFunction } from 'express';
// import jwt, { JwtPayload } from 'jsonwebtoken';
// import config from '../config/config';
// import mysqlcon from '../config/db_connection';
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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config/config"));
const db_connection_1 = __importDefault(require("../config/db_connection"));
const jwtMiddleware = {
    verify: function (req, res, next) {
        var _a;
        if ('authorization' in req.headers) {
            const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split('Bearer ')[1];
            // Ensure JWT_SECRET is defined and a valid string
            const secret = config_1.default.JWT_SECRET;
            if (!secret || typeof secret !== 'string') {
                return res.status(500).json({ message: 'JWT secret is not configured properly.' });
            }
            // Proceed to verify the token
            jsonwebtoken_1.default.verify(token, secret, (err, payload) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    return res.status(401).json({ status: false, message: 'Invalid token', error: err });
                }
                // Safely access the payload and assume 'id' exists
                const userId = payload.id;
                try {
                    const results = yield (0, db_connection_1.default)('SELECT * FROM tbl_login WHERE user_id = ?', [userId]);
                    if (results.length === 0) {
                        return res.status(401).json({ status: false, message: 'Authentication failed', data: [] });
                    }
                    req.user = results[0]; // Attach user data to the request object
                    next(); // Proceed to the next middleware or route handler
                }
                catch (dbError) {
                    return res.status(500).json({ status: false, message: 'Database error', error: dbError });
                }
            }));
        }
        else {
            return res.status(401).json({ status: false, message: 'Authorization header not found', data: [] });
        }
    }
};
exports.default = jwtMiddleware;

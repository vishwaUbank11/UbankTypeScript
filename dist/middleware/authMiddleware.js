"use strict";
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
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { authorization } = req.headers;
        if (!authorization) {
            res.status(404).json({ message: "JWT Not Found💀" });
            return;
        }
        const token = authorization.replace("Bearer ", "");
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.JWT_SECRET);
        const userData = yield (0, db_connection_1.default)("SELECT * FROM tbl_user WHERE id = ?", [decoded.id]);
        if (userData.length === 0) {
            res.status(401).json({ message: "Invalid token or user not found" });
            return;
        }
        req.user = userData[0];
        next();
    }
    catch (error) {
        res.status(401).json({
            message: "Unauthorized",
            error: error instanceof Error ? error.message : error,
        });
    }
});
exports.default = authMiddleware;

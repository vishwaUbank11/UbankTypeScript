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
exports.changePassword = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const md5_1 = __importDefault(require("md5"));
const config_1 = __importDefault(require("../config/config"));
const db_connection_1 = __importDefault(require("../config/db_connection"));
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { oldPassword, newPassword, confirmPassword, token } = req.body;
        if (!oldPassword || !newPassword || !confirmPassword || !token) {
            res.status(400).json({ message: "Please fill all the fields" });
            return;
        }
        jsonwebtoken_1.default.verify(token, config_1.default.JWT_SECRET, (err, decoded) => __awaiter(void 0, void 0, void 0, function* () {
            if (err || !decoded) {
                res.status(401).json({ message: "Invalid or expired token" });
                return;
            }
            const { id } = decoded;
            if (newPassword === oldPassword) {
                res.status(400).json({ message: "New Password and Old Password is Same" });
                return;
            }
            if (newPassword !== confirmPassword) {
                res.status(400).json({ message: "New Password and Confirm Password does not match" });
                return;
            }
            const userSql = "SELECT * FROM tbl_user WHERE id = ?";
            const userData = yield (0, db_connection_1.default)(userSql, [id]);
            if (userData.length === 0) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            const hashedOldPassword = (0, md5_1.default)(oldPassword);
            const hashedNewPassword = (0, md5_1.default)(newPassword);
            if (userData[0].password !== hashedOldPassword) {
                res.status(401).json({ message: "Old password is wrong" });
                return;
            }
            const password1 = userData[0].password;
            const password2 = userData[0].password1 || null;
            const password3 = userData[0].password2 || null;
            const updateSql = `
        UPDATE tbl_user 
        SET password = ?, password1 = ?, password2 = ?, password3 = ?
        WHERE id = ?
      `;
            yield (0, db_connection_1.default)(updateSql, [hashedNewPassword, password1, password2, password3, id]);
            res.status(200).json({ message: "Password Change Successfully✅" });
        }));
    }
    catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({
            message: "Error occurred",
            error: error instanceof Error ? error.message : error,
        });
    }
});
exports.changePassword = changePassword;

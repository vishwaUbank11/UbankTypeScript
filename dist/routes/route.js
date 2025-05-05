"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const loginController_1 = require("../controller/loginController");
const router = express_1.default.Router();
const uploads = (0, multer_1.default)(); // for parsing multipart/form-data
router.post('/login', uploads.none(), loginController_1.login);
exports.default = router;

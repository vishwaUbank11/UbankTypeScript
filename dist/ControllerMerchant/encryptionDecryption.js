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
const crypto_1 = __importDefault(require("crypto"));
const buffer_1 = require("buffer");
// interface CustomRequest extends Request {
//   body: DecryptRequestBody;
// }
const EncryptDecrypt = {
    encryptValue: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { payoutData, merchantId, merchantSecret, merchantiv } = req.body;
            const sample_string = buffer_1.Buffer.from(payoutData).toString('base64');
            const algorithm = 'aes-128-ctr';
            const encryption_iv = merchantiv.substring(0, 16); // Must be 16 bytes
            const encryption_key = crypto_1.default.createHash('md5').update(merchantId + merchantSecret).digest('hex').substring(0, 16); // 16-byte key
            const cipher = crypto_1.default.createCipheriv(algorithm, encryption_key, encryption_iv);
            let encrypted = cipher.update(sample_string, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            const finalEncrypted = buffer_1.Buffer.from(encrypted).toString('base64');
            const response = {
                status: 'success',
                details: {
                    code: 'SUCC200',
                    message: 'Encrypted Data.',
                },
                data: {
                    encryptedData: finalEncrypted,
                },
            };
            res.send(response);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                status: 'error',
                message: 'Encryption failed',
                error: error.message || error,
            });
        }
    }),
    decryptValue: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let { encrypted_msg, merchantId, merchantSecret, merchantiv } = req.body;
            const encryptedData = buffer_1.Buffer.from(encrypted_msg, 'base64').toString('utf8');
            const algorithm = 'aes-128-ctr';
            const encryption_iv = merchantiv.substring(0, 16); // Must be 16 characters
            const encryption_key = crypto_1.default.createHash('md5').update(merchantId + merchantSecret).digest('hex').substring(0, 16);
            const decipher = crypto_1.default.createDecipheriv(algorithm, encryption_key, encryption_iv);
            let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            const plainText = buffer_1.Buffer.from(decrypted, 'base64').toString('utf8');
            const decryptedValue = JSON.parse(plainText);
            const response = {
                status: 'success',
                details: {
                    code: 'SUCC200',
                    message: 'Decrypted Data.',
                },
                data: {
                    decryptedData: decryptedValue,
                },
            };
            res.send(response);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                status: 'error',
                message: 'Decryption failed',
                error: error.message || error,
            });
        }
    })
};
exports.default = EncryptDecrypt;

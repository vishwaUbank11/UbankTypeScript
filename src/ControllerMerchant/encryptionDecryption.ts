import { Request, Response } from 'express';
import crypto from 'crypto';
import { Buffer } from 'buffer';

interface EncryptRequestBody {
  payoutData: string;
  merchantId: string;
  merchantSecret: string;
  merchantiv: string;
}

interface CustomRequest extends Request {
  body: EncryptRequestBody;
}

interface DecryptRequestBody {
  encrypted_msg: string;
  merchantId: string;
  merchantSecret: string;
  merchantiv: string;
}

// interface CustomRequest extends Request {
//   body: DecryptRequestBody;
// }


const EncryptDecrypt = {
    encryptValue : async(req: CustomRequest, res: Response):Promise<void> =>{
        try {
            const { payoutData, merchantId, merchantSecret, merchantiv } = req.body;
            const sample_string = Buffer.from(payoutData).toString('base64');
            const algorithm = 'aes-128-ctr';
            const encryption_iv = merchantiv.substring(0, 16); // Must be 16 bytes
            const encryption_key = crypto.createHash('md5').update(merchantId + merchantSecret).digest('hex').substring(0, 16); // 16-byte key
            const cipher = crypto.createCipheriv(algorithm, encryption_key, encryption_iv);
            let encrypted = cipher.update(sample_string, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            const finalEncrypted = Buffer.from(encrypted).toString('base64');
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
        } catch (error: any) {
            console.error(error);
            res.status(500).json({
                status: 'error',
                message: 'Encryption failed',
                error: error.message || error,
            });
        }

    },

    decryptValue : async(req: Request, res: Response):Promise<void> =>{
        try {
            let { encrypted_msg, merchantId, merchantSecret, merchantiv } = req.body as DecryptRequestBody;
            const encryptedData = Buffer.from(encrypted_msg, 'base64').toString('utf8');
            const algorithm = 'aes-128-ctr';
            const encryption_iv = merchantiv.substring(0, 16); // Must be 16 characters
            const encryption_key = crypto.createHash('md5').update(merchantId + merchantSecret).digest('hex').substring(0, 16); 
            const decipher = crypto.createDecipheriv(algorithm, encryption_key, encryption_iv);
            let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            const plainText = Buffer.from(decrypted, 'base64').toString('utf8');
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
        } catch (error: any) {
            console.error(error);
            res.status(500).json({
                status: 'error',
                message: 'Decryption failed',
                error: error.message || error,
            });
        }
    }

}

export default EncryptDecrypt
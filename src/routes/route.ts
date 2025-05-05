import express from 'express';
import multer from 'multer';
import { login } from '../controller/loginController';

const router = express.Router();
const uploads = multer(); // for parsing multipart/form-data

router.post('/login', uploads.none(), login);

export default router;
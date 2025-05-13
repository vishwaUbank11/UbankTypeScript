import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';
import config from '../config/config';
import md5 from 'md5';
import jwt, { JwtPayload as DefaultJwtPayload } from 'jsonwebtoken';
import util from 'util';

interface JwtPayload extends DefaultJwtPayload {
  id?: string;
}

const verifyJwt = util.promisify<string, string, JwtPayload>(jwt.verify as any);

class ChangePass {
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { oldPassword, newPassword, confirmPassword, token } = req.body;

      if (!oldPassword || !newPassword || !confirmPassword || !token) {
        res.status(400).json({ message: 'Please fill all the fields' });
        return;
      }

      let decoded: JwtPayload;
      try {
        decoded = await verifyJwt(token, config.JWT_SECRET) as JwtPayload;
      } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token', error: err });
        return;
      }

      const { id } = decoded;

      if (!id) {
        res.status(400).json({ message: 'User ID not found in token' });
        return;
      }

      if (newPassword === oldPassword) {
        res.status(400).json({ message: 'New Password and Old Password are the same' });
        return;
      }

      if (newPassword !== confirmPassword) {
        res.status(400).json({ message: 'New Password and Confirm Password do not match' });
        return;
      }

      const hashedOldPassword = md5(oldPassword);
      const hashedNewPassword = md5(newPassword);

      const userSql = 'SELECT * FROM tbl_login WHERE user_id = ?';
      const userData: any = await mysqlcon(userSql, [id]);

      if (userData.length === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (userData[0].password !== hashedOldPassword) {
        res.status(401).json({ message: 'Old password is incorrect' });
        return;
      }

      const password1 = userData[0].password ?? null;
      const password2 = userData[0].password1 ?? null;
      const password3 = userData[0].password2 ?? null;
      const passwordView = newPassword;

      const updateSql = `
        UPDATE tbl_login 
        SET password = ?, password1 = ?, password2 = ?, password3 = ?, password_view = ?
        WHERE user_id = ?
      `;

      await mysqlcon(updateSql, [
        hashedNewPassword,
        password1,
        password2,
        password3,
        passwordView,
        id,
      ]);

      res.status(200).json({ message: 'Password changed successfully ✅' });

    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ message: 'Error occurred while changing password', error });
    }
  }
}

export default new ChangePass();

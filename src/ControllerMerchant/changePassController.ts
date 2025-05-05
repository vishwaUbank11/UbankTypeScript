import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import md5 from "md5";
import config from "../config/config";
import mysqlcon from "../config/db_connection";

// Define custom JWT payload interface
interface MyJwtPayload extends JwtPayload {
  id: number;
}


export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword, confirmPassword, token } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword || !token) {
      res.status(400).json({ message: "Please fill all the fields" });
      return;
    }

    jwt.verify(
        token,
        config.JWT_SECRET,
        async (err: jwt.VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
          if (err || !decoded) {
            res.status(401).json({ message: "Invalid or expired token" });
            return;
          }
      
          const { id } = decoded as MyJwtPayload;


      if (newPassword === oldPassword) {
        res.status(400).json({ message: "New Password and Old Password is Same" });
        return;
      }

      if (newPassword !== confirmPassword) {
        res.status(400).json({ message: "New Password and Confirm Password does not match" });
        return;
      }

      const userSql = "SELECT * FROM tbl_user WHERE id = ?";
      const userData = await mysqlcon(userSql, [id]);

      if (userData.length === 0) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const hashedOldPassword = md5(oldPassword);
      const hashedNewPassword = md5(newPassword);

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

      await mysqlcon(updateSql, [hashedNewPassword, password1, password2, password3, id]);

      res.status(200).json({ message: "Password Change Successfully✅" });
    });

  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      message: "Error occurred",
      error: error instanceof Error ? error.message : error,
    });
  }
};

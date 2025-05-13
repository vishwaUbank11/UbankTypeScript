import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';
import config from '../config/config';
import jwt from 'jsonwebtoken';
import emailvalidator from 'email-validator';
import md5 from 'md5';
let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;

interface LoginResponse {
  message: string;
  token?: string;
  role?: number;
  Status?: number;
  loginData?: any;
  name?: string;
  error?: any; 
}

interface JwtPayload {
  id: number;
  [key: string]: any;
}

interface PermissionResponse {
  message: string;
  token?: string;
  error?: any;
  permission?: any;
}

class adminLogin {

  async login (req: Request, res: Response<LoginResponse>): Promise<void>{
    const { email, password } = req.body;
  
    try {
      if (emailvalidator.validate(email)) {
        if (email && password) {
          const sql = 'SELECT * FROM tbl_login WHERE email = ? AND password = ?';
          
          // Use the mysqlcon query function with email and hashed password
          const result: any[] = await mysqlcon(sql, [email, md5(password)]);
  
          if (result[0]?.role === 0) {
            res.status(202).json({
              message: 'Role not assigned'
            });
            return;
          } else if (result.length > 0) {
            const Email = result[0].email;
            const loginSql = 'UPDATE tbl_login SET last_login_date = ? WHERE email = ?';
            const loginResult: any = await mysqlcon(loginSql, [dateTime, Email]);
            
            // Ensure the `JWT_EXPIRY` value is treated correctly as a string
            const token = jwt.sign(
              { id: result[0].user_id, role: result[0].role, Status: result[0].status },
              config.JWT_SECRET,
              {
                expiresIn:  config.JWT_EXPIRY as jwt.SignOptions['expiresIn']
              }
            );
  
            if (result[0].status === 1) {
              res.status(200).json({
                message: 'Login Successful ✅',
                token,
                role: result[0].role,
                Status: result[0].status,
                loginData: loginResult,
                name: `${result[0].firstname} ${result[0].lastname}`
              });
            } else {
              res.status(201).json({
                message: 'Error! Your account has been deactivated. Please contact the admin.'
              });
            }
          } else {
            res.status(201).json({
              message: 'Invalid Email or Password'
            });
          }
        } else {
          res.status(201).json({
            message: 'Please fill all the fields'
          });
        }
      } else {
        res.status(201).json({
          Status: 0,
          message: 'Invalid Email'
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'An error occurred',
        error
      });
    }
  };

  
  async modulePermission  (
    req: Request,
    res: Response<PermissionResponse>
  ): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ message: "Please provide token" });
        return;
      }

      let payload: JwtPayload;
      try {
        payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
      } catch (err) {
        res.status(401).json({ message: "Login first", error: err });
        return;
      }

      const id = payload.id;
      if (!id) {
        res.status(401).json({ message: "Invalid token" });
        return;
      }

      const sql = "SELECT role FROM tbl_login WHERE user_id = ?";
      const result = await mysqlcon(sql, [id]);
      const userRole = result[0]?.role;

      const sqlPermission = "SELECT * FROM tbl_module_action WHERE user_id = ?";
      const permissionResult = await mysqlcon(sqlPermission, [id]);

      const adminModules = [
        "Sub Admin Module", "PG Module", "MID Module", "Chinese bank Module",
        "Bankcode BankConnect Module", "Bankcode Module", "Merchant Module",
        "Transaction Module", "SandBox Module", "Banner Module", "Settlement Module",
        "Activity Logs", "Contact Module", "CMS Module", "Meta Module",
        "Setting Module", "Change Password",
      ];

      const settlementModules = [
        "Bank Deposit Received", "Local Payouts", "Add Funds", "Local Settlement",
        "International Settlement", "Dispute/Chargebacks", "Refunds",
        "Reports", "SettlementChangePassword",
      ];

      const relevantModules = userRole === 1 ? adminModules :
                              userRole === 2 ? settlementModules : [];

      const output = relevantModules.map((mod) => {
        const found = permissionResult.find((perm: any) => perm.module === mod);
        return found || {
          module: mod,
          m_add: 0,
          m_edit: 0,
          m_delete: 0,
          m_view: 0,
          status: 0,
        };
      });

      res.status(200).json({
        message: "Permission List",
        permission: output,
      });
    } catch (error) {
      console.error("Permission error:", error);
      res.status(500).json({
        message: "An error occurred",
        error,
      });
    }
  };
}

export default new adminLogin
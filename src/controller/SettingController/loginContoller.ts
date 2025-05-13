// import { Request, Response } from 'express';
// import mysqlcon from '../config/db_connection';
// import config from '../config/config';
// import jwt from 'jsonwebtoken';
// import emailvalidator from 'email-validator';
// import md5 from 'md5';

// // Get the current date and time
// let today = new Date();
// let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
// let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
// let dateTime = date + ' ' + time;
// interface LoginResponse {
//   message: string;
//   token?: string;
//   role?: number;
//   Status?: number;
//   loginData?: any;
//   name?: string;
//   error?: any; 
// }
// export const login = async (req: Request, res: Response<LoginResponse>) =>  {
//   const { email, password } = req.body;

//   try {
//     if (emailvalidator.validate(email)) {
//       if (email && password) {
//         const sql = 'SELECT * FROM tbl_login WHERE email = ? AND password = ?';
        
//         // Use the mysqlcon query function with email and hashed password
//         const result: any[] = await mysqlcon(sql, [email, md5(password)]);

//         if (result[0]?.role === 0) {
//           return res.status(202).json({
//             message: 'Role not assigned'
//           });
//         } else if (result.length > 0) {
//           const Email = result[0].email;
//           const loginSql = 'UPDATE tbl_login SET last_login_date = ? WHERE email = ?';
//           const loginResult: any = await mysqlcon(loginSql, [dateTime, Email]);

//           const token = jwt.sign(
//             { id: result[0].user_id, role: result[0].role, Status: result[0].status },
//             config.JWT_SECRET,
//             { expiresIn: config.JWT_EXPIRY }
//           );

//           if (result[0].status === 1) {
//             return res.status(200).json({
//               message: 'Login Successful ✅',
//               token,
//               role: result[0].role,
//               Status: result[0].status,
//               loginData: loginResult,
//               name: `${result[0].firstname} ${result[0].lastname}`
//             });
//           } else {
//             return res.status(201).json({
//               message: 'Error! Your account has been deactivated. Please contact the admin.'
//             });
//           }
//         } else {
//           return res.status(201).json({
//             message: 'Invalid Email or Password'
//           });
//         }
//       } else {
//         return res.status(201).json({
//           message: 'Please fill all the fields'
//         });
//       }
//     } else {
//       return res.status(201).json({
//         Status: 0,
//         message: 'Invalid Email'
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: 'An error occurred',
//       error
//     });
//   }
// };


// import { Request, Response } from 'express';
// import mysqlcon from '../config/db_connection';
// import config from '../config/config';
// import jwt from 'jsonwebtoken';
// import emailvalidator from 'email-validator';
// import md5 from 'md5';
// interface LoginResponse {
//   message: string;
//   token?: string;
//   role?: number;
//   Status?: number;
//   loginData?: any;
//   name?: string;
//   error?: any; 
// }

// let today = new Date();
// let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
// let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
// let dateTime = date + ' ' + time;

// export const login = async (req: Request, res: Response<LoginResponse>): Promise<void> => {
//   const { email, password } = req.body;

//   try {
//     if (emailvalidator.validate(email)) {
//       if (email && password) {
//         const sql = 'SELECT * FROM tbl_login WHERE email = ? AND password = ?';
        
//         // Use the mysqlcon query function with email and hashed password
//         const result: any[] = await mysqlcon(sql, [email, md5(password)]);

//         if (result[0]?.role === 0) {
//           res.status(202).json({
//             message: 'Role not assigned'
//           });
//           return;
//         } else if (result.length > 0) {
//           const Email = result[0].email;
//           const loginSql = 'UPDATE tbl_login SET last_login_date = ? WHERE email = ?';
//           const loginResult: any = await mysqlcon(loginSql, [dateTime, Email]);

//           const token = jwt.sign(
//             { id: result[0].user_id, role: result[0].role, Status: result[0].status },
//             config.JWT_SECRET,
//             { expiresIn: config.JWT_EXPIRY }
//           );

//           if (result[0].status === 1) {
//             res.status(200).json({
//               message: 'Login Successful ✅',
//               token,
//               role: result[0].role,
//               Status: result[0].status,
//               loginData: loginResult,
//               name: `${result[0].firstname} ${result[0].lastname}`
//             });
//           } else {
//             res.status(201).json({
//               message: 'Error! Your account has been deactivated. Please contact the admin.'
//             });
//           }
//         } else {
//           res.status(201).json({
//             message: 'Invalid Email or Password'
//           });
//         }
//       } else {
//         res.status(201).json({
//           message: 'Please fill all the fields'
//         });
//       }
//     } else {
//       res.status(201).json({
//         Status: 0,
//         message: 'Invalid Email'
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       message: 'An error occurred',
//       error
//     });
//   }
// };



import { Request, Response } from 'express';
import mysqlcon from '../../config/db_connection';
import config from '../../config/config';
import jwt from 'jsonwebtoken';
import emailvalidator from 'email-validator';
import md5 from 'md5';

interface LoginResponse {
  message: string;
  token?: string;
  role?: number;
  Status?: number;
  loginData?: any;
  name?: string;
  error?: any; 
}

let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;

export const login = async (req: Request, res: Response<LoginResponse>): Promise<void> => {
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

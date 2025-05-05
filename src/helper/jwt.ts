// import { Request, Response, NextFunction } from 'express';
// import jwt, { JwtPayload } from 'jsonwebtoken';
// import config from '../config/config';
// import mysqlcon from '../config/db_connection';

// // Extend Express Request to include user
// declare module 'express' {
//   export interface Request {
//     user?: any;
//   }
// }

// const jwtMiddleware = {
//   verify: function (req: Request, res: Response, next: NextFunction) {
//     if ('authorization' in req.headers) {
//       const token = req.headers.authorization?.split('Bearer ')[1];

//       // Ensure JWT_SECRET is defined and a valid string
//       const secret = config.JWT_SECRET;
//       if (!secret || typeof secret !== 'string') {
//         return res.status(500).json({ message: 'JWT secret is not configured properly.' });
//       }

//       // Proceed to verify the token
//       jwt.verify(secret, async (err, payload) => {
//         if (err) {
//           return res.status(401).json({ status: false, message: 'Invalid token', error: err });
//         }

//         const userId = (payload as JwtPayload).id;

//         try {
//           const results: any[] = await mysqlcon('SELECT * FROM tbl_login WHERE user_id = ?', [userId]);
//           if (results.length === 0) {
//             return res.status(401).json({ status: false, message: 'Authentication failed', data: [] });
//           }

//           req.user = results[0];
//           next();
//         } catch (dbError) {
//           return res.status(500).json({ status: false, message: 'Database error', error: dbError });
//         }
//       });
//     } else {
//       return res.status(401).json({ status: false, message: 'Authorization header not found', data: [] });
//     }
//   }
// };

// export default jwtMiddleware;










import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config/config';
import mysqlcon from '../config/db_connection';

// Extend Express Request to include user
declare module 'express' {
  export interface Request {
    user?: any;
  }
}

const jwtMiddleware = {
  verify: function (req: Request, res: Response, next: NextFunction) {
    if ('authorization' in req.headers) {
      const token = req.headers.authorization?.split('Bearer ')[1];

      // Ensure JWT_SECRET is defined and a valid string
      const secret = config.JWT_SECRET;
      if (!secret || typeof secret !== 'string') {
        return res.status(500).json({ message: 'JWT secret is not configured properly.' });
      }

      // Proceed to verify the token
      jwt.verify(token as string, secret, async (err, payload) => {  // Corrected here: token is passed as the first argument
        if (err) {
          return res.status(401).json({ status: false, message: 'Invalid token', error: err });
        }

        // Safely access the payload and assume 'id' exists
        const userId = (payload as JwtPayload).id;

        try {
          const results: any[] = await mysqlcon('SELECT * FROM tbl_login WHERE user_id = ?', [userId]);
          if (results.length === 0) {
            return res.status(401).json({ status: false, message: 'Authentication failed', data: [] });
          }

          req.user = results[0]; // Attach user data to the request object
          next(); // Proceed to the next middleware or route handler
        } catch (dbError) {
          return res.status(500).json({ status: false, message: 'Database error', error: dbError });
        }
      });
    } else {
      return res.status(401).json({ status: false, message: 'Authorization header not found', data: [] });
    }
  }
};

export default jwtMiddleware;

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config";
import mysqlcon from "../config/db_connection";

interface AuthenticatedRequest extends Request {
  user?: any; // Replace `any` with your actual user type if available
}

const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      res.status(404).json({ message: "JWT Not Found💀" });
      return;
    }

    const token = authorization.replace("Bearer ", "");
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id: number };

    const userData = await mysqlcon("SELECT * FROM tbl_user WHERE id = ?", [decoded.id]);

    if (userData.length === 0) {
      res.status(401).json({ message: "Invalid token or user not found" });
      return;
    }

    req.user = userData[0];
    next();
  } catch (error) {
    res.status(401).json({
      message: "Unauthorized",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export default authMiddleware;

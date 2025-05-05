import { Request, Response } from "express";
import mysqlcon from "../config/db_connection";
import { AuthenticatedRequest } from './userInterface';

interface MerchantRefundBody {
  pages?: number;
  limit?: number;
  id?: string;
}
const Refund = {
  merchantRefund : async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pagination = (total: number, page: number, limit: number) => {
      const numOfPages = Math.ceil(total / limit);
      const start = page * limit - limit;
      return { limit, start, numOfPages };
    };

    const { pages = 1, limit = 10, id } = req.body as MerchantRefundBody;

    let page = Number(pages);
    let itemsPerPage = Number(limit);
    let userId = req.user?.id;

    let merchantIds: string[] | number[] = [];
    let total = 0;
    let start = 0;
    let numOfPages = 0;
    let results = [];

    if (id) {
      merchantIds = id.split(",");
      const countSql = "SELECT COUNT(*) AS Total FROM user_request WHERE merchant_id IN (?)";
      const countResult  = await mysqlcon(countSql, [merchantIds]);
      total = countResult[0].Total;

      ({ start, numOfPages } = pagination(total, page, itemsPerPage));

      const querySql =
        "SELECT invoice_Id, request_id, amount, status, refund_status, created_on, message FROM user_request WHERE merchant_id IN (?) ORDER BY created_on DESC LIMIT ?, ?";
      results = await mysqlcon(querySql, [merchantIds, start, itemsPerPage]);
    } else {
      const countSql = "SELECT COUNT(*) AS Total FROM user_request WHERE merchant_id = ?";
      const countResult =  await mysqlcon(countSql, [userId]);
      total = countResult[0].Total;

      ({ start, numOfPages } = pagination(total, page, itemsPerPage));

      const querySql =
        "SELECT invoice_Id, request_id, amount, status, refund_status, created_on, message FROM user_request WHERE merchant_id = ? ORDER BY created_on DESC LIMIT ?, ?";
      results = await mysqlcon(querySql, [userId, start, itemsPerPage]);
    }

    const startRange = start + 1;
    const endRange = start + results.length;

    const responseMessage =
      results.length === 0
        ? "Showing 0 data"
        : `Showing ${startRange} to ${endRange} data from ${total}`;

    const statusCode = results.length === 0 ? 201 : 200;

    res.status(statusCode).json({
      message: responseMessage,
      currentPage: page,
      totalPages: numOfPages,
      pageLimit: itemsPerPage,
      data: results,
    });
  } catch (error) {
    console.error("Refund Error:", error);
    res.status(500).json({
      message: "error",
    });
  }
}
}

export default Refund

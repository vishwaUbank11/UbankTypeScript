import { Request, Response } from "express";
import mysqlcon from "../../config/db_connection";
import Pagination from "../../services/pagination";

//default
interface SettlementRequestBody {
  to?: string;
  from?: string;
  date?: string;
  pageNumber?: number;
  limit?: number;
  searchItem?: string;
  id: number;
  user_id: string;
  amount: number;
  created_on: string;
  Total: number;
}

class Commissions{
  public async default(req: Request<SettlementRequestBody>, res: Response) {
        try {
          const { to, from, date, pageNumber, limit, searchItem } = req.body;
      
          let countQuery = "SELECT COUNT(*) AS Total FROM tbl_settlement_commission";
          let countParams: any[] = [];
      
          if (date) {
            countQuery = "SELECT COUNT(*) AS Total FROM tbl_settlement_commission WHERE DATE(created_on) = ?";
            countParams = [date];
          } else if (to && from) {
            countQuery = "SELECT COUNT(*) AS Total FROM tbl_settlement_commission WHERE DATE(created_on) >= ? AND DATE(created_on) <= ?";
            countParams = [from, to];
          } else if (searchItem) {
            countQuery = "SELECT COUNT(*) AS Total FROM tbl_settlement_commission WHERE user_id LIKE ?";
            countParams = [`%${searchItem}%`];
          }
      
          const [countResult] = await mysqlcon(countQuery, countParams);
          const total = countResult[0]?.Total ?? 0;
      
          const page = pageNumber ?? 1;
          const pageLimit = limit ?? 10;
      
          const { start, numOfPages } = Pagination.pagination(total, page, pageLimit);
    
          let dataQuery = "SELECT * FROM tbl_settlement_commission ORDER BY created_on DESC LIMIT ?, ?";
          let dataParams: any[] = [start, pageLimit];
      
          if (date) {
            dataQuery = "SELECT * FROM tbl_settlement_commission WHERE DATE(created_on) = ? ORDER BY created_on DESC LIMIT ?, ?";
            dataParams = [date, start, pageLimit];
          } else if (to && from) {
            dataQuery = "SELECT * FROM tbl_settlement_commission WHERE DATE(created_on) >= ? AND DATE(created_on) <= ? ORDER BY created_on DESC LIMIT ?, ?";
            dataParams = [from, to, start, pageLimit];
          } else if (searchItem) {
            dataQuery = "SELECT * FROM tbl_settlement_commission WHERE user_id LIKE ? ORDER BY created_on DESC LIMIT ?, ?";
            dataParams = [`%${searchItem}%`, start, pageLimit];
          }
      
          const [data] = await mysqlcon(dataQuery, dataParams);
      
          res.status(200).json({
            result: data,
            numOfPages
          });
        } catch (error) {
          res.status(500).json({
            message: "Something went wrong",
            error
          });
        }
  }      
}

export default new Commissions();
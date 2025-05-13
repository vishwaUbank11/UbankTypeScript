import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';

const currentUTC = new Date();
const istOffset = 5.5 * 60 * 60 * 1000; 
const istTime = new Date(currentUTC.getTime() + istOffset);
const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');

interface toogleRequest{
    id? : string, 
    status? : string 
}

interface AkontoBankCodeRequest {
    type: string;
    title: string;
    code: string;
    currencies: string[];
}

interface BankCodeRequest {
    id?: string;
}

interface UpdateBankCodeRequest {
    type: number;
    title: string;
    code: string;
    id: number;
    currencies: string[] | string;
}

interface ReadBankCodeRequest {
    searchVal?: string;
    date?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

class bankcodeAkonto{

    async readBankCodeAkonto(req:Request<ReadBankCodeRequest>,res: Response):Promise<void>{
        let pagination = (total: number, page: number, limit: number) => {
            let numOfPages = Math.ceil(total / limit);
            let start = page * limit - limit;
            return { limit, start, numOfPages };
        };
        
        try {
            let {searchVal, date, to, from} = req.body;
            let sql = "select count (*) as Total from tbl_akonto_banks_code";
            let sqlCount =
              "select count (*) as Total FROM tbl_akonto_banks_code WHERE title  LIKE '%" +
              searchVal +
              "%' OR  code  LIKE '%" +
              searchVal +
              "%'";
            let sqlDate = "SELECT count (*) AS Total FROM tbl_akonto_banks_code WHERE Date(created_on) = ?" ;
            let sqlToFrom = "SELECT count (*) AS Total FROM tbl_akonto_banks_code WHERE Date(created_on) >= ? AND Date(created_on) <= ?"
        
            let result = await mysqlcon(searchVal ? sqlCount: date ? sqlDate: to && from ? sqlToFrom  : sql,  date ? [date] : to && from ? [from, to] :"");
            let total = result[0].Total;
            let page = req.body.page ? Number(req.body.page) : 1;
            let limit = req.body.limit ? Number(req.body.limit) : 10;
            let { start, numOfPages } = pagination(total, page, limit);
            
        
            let sql1 = "SELECT tbl_akonto_banks_code.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_akonto_banks_code ORDER BY created_on DESC LIMIT ?,?";
            let sql2 =
              "SELECT tbl_akonto_banks_code.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_akonto_banks_code WHERE title  LIKE '%" +
              searchVal +
              "%' OR  code  LIKE '%" +
              searchVal +
              "%'  LIMIT ?,?";
            let sql_Date = "SELECT tbl_akonto_banks_code.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_akonto_banks_code WHERE Date(created_on) = ? ORDER BY created_on DESC limit ?,?";
            let sql_tofrom = "SELECT tbl_akonto_banks_code.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_akonto_banks_code WHERE Date(created_on) >= ? AND Date(created_on) <= ? ORDER BY created_on DESC limit ?,?"
        
            let result1 = await mysqlcon(searchVal ? sql2: date? sql_Date: to && from? sql_tofrom : sql1, date? [date, start, limit] : to && from ? [from, to, start, limit]: [start, limit]);
        
            let startRange = start + 1;
            let endRange = start + result1.length;
        
            res.status(200).json({
              message: result1.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
              currentPage: page,
              totalPages: numOfPages,
              pageLimit: limit,
              data: result1,
            });
        } catch (error) {
            res.status(500).json({
              message: "error occurered",
              error: error,
            });
        }
    }
    
    async  updateBankCodeAkonto(req: Request<{}, {}, UpdateBankCodeRequest>,res: Response): Promise<void> {
      try {
        const { type, title, code, id, currencies } = req.body;
    
        if (!id || typeof id !== "number") {
           res.status(400).json({ message: "Kindly provide a valid 'id'" });
        }
    
        const currenciesString = Array.isArray(currencies)
          ? currencies.join(",")
          : currencies;
    
        const details = {
          type,
          title,
          code,
          currencies: currenciesString,
          updated_on: formattedIST,
        };
    
        const sql = "UPDATE tbl_akonto_banks_code SET ? WHERE id = ?";
        const result = await mysqlcon(sql, [details, id]);
    
        if (result && result.affectedRows > 0) {
          res.status(200).json({
            message: "Bankcode Updated ✅",
          });
        } else {
          res.status(404).json({
            message: "Bankcode not found or no changes made",
          });
        }
      } catch (error) {
        console.error("updateBankCodeAkonto error:", error);
        res.status(500).json({
          message: "Error occurred while updating",
          error
        });
      }
    }

    async readUpdateBankCodeAkonto(req:Request<BankCodeRequest>,res: Response):Promise<void>{
          try {
            let { id } = req.body;
            let sql = "SELECT * FROM tbl_akonto_banks_code WHERE id = ?";
            let result = await mysqlcon(sql, [id]);
            res.status(200).json({
              message: "Data Fetched Successfully✅",
              data: result[0],
            });
          } catch (error) {
            res.status(500).json({
              message: "error occurered",
              error: error,
            });
          }
    }

    async deleteBankCodeAkonto(req:Request<BankCodeRequest>,res: Response):Promise<void>{
          try {
            let { id } = req.body;
        
            let sql = "DELETE FROM tbl_akonto_banks_code WHERE id = ?";
            let result = await mysqlcon(sql, [id]);
        
        
            if (result) {
            res.status(200).json({
                message: "Delete Successfully✅",
              });
            } else {
            res.status(201).json({
                message: "Error while Deleting",
              });
            }
          } catch (error) {
            res.status(500).json({
              message: "error occurered",
              error: error,
            });
          }
    }
    
    async  createBankCodeAkonto(req: Request<{}, {}, AkontoBankCodeRequest>,res: Response): Promise<void> {
      try {
        const { type, title, code, currencies } = req.body;
    
        if (!type || !title || !code || !Array.isArray(currencies) || currencies.length === 0) {
            res.status(400).json({
                message: "Invalid input: All fields are required",
            });
        }
    
        const details = {
          type,
          title,
          code,
          currencies: currencies.join(","),
          created_on: formattedIST,
          updated_on: formattedIST,
        };
    
        const sql = "INSERT INTO tbl_akonto_banks_code SET ?";
        const result = await mysqlcon(sql, [details]);
    
        if (result && result.affectedRows > 0) {
          res.status(200).json({
            message: "Data Inserted Successfully ✅",
          });
        } else {
          res.status(500).json({
            message: "Error While Creating Record",
          });
        }
      } catch (error) {
        console.error("createBankCodeAkonto error:", error);
        res.status(500).json({
          message: "An error occurred",
          error: error instanceof Error ? error.message : error,
        });
      }
    }
    
    async toggleBankCodeAkonto(req:Request<toogleRequest>,res: Response):Promise<void>{
        try {
            let { id, status } = req.body;
            let sql = "UPDATE tbl_akonto_banks_code SET status = ? WHERE id = ?";
        
            let result = await mysqlcon(sql, [status, id]);
        
            if (result) {
            res.status(200).json({
                message: status === "0" ? "Bankcode Disabled Successfully✅" : "Bankcode Enabled Successfully✅",
              });
            } else {
            res.status(201).json({
                message: "Error While Updating",
              });
            }
        } catch (error) {
            res.status(500).json({
              message: "error occurered",
              error: error,
            });
        }
    }

    async currencySelect(req:Request,res: Response):Promise<void>{
        try {
            let sql = "SELECT sortname as value, sortname as label from countries WHERE status = 1"
            let result = await mysqlcon(sql)
            res.status(200).json({
                result
            });
            } catch (error) {
            res.status(500).json({
                message: "error occurered",
                error: error,
            });
        }
    }


}

export default new bankcodeAkonto
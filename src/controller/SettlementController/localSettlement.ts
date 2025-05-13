import { Request, Response } from "express";
import mysqlcon from "../../config/db_connection";
import Pagination from "../../services/pagination";

let today = new Date(); 
let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
let dateTime = date+' '+time; 

//default
interface LocalSettlementRequest {
  to?: string;
  from?: string;
  date?: string;
  pageNumber?: number;
  limit?: number;
  searchItem?: string;
  settlementId: string;
  requested_time: string;
  created_on: string;
  updated_on: string;
  settlement_time: string;
  [key: string]: any;
}
//default, requestLocalSettlement, toggleSettlementStatus
interface AuthenticatedRequest extends Request {
  body: LocalSettlement;
  user?: any; 
}
//requestLocalSettlement
interface ISettlementRequest {
  settlementId: string;
  user_id: number;
  toCurrency: string;
  accountN: string;
  bankName: string;
  branchName: string;
  swift: string;
  account_name: string;
  available_balance: number;
  requestedAmount: number;
  fees: number;
  remBalance: number;
}
//editLocalSettlement
interface IEditSettlementRequest {
  id: string;
  settlementId: string;
  user_id: number;
  toCurrency: string;
  accountN: string;
  bankName: string;
  branchName: string;
  swift: string;
  account_name: string;
  available_balance: number;
  requestedAmount: number;
  fees: number;
}
//getLocalData
interface SettlementData {
  id: number;
  settlementId: string;
  user_id: number;
  toCurrency: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  swiftCode: string;
  account_name: string;
  available_balance: number;
  requestedAmount: number;
  charges: number;
  settlementAmount: number;
  source: string;
  status: number;
  authorizer: string;
  merchant_name: string;
  requested_time: string;
  created_on: string;
  updated_on: string;
  settlement_time: string;
}
//toggleSettlementStatus
interface ToggleSettlementStatusRequest{
  body: {
    settlementId: string;
    val: number;
  };
  user: {
    group_id: number;
    role: number;
    email?: string;
  };
}
//userSettlementWallet
interface UserSettlementWalletRequest{
  body: {
    id: number;
  };
}
//userExchangeRate
interface UserExchangeRateRequest{
  body: {
    currency: string;
    toCurrency: string;
  };
}
//settlementCards
interface SettlementCardsRequest{
  body: {
    to?: string;
    from?: string;
    date?: string;
    searchItem?: string;
  };
}
//defaultDownload
interface DefaultDownloadRequest{
  body: {
    to?: string;
    from?: string;
    date?: string;
    searchItem?: string;
  };
}

class LocalSettlement{
  public async default(req: Request, res: Response): Promise<void> {
    try {
      const { group_id } = req.user as { group_id: string };
      const { to, from, date, pageNumber, limit, searchItem } = req.body;

      let sqlAllCount =
        "SELECT COUNT(*) AS Total FROM tbl_settlement WHERE settlement_mode = 2";
      let sqlCountDate =
        "SELECT COUNT(*) AS Total FROM tbl_settlement WHERE DATE(created_on) = ? AND settlement_mode = 2";
      let sqlToFromCount =
        "SELECT COUNT(*) AS Total FROM tbl_settlement WHERE DATE(created_on) >= ? AND DATE(created_on) <= ? AND settlement_mode = 2";
      let sqlSearchCount = `SELECT COUNT(*) AS Total FROM tbl_settlement WHERE settlementId LIKE '%${searchItem}%' AND settlement_mode = 2`;

      const countQuery = date
        ? sqlCountDate
        : to && from
        ? sqlToFromCount
        : searchItem
        ? sqlSearchCount
        : sqlAllCount;

      const countParams = date
        ? [date]
        : to && from
        ? [from, to]
        : [];

      const result = await mysqlcon(countQuery, countParams);
      const total = result[0].Total;

      const page = pageNumber ? Number(pageNumber) : 1;
      const pageLimit = limit ? Number(limit) : 10;

      const { start, numOfPages } = Pagination.pagination(total, page, pageLimit);

      const sql = `SELECT tbl_settlement.*, DATE_FORMAT(requested_time,'%Y-%m-%d %H:%i:%s') AS requested_time, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on, DATE_FORMAT(settlement_time,'%Y-%m-%d %H:%i:%s') AS settlement_time FROM tbl_settlement WHERE settlement_mode = 2 ORDER BY created_on DESC LIMIT ?,?`;

      const sqlDate = `SELECT tbl_settlement.*, DATE_FORMAT(requested_time,'%Y-%m-%d %H:%i:%s') AS requested_time, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on, DATE_FORMAT(settlement_time,'%Y-%m-%d %H:%i:%s') AS settlement_time FROM tbl_settlement WHERE DATE(created_on) = ? AND settlement_mode = 2 ORDER BY created_on DESC LIMIT ?,?`;

      const sqlToFrom = `SELECT tbl_settlement.*, DATE_FORMAT(requested_time,'%Y-%m-%d %H:%i:%s') AS requested_time, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on, DATE_FORMAT(settlement_time,'%Y-%m-%d %H:%i:%s') AS settlement_time FROM tbl_settlement WHERE DATE(created_on) >= ? AND DATE(created_on) <= ? AND settlement_mode = 2 ORDER BY created_on DESC LIMIT ?,?`;

      const sqlSearch = `SELECT tbl_settlement.*, DATE_FORMAT(requested_time,'%Y-%m-%d %H:%i:%s') AS requested_time, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on, DATE_FORMAT(settlement_time,'%Y-%m-%d %H:%i:%s') AS settlement_time FROM tbl_settlement WHERE settlementId LIKE '%${searchItem}%' AND settlement_mode = 2 ORDER BY created_on DESC LIMIT ?,?`;

      const mainQuery = date
        ? sqlDate
        : to && from
        ? sqlToFrom
        : searchItem
        ? sqlSearch
        : sql;

      const mainParams = date
        ? [date, start, pageLimit]
        : to && from
        ? [from, to, start, pageLimit]
        : [start, pageLimit];

      const data = await mysqlcon(mainQuery, mainParams);

      const startRange = start + 1;
      const endRange = start + data.length;

      res.status(200).json({
        message:
          data.length > 0
            ? `Showing ${startRange} to ${endRange} data from ${total}`
            : "NO DATA",
        groupId: group_id,
        numOfPages: numOfPages || 1,
        result: data,
      });
    } catch (error) {
      res.status(500).json({
        message: "Something went wrong",
        error,
      });
    }
  }

  public async requestLocalSettlement(req: Request, res: Response): Promise<void> {
    try {
      const group_id: number = req.user.group_id;
      const role: number = req.user.role;
      let source: string;
  
      if (group_id === 1) {
        source = "By SuperAdmin";
      } else {
        source = role === 1 ? "By Admin" : "By Settlement";
      }
  
      const nameSql = "SELECT name FROM tbl_user WHERE id = ?";
      const nameResult = await mysqlcon(nameSql, [req.body.user_id]);
  
      const merchant_name = nameResult[0]?.name || '';
      const authorizer = req.user.email;
  
      const Settlement = {
        settlementId: req.body.settlementId,
        settlement_mode: 2,
        user_id: req.body.user_id,
        toCurrency: req.body.toCurrency,
        accountNumber: req.body.accountN,
        bankName: req.body.bankName,
        branchName: req.body.branchName,
        swiftCode: req.body.swift,
        account_name: req.body.account_name,
        available_balance: req.body.available_balance,
        requestedAmount: req.body.requestedAmount,
        charges: req.body.fees,
        settlementAmount: req.body.requestedAmount && !req.body.fees
          ? req.body.requestedAmount
          : req.body.requestedAmount && req.body.fees
            ? req.body.requestedAmount - req.body.fees
            : 0,
        source,
        status: 2,
        authorizer,
        merchant_name
      };
  
      const sqlInsert = "INSERT INTO tbl_settlement SET ?, requested_time = NOW(), created_on = NOW(), updated_on = NOW()";
      const result = await mysqlcon(sqlInsert, Settlement);
  
      const updateWalletSql = "UPDATE tbl_user SET wallet = ? WHERE id = ?";
      const data = await mysqlcon(updateWalletSql, [req.body.remBalance, req.body.user_id]);
  
      if (result.affectedRows > 0) {
         res.status(200).json({
          message: "Request Settlement Transaction Successfully",
          // data: result,
        });
      } else {
         res.status(201).json({
          message: "Error While Creating",
          // data: result
        });
      }
    } catch (error) {
      console.error(error);
       res.status(500).json({
        message: "Error occurred",
        error
      });
    }
  }

  public async editLocalSettlement(req: Request<IEditSettlementRequest>, res: Response): Promise<void> {
    try {
        let {id} = req.body
      const Settlement = {
        settlementId: req.body.settlementId,
        user_id: req.body.user_id,
        toCurrency: req.body.toCurrency,
        accountNumber: req.body.accountN,
        bankName: req.body.bankName,
        branchName: req.body.branchName,
        swiftCode: req.body.swift,
        account_name: req.body.account_name,
        available_balance: req.body.available_balance,
        requestedAmount: req.body.requestedAmount,
        charges: req.body.fees,
        settlementAmount: req.body.requestedAmount && !req.body.fees
          ? req.body.requestedAmount
          : req.body.requestedAmount && req.body.fees
            ? req.body.requestedAmount - req.body.fees
            : 0,
            requested_time: dateTime,
            updated_on : dateTime

      };
  
      const sqlUpdate = "UPDATE tbl_settlement SET ? WHERE id = ?";
      const result = await mysqlcon(sqlUpdate, [Settlement, id]);
  
      if (result.affectedRows > 0) {
         res.status(200).json({
          message: "Request settlement transaction successfully",
        //   data: result
        });
      } else {
         res.status(201).json({
          message: "Error While Updating",
        //   data: result
        });
      }
    } catch (error) {
      console.error(error);
       res.status(500).json({
        message: "Error occurred",
        error
      });
    }
  }

  public async getLocalData(req: Request<SettlementData>, res: Response): Promise<void> {
    try {
      const { id } = req.body;
  
      const sql = `
        SELECT 
          tbl_settlement.*, 
          DATE_FORMAT(requested_time,'%Y-%m-%d %H:%i:%s') AS requested_time, 
          DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, 
          DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on, 
          DATE_FORMAT(settlement_time,'%Y-%m-%d %H:%i:%s') AS settlement_time 
        FROM tbl_settlement 
        WHERE id = ?
      `;
  
      const result = await mysqlcon(sql, [id]);
  
      if (result.length !== 0) {
         res.status(200).json({
          message: `Settlement for id = ${id}`,
          data: result
        });
      } else {
         res.status(404).json({
          message: `No Record Found`
        });
      }
    } catch (error) {
      console.error(error);
       res.status(500).json({
        message: "An error occurred",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  public async toggleSettlementStatus(req: Request, res: Response): Promise<void> {
    try {
      const { group_id } = req.user;
      const { settlementId, val } = req.body;
  
      let sql = "";
      let message = "";
  
      if (val === 1) {
        if (group_id === 1) {
          sql = "UPDATE tbl_settlement SET status = 1 WHERE settlementId = ?";
          message = "Status Approved Successfully By Superadmin";
        } else if (group_id === 2) {
          sql = "UPDATE tbl_settlement SET status = 3 WHERE settlementId = ?";
          message = "Approval Request Sent To SuperAdmin";
        }
      } else {
        if (group_id === 1) {
          sql = "UPDATE tbl_settlement SET status = 0 WHERE settlementId = ?";
          message = "Status Failed Successfully By Superadmin";
        } else if (group_id === 2) {
          sql = "UPDATE tbl_settlement SET status = 0 WHERE settlementId = ?";
          message = "Status Failed Successfully By Subadmin";
        }
      }
  
      const result = await mysqlcon(sql, [settlementId]);
  
      if (result) {
         res.status(200).json({ message });
      } else {
         res.status(400).json({
          message: "Error While Updating"
        });
      }
    } catch (err) {
      console.error(err);
       res.status(500).json({
        message: "An error occurred",
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  public async userSettlementWallet(req: Request<UserSettlementWalletRequest>, res: Response): Promise<void> {
    try {
      const { id } = req.body;
  
      const sql = "SELECT wallet FROM tbl_user WHERE id = ?";
      const result = await mysqlcon(sql, [id]);
  
      if (result.length !== 0) {
         res.status(200).json({
          data: result
        });
      } else {
         res.status(201).json({
          message: "No data found"
        });
      }
    } catch (error) {
      console.error(error);
       res.status(500).json({
        message: "Error occurred",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  public async userExchangeRate(req: Request<UserExchangeRateRequest>, res: Response): Promise<void> {
    try {
      const { currency, toCurrency } = req.body;
  
      const sql = "SELECT rate FROM tbl_user_settled_currency WHERE deposit_currency = ? AND settled_currency = ?";
      const result = await mysqlcon(sql, [currency, toCurrency]);
  
      if (result.length !== 0) {
         res.status(200).json({
          message: "Data",
          data: result
        });
      } else {
         res.status(201).json({
          message: "No data found",
          data: result
        });
      }
    } catch (error) {
      console.error(error);
       res.status(500).json({
        message: "Error occurred",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  public async settlementCards(req: Request<SettlementCardsRequest>, res: Response): Promise<void> {
    try {
      const { to, from, date, searchItem } = req.body;
  
      const cardSql = `
        SELECT COUNT(*) AS count, 
               SUM(requestedAmount) AS amount, 
               SUM(charges) AS charges, 
               SUM(net_amount_for_settlement) AS net_amount_for_settlement, 
               SUM(settlementAmount) AS settlementAmount 
        FROM tbl_settlement 
        WHERE settlement_mode = 2
      `;
  
      const sqlToFrom = `
        SELECT COUNT(*) AS count, 
               SUM(requestedAmount) AS amount, 
               SUM(charges) AS charges, 
               SUM(net_amount_for_settlement) AS net_amount_for_settlement, 
               SUM(settlementAmount) AS settlementAmount 
        FROM tbl_settlement 
        WHERE settlement_mode = 2 
          AND DATE(created_on) >= ? 
          AND DATE(created_on) <= ?
      `;
  
      const sqlDate = `
        SELECT COUNT(*) AS count, 
               SUM(requestedAmount) AS amount, 
               SUM(charges) AS charges, 
               SUM(net_amount_for_settlement) AS net_amount_for_settlement, 
               SUM(settlementAmount) AS settlementAmount 
        FROM tbl_settlement 
        WHERE settlement_mode = 2 
          AND DATE(created_on) = ?
      `;
  
      const sqlSearch = `
        SELECT COUNT(*) AS count, 
               SUM(requestedAmount) AS amount, 
               SUM(charges) AS charges, 
               SUM(net_amount_for_settlement) AS net_amount_for_settlement, 
               SUM(settlementAmount) AS settlementAmount 
        FROM tbl_settlement 
        WHERE settlement_mode = 2 
          AND settlementId LIKE ?
      `;
  
      let query: string;
      let queryParams: any[] = [];
  
      if (to && from) {
        query = sqlToFrom;
        queryParams = [from, to];
      } else if (date) {
        query = sqlDate;
        queryParams = [date];
      } else if (searchItem) {
        query = sqlSearch;
        queryParams = [`%${searchItem}%`];
      } else {
        query = cardSql;
      }
  
      const result: any[] = await mysqlcon(query, queryParams);
  
      const {
        amount = 0,
        charges = 0,
        net_amount_for_settlement = 0,
        settlementAmount = 0,
        count = 0
      } = result[0] || {};
  
      const format = (val: string) => parseFloat(val).toFixed(2);
  
      const responseData = [
        { name: "Total Settlement Request", amount: format(amount || 0) },
        { name: "Total Fees/Charges", amount: format(charges || 0) },
        { name: "Total Amount Sent", amount: format(net_amount_for_settlement || 0) },
        { name: "Total Amount Received", amount: format(settlementAmount || 0) }
      ];
  
      if (count === 0) {
         res.status(201).json({
          message: `User has no transaction`,
          data: responseData.map((item) => ({ ...item, amount: 0 }))
        });
      } else {
         res.status(200).json({ data: responseData });
      }
  
    } catch (error) {
      console.error(error);
       res.status(500).json({
        message: "error occurred",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  public async defaultDownload(req: Request<DefaultDownloadRequest>, res: Response): Promise<void> {
    try {
      const { to, from, date, searchItem } = req.body;
  
      const baseSQL = `
        SELECT * FROM tbl_settlement 
        WHERE settlement_mode = 2 
        ORDER BY created_on
      `;
  
      const dateSQL = `
        SELECT * FROM tbl_settlement 
        WHERE DATE(created_on) = ? 
          AND settlement_mode = 2 
        ORDER BY created_on
      `;
  
      const toFromSQL = `
        SELECT * FROM tbl_settlement 
        WHERE DATE(created_on) >= ? 
          AND DATE(created_on) <= ? 
          AND settlement_mode = 2 
        ORDER BY created_on
      `;
  
      const searchSQL = `
        SELECT * FROM tbl_settlement 
        WHERE settlementId LIKE ? 
          AND settlement_mode = 2 
        ORDER BY created_on
      `;
  
      let query: string;
      let queryParams: any[] = [];
  
      if (date) {
        query = dateSQL;
        queryParams = [date];
      } else if (to && from) {
        query = toFromSQL;
        queryParams = [from, to];
      } else if (searchItem) {
        query = searchSQL;
        queryParams = [`%${searchItem}%`];
      } else {
        query = baseSQL;
      }
  
      const result: any[] = await mysqlcon(query, queryParams);
  
      res.send(result);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Server Error",
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export default new LocalSettlement();
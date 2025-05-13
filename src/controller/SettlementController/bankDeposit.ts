import { Request, Response } from "express";
import mysqlcon from "../../config/db_connection";
import Pagination from "../../services/pagination";

let today = new Date(); 
let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
let dateTime = date+' '+time; 

//default
interface BankDepositRequestBody {
  to?: string;
  from?: string;
  date?: string;
  pageNumber?: number;
  limit?: number;
  searchItem?: string;
  Total: number;
  id: number;
  bank_name: string;
  trx_id: string;
  amount: number;
  created_on: string;
  title: string;
}
//createAndUpdate
interface User {
  id: number;
  name: string;
  gateway_name: string;
  merchantId: number;
  merchantName: string;
  receivedDate: string;
  Currency: string;
  bankName: string;
  TransactionType: string;
  transactionid: string;
  depositsReceived: number;
  BankCharges: number;
  Tax: number;
  TotalCharges: number;
  authorizer: string;
  user?: {
    email: string;
  };
}
//createAndUpdate 
interface AuthenticatedRequest extends Request {
  body: User;
  user?: any; // You can define proper user type here if available
}
//bankDepositDownload
interface BankDepositDownloadRequest {
  to?: string;   
  from?: string; 
  date?: string; 
  id: number;
  user_id: number;
  mer_name: string;
  recieved_date: string;
  currency: string;
  bank_name: number; 
  trx_type: string;
  trx_id: string;
  deposit_recieved: number;
  bank_charge: number;
  tax: number;
  total_charges: number;
  amount: number;
  auth: string;
  created_on: string;
  updated_on: string;
  title: string; 
}
//bankDepositsCards
interface BankDepositsCardsRequest {
  to?: string;      
  from?: string;    
  searchItem?: string;
  date?: string;  
  count: number | null;
  bank_charges: number | null;
  total_charges: number | null;
  amount: number | null;    
}
 
class BankDeposit{
  public async default(req: Request<BankDepositRequestBody>, res: Response): Promise<void> {
    try {
      const { to, from, date, pageNumber, searchItem, limit } = req.body;

      const sqlAllCount = "SELECT COUNT(*) AS Total FROM tbl_bank_deposites_receive";
      const sqCountDate = "SELECT COUNT(*) AS Total FROM tbl_bank_deposites_receive WHERE DATE(created_on) = ?";
      const sqlToFromCount = "SELECT COUNT(*) AS Total FROM tbl_bank_deposites_receive WHERE DATE(created_on) >= ? AND DATE(created_on) <= ?";
      const sqlSearchCount = `SELECT COUNT(*) AS Total FROM tbl_bank_deposites_receive WHERE trx_id LIKE '%${searchItem}%'`;

      const countQuery = date
        ? sqCountDate
        : to && from
        ? sqlToFromCount
        : searchItem
        ? sqlSearchCount
        : sqlAllCount;

      const countParams: any[] =
        date ? [date] : to && from ? [from, to] : [];

      const result = await mysqlcon(countQuery, countParams);
      const total: number = result[0]?.Total || 0;
      const page: number = pageNumber ? Number(pageNumber) : 1;
      const pageLimit: number = limit ? Number(limit) : 10;

      const { start, numOfPages } = Pagination.pagination(total, page, pageLimit);

      const sqlBase = `
        SELECT tbl_bank_deposites_receive.*, tbl_akonto_banks_code.title 
        FROM tbl_bank_deposites_receive 
        LEFT JOIN tbl_akonto_banks_code 
        ON tbl_bank_deposites_receive.bank_name = tbl_akonto_banks_code.id
      `;

      const sqlDate = sqlBase + " WHERE DATE(tbl_bank_deposites_receive.created_on) = ? ORDER BY tbl_bank_deposites_receive.created_on DESC LIMIT ?,?";
      const sqlToFrom = sqlBase + " WHERE DATE(tbl_bank_deposites_receive.created_on) >= ? AND DATE(tbl_bank_deposites_receive.created_on) <= ? ORDER BY tbl_bank_deposites_receive.created_on DESC LIMIT ?,?";
      const sqlSearch = `
        SELECT tbl_bank_deposites_receive.*, tbl_akonto_banks_code.title 
        FROM tbl_bank_deposites_receive 
        JOIN tbl_akonto_banks_code 
        ON tbl_bank_deposites_receive.bank_name = tbl_akonto_banks_code.id 
        WHERE trx_id LIKE '%${searchItem}%' 
        ORDER BY tbl_bank_deposites_receive.created_on DESC 
        LIMIT ?,?
      `;
      const sqlDefault = sqlBase + " ORDER BY created_on DESC LIMIT ?,?";

      const dataQuery = date
        ? sqlDate
        : to && from
        ? sqlToFrom
        : searchItem
        ? sqlSearch
        : sqlDefault;

      const dataParams: any[] = date
        ? [date, start, pageLimit]
        : to && from
        ? [from, to, start, pageLimit]
        : [start, pageLimit];

      const data = await mysqlcon(dataQuery, dataParams);

      const startRange = start + 1;
      const endRange = start + data.length;

      res.status(200).json({
        message:
          data.length > 0
            ? `Showing ${startRange} to ${endRange} data from ${total}`
            : "NO DATA",
        result: data,
        numOfPages: numOfPages || 1,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  }

  public async createAndUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.body as { id?: number };

      if (Object.keys(req.body).length <= 0) {
        const { email } = req.user as { email: string };

        const sqlForMerchant = "SELECT id, name FROM tbl_user";
        const sqlForBank = "SELECT id, gateway_name FROM payment_gateway WHERE type = 0 AND status = 1";

        const [merchant, bankName] = await Promise.all([
          mysqlcon(sqlForMerchant),
          mysqlcon(sqlForBank)
        ]);

           res.status(200).json({ merchant, bankName, authorizer: email });
      }

      const formData = {
        user_id: req.body.merchantId,
        mer_name: req.body.merchantName,
        recieved_date: req.body.receivedDate,
        currency: req.body.Currency,
        bank_name: req.body.bankName,
        trx_type: req.body.TransactionType,
        trx_id: req.body.transactionid,
        deposit_recieved: req.body.depositsReceived,
        bank_charge: req.body.BankCharges,
        tax: req.body.Tax,
        total_charges: req.body.TotalCharges,
        amount: (req.body.depositsReceived && req.body.TotalCharges)
          ? (req.body.depositsReceived - req.body.TotalCharges)
          : req.body.depositsReceived,
        auth: req.body.authorizer,
        created_on: dateTime,
        updated_on: dateTime
      };

      if (Object.keys(req.body).length >= 6 && !id) {
        const insertSql = "INSERT INTO tbl_bank_deposites_receive SET ?";
        const result = await mysqlcon(insertSql, [formData]);

        if (result.affectedRows) {
           res.status(200).json({ message: "Successfully Inserted" });
        } else {
           res.status(403).json({ message: "Error While Inserting" });
        }
      }

      if (Object.keys(req.body).length >= 6 && id) {
        const updateSql = "UPDATE tbl_bank_deposites_receive SET ? WHERE id = ?";
        const result = await mysqlcon(updateSql, [formData, id]);

        if (result.affectedRows) {
           res.status(200).json({ message: "Successfully Updated" });
        } else {
           res.status(403).json({ message: "Error While Updating" });
        }
      }
    } catch (error) {
      res.status(500).json({
        message: "Something Went Wrong in Bank Deposit",
        error,
      });
    }
  }

  public async bankDepositDownload(req: Request<BankDepositDownloadRequest>, res: Response): Promise<void> {
    try {
        const { to, from, date } = req.body;
    
        const sql = `
          SELECT tbl_bank_deposites_receive.*, tbl_akonto_banks_code.title 
          FROM tbl_bank_deposites_receive 
          JOIN tbl_akonto_banks_code 
          ON tbl_bank_deposites_receive.bank_name = tbl_akonto_banks_code.title 
          ORDER BY tbl_bank_deposites_receive.created_on`;
    
        const sqlDate = `
          SELECT tbl_bank_deposites_receive.*, tbl_akonto_banks_code.title 
          FROM tbl_bank_deposites_receive 
          JOIN tbl_akonto_banks_code 
          ON tbl_bank_deposites_receive.bank_name = tbl_akonto_banks_code.title
          WHERE DATE(tbl_bank_deposites_receive.created_on) = ? 
          ORDER BY tbl_bank_deposites_receive.created_on`;
    
        const sqlToFrom = `
          SELECT tbl_bank_deposites_receive.*, tbl_akonto_banks_code.title 
          FROM tbl_bank_deposites_receive 
          JOIN tbl_akonto_banks_code 
          ON tbl_bank_deposites_receive.bank_name = tbl_akonto_banks_code.title
          WHERE DATE(tbl_bank_deposites_receive.created_on) >= ? 
            AND DATE(tbl_bank_deposites_receive.created_on) <= ? 
          ORDER BY tbl_bank_deposites_receive.created_on`;
    
        const query = date
          ? sqlDate
          : to && from
          ? sqlToFrom
          : sql;
    
        const params = date
          ? [date]
          : to && from
          ? [from, to]
          : [];
    
        const data = await mysqlcon(query, params);
          res.status(200).send(data);
      } catch (error) {
        console.log(error)
          res.status(500).json({
          message: "Error fetching bank deposit data",
          error,
        });
      }
  }

  public async bankDepositsCards(req: Request<BankDepositsCardsRequest>, res: Response): Promise<void> {
    try {
      const { to, from, searchItem, date } = req.body;
  
      const sqlDefault = `
        SELECT COUNT(*) AS count, 
               SUM(bank_charge) AS bank_charges, 
               SUM(total_charges) AS total_charges, 
               SUM(amount) AS amount 
        FROM tbl_bank_deposites_receive`;
  
      const sqlToFrom = `
        SELECT COUNT(*) AS count, 
               SUM(bank_charge) AS bank_charges, 
               SUM(total_charges) AS total_charges, 
               SUM(amount) AS amount 
        FROM tbl_bank_deposites_receive 
        WHERE DATE(created_on) >= ? AND DATE(created_on) <= ?`;
  
      const sqlDate = `
        SELECT COUNT(*) AS count, 
               SUM(bank_charge) AS bank_charges, 
               SUM(total_charges) AS total_charges, 
               SUM(amount) AS amount 
        FROM tbl_bank_deposites_receive 
        WHERE DATE(created_on) = ?`;
  
      const sqlSearch = `
        SELECT COUNT(*) AS count, 
               SUM(bank_charge) AS bank_charges, 
               SUM(total_charges) AS total_charges, 
               SUM(amount) AS amount 
        FROM tbl_bank_deposites_receive 
        WHERE trx_id LIKE ?`;
  
      let query = sqlDefault;
      let params: any[] = [];
  
      if (to && from) {
        query = sqlToFrom;
        params = [from, to];
      } else if (date) {
        query = sqlDate;
        params = [date];
      } else if (searchItem) {
        query = sqlSearch;
        params = [`%${searchItem}%`];
      }
  
      const result = await mysqlcon(query, params);
      const summary = result[0];
  
      const transaction = summary.count ?? 0;
      const bankFees = summary.bank_charges ? Number(summary.bank_charges.toFixed(2)) : 0;
      const totalCharges = summary.total_charges ? Number(summary.total_charges.toFixed(2)) : 0;
      const totalAmount = summary.amount ? Number(summary.amount.toFixed(2)) : 0;
  
      const data =
        transaction === 0
          ? [
              { name: "Total Settlement Received", amount: 0 },
              { name: "Total Bank Fees/Charges", amount: 0 },
              { name: "Total Commission/Charges", amount: 0 },
              { name: "Net Settlement", amount: 0 },
            ]
          : [
              { name: "Total Transactions", amount: transaction },
              { name: "Total Bank Fees/Charges", amount: bankFees },
              { name: "Total Commission/Charges", amount: totalCharges },
              { name: "Total Amount", amount: totalAmount },
            ];
  
       res.status(200).json({ data });
    } catch (error) {
      console.error(error);
       res.status(500).json({
        message: "Error occurred",
        error,
      });
    }
  }
}

export default new BankDeposit();
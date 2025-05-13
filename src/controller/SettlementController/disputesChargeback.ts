import { Request, Response } from "express";
import mysqlcon from "../../config/db_connection";

let today = new Date(); 
let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
let dateTime = date+' '+time; 

//default
interface ChargebackDispute {
  user_id: number;
  transaction_id: string;
  mer_name: string;
  recieved_date: string;
  currency: string;
  amount: number;
  charges: number;
  bank_name: string;
  customer_name: string;
  reason: string;
  status: string;
  mode: string;
  auth: string;
  net_amount: number;
  created_on: string;
  updated_on: string;
  limit: number;
  start: number;
  numOfPages: number;
  searchItem?: string;
}
//createDisputes
interface DisputeForm {
  merchantId: number;
  disputeCurrency: string;
  bank: string;
  transactionType: string;
  disputeId: string;
  cusName: string;
  disputeAmount: number;
  disputeCharges: number;
  reason: string;
  orderid: string;
  body: DisputeForm;
    email: string;
}
//createDisputes
interface AuthenticatedRequest extends Request {
  body: DisputeForm;
  user?: any; 
}
//updateDisputes
interface UpdateDisputeBody {
  ID: string; 
  currency: string;
  bank: string;
  type: string;
  reason: string;
}
//getTrxData 
interface GetTrxDataBody {
  transaction_id: string;
}
//DisputesChargebackCardData
interface DisputesCardRequestBody {
  date?: string;
  from?: string;
  to?: string;
  searchItem?: string;
}
//downloadDisputeChargeback
interface DisputeChargeback {
  user_id: number;
  transaction_id: string;
  mer_name: string;
  recieved_date: string;
  currency: string;
  amount: number;
  charges: number;
  bank_name: string;
  customer_name: string;
  reason: string;
  status: number;
  mode: string;
  auth: string;
  net_amount: number;
  created_on: string;
  updated_on: string;
}
//getDisputeDetails
interface CustomerDetails {
  Amount: number;
  Charges: number;
  CustomerName: string;
}

class DisputesChargeBack{
  public async default(req: Request, res: Response): Promise<void> {
        try {
          const { from, to, date: reqDate, searchItem, pageNumber, limit: reqLimit } = req.body;
    
          const pagination = (total: number, page: number, limit = 10)=> {
            const numOfPages = Math.ceil(total / limit);
            const start = page * limit - limit;
            return { limit, start, numOfPages, searchItem };
          };
    
          const CountFromToSql =
            "SELECT count(*) AS Total FROM tbl_chargeback_disputes WHERE DATE(created_on) >= ? AND DATE(created_on) <= ?";
          const CountDateSql =
            "SELECT count(*) AS Total FROM tbl_chargeback_disputes WHERE DATE(created_on) = ?";
          const CountdefaultDataSql = "SELECT count(*) AS Total FROM tbl_chargeback_disputes";
          const CountSearchSql = `SELECT count(*) AS Total FROM tbl_chargeback_disputes WHERE customer_name LIKE '%${searchItem}%'`;
    
          const CountResult: any[] = await mysqlcon(
            from && to
              ? CountFromToSql
              : reqDate
              ? CountDateSql
              : searchItem
              ? CountSearchSql
              : CountdefaultDataSql,
            from && to ? [from, to] : reqDate ? [reqDate] : undefined
          );
    
          const total = CountResult[0].Total;
          const Page = pageNumber ? Number(pageNumber) : 1;
          const limit = reqLimit ? Number(reqLimit) : 10;
          const page = pagination(total, Page, limit);
    
          const DefaultSql = `
            SELECT tbl_chargeback_disputes.user_id, tbl_chargeback_disputes.transaction_id, tbl_chargeback_disputes.mer_name,
              DATE_FORMAT(tbl_chargeback_disputes.recieved_date,'%Y-%m-%d %H:%i:%s') AS recieved_date,
              tbl_chargeback_disputes.currency, tbl_chargeback_disputes.amount, tbl_chargeback_disputes.charges,
              payment_gateway.gateway_name AS bank_name, tbl_chargeback_disputes.customer_name, tbl_chargeback_disputes.reason,
              tbl_chargeback_disputes.status, tbl_chargeback_disputes.mode, tbl_chargeback_disputes.auth,
              tbl_chargeback_disputes.net_amount, DATE_FORMAT(tbl_chargeback_disputes.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,
              DATE_FORMAT(tbl_chargeback_disputes.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on
            FROM tbl_chargeback_disputes
            LEFT JOIN payment_gateway ON payment_gateway.id = tbl_chargeback_disputes.bank_name
            ORDER BY created_on DESC
            LIMIT ?, ?
          `;
    
          const FromToSql = `
            SELECT tbl_chargeback_disputes.user_id, tbl_chargeback_disputes.transaction_id, tbl_chargeback_disputes.mer_name,
              DATE_FORMAT(tbl_chargeback_disputes.recieved_date,'%Y-%m-%d %H:%i:%s') AS recieved_date,
              tbl_chargeback_disputes.currency, tbl_chargeback_disputes.amount, tbl_chargeback_disputes.charges,
              payment_gateway.gateway_name AS bank_name, tbl_chargeback_disputes.customer_name, tbl_chargeback_disputes.reason,
              tbl_chargeback_disputes.status, tbl_chargeback_disputes.mode, tbl_chargeback_disputes.auth,
              tbl_chargeback_disputes.net_amount, DATE_FORMAT(tbl_chargeback_disputes.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,
              DATE_FORMAT(tbl_chargeback_disputes.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on
            FROM tbl_chargeback_disputes
            LEFT JOIN payment_gateway ON payment_gateway.id = tbl_chargeback_disputes.bank_name
            WHERE DATE(tbl_chargeback_disputes.created_on) >= ? AND DATE(tbl_chargeback_disputes.created_on) <= ?
            ORDER BY created_on DESC
            LIMIT ?, ?
          `;
    
          const DateSql = `
            SELECT tbl_chargeback_disputes.user_id, tbl_chargeback_disputes.transaction_id, tbl_chargeback_disputes.mer_name,
              DATE_FORMAT(tbl_chargeback_disputes.recieved_date,'%Y-%m-%d %H:%i:%s') AS recieved_date,
              tbl_chargeback_disputes.currency, tbl_chargeback_disputes.amount, tbl_chargeback_disputes.charges,
              payment_gateway.gateway_name AS bank_name, tbl_chargeback_disputes.customer_name, tbl_chargeback_disputes.reason,
              tbl_chargeback_disputes.status, tbl_chargeback_disputes.mode, tbl_chargeback_disputes.auth,
              tbl_chargeback_disputes.net_amount, DATE_FORMAT(tbl_chargeback_disputes.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,
              DATE_FORMAT(tbl_chargeback_disputes.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on
            FROM tbl_chargeback_disputes
            LEFT JOIN payment_gateway ON payment_gateway.id = tbl_chargeback_disputes.bank_name
            WHERE DATE(tbl_chargeback_disputes.created_on) = ?
            ORDER BY created_on DESC
          `;
    
          const SearchSql = `
            SELECT tbl_chargeback_disputes.user_id, tbl_chargeback_disputes.transaction_id, tbl_chargeback_disputes.mer_name,
              DATE_FORMAT(tbl_chargeback_disputes.recieved_date,'%Y-%m-%d %H:%i:%s') AS recieved_date,
              tbl_chargeback_disputes.currency, tbl_chargeback_disputes.amount, tbl_chargeback_disputes.charges,
              payment_gateway.gateway_name AS bank_name, tbl_chargeback_disputes.customer_name, tbl_chargeback_disputes.reason,
              tbl_chargeback_disputes.status, tbl_chargeback_disputes.mode, tbl_chargeback_disputes.auth,
              tbl_chargeback_disputes.net_amount, DATE_FORMAT(tbl_chargeback_disputes.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,
              DATE_FORMAT(tbl_chargeback_disputes.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on
            FROM tbl_chargeback_disputes
            LEFT JOIN payment_gateway ON payment_gateway.id = tbl_chargeback_disputes.bank_name
            WHERE customer_name LIKE '%${searchItem}%'
            LIMIT ?, ?
          `;
    
          const data: ChargebackDispute[] = await mysqlcon(
            from && to
              ? FromToSql
              : reqDate
              ? DateSql
              : searchItem
              ? SearchSql
              : DefaultSql,
            from && to
              ? [from, to, page.start, page.limit]
              : reqDate
              ? [reqDate]
              : searchItem
              ? [page.start, page.limit]
              : [page.start, page.limit]
          );
    
          const startRange = page.start + 1;
          const endRange = page.start + data.length;
    
          res.status(200).json({
            message:
              data.length > 0
                ? `Showing ${startRange} to ${endRange} data from ${total}`
                : "NO DATA",
            numOfPages: page.numOfPages,
            pageLimit: page.limit,
            result: data,
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Something went wrong", error });
        }
  }
  //error coming- TypeError: Cannot read properties of undefined (reading 'name')
  public async createDisputes(req: Request, res: Response): Promise<void> {
        try {
          const sqlName = "SELECT name FROM tbl_user WHERE id = ?";
          const resultName = await mysqlcon(sqlName, [req.body.merchantId]);
          console.log(resultName);
          
    
          if (!resultName || resultName.length === 0) {
            res.status(404).json({ message: "Merchant not found" });
          }
    
          const formData = {
            user_id: req.body.merchantId,
            mer_name: resultName[0].name,
            recieved_date: dateTime,
            currency: req.body.disputeCurrency,
            bank_name: req.body.bank,
            mode: req.body.transactionType,
            transaction_id: req.body.disputeId,
            customer_name: req.body.cusName,
            amount: req.body.disputeAmount,
            charges: req.body.disputeCharges,
            reason: req.body.reason,
            net_amount:
              req.body.disputeAmount && req.body.disputeCharges
                ? req.body.disputeAmount - req.body.disputeCharges
                : req.body.disputeAmount,
            auth: req.user.email,
            status: 5,
            created_on: dateTime,
            updated_on: dateTime,
          };
    
          const insertSql = "INSERT INTO tbl_chargeback_disputes SET ?";
          const insertResult = await mysqlcon(insertSql, [formData]);
    
          if (insertResult.affectedRows) {
            const updateSql =
              "UPDATE tbl_merchant_transaction SET status = 5 WHERE order_no = ?";
            const updateResult = await mysqlcon(updateSql, [req.body.orderid]);
    
             res.status(200).json({ message: "Successfully", updateResult });
          } else {
             res.status(403).json({ message: "Error While Inserting" });
          }
        } catch (error) {
          console.error(error);
          res
            .status(500)
            .json({ message: "Something Went Wrong in Bank Deposit", error });
        }
  }

  public async updateDisputes(req: Request<UpdateDisputeBody>, res: Response): Promise<void> {
    try {
      const { ID } = req.body;

      const formData = {
        currency: req.body.currency,
        bank_name: req.body.bank,
        mode: req.body.type,
        reason: req.body.reason,
        updated_on: dateTime,
      };

      const sql = "UPDATE tbl_chargeback_disputes SET ? WHERE transaction_id = ?";
      const result = await mysqlcon(sql, [formData, ID]);

      if (result.affectedRows) {
        res.status(200).json({ message: "Successfully Data Updated" });
      } else {
        res.status(403).json({ message: "Error While Updating" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something Went Wrong", error });
    }
  }

  public async getTrxData(req: Request<GetTrxDataBody>, res: Response): Promise<void> {
    try {
      const { transaction_id } = req.body;

      const sql = `
        SELECT tbl_chargeback_disputes.*, 
        DATE_FORMAT(tbl_chargeback_disputes.recieved_date, '%Y-%m-%d %H:%i:%s') AS recieved_date 
        FROM tbl_chargeback_disputes 
        WHERE transaction_id = ?
      `;

      const result = await mysqlcon(sql, [transaction_id]);

      res.status(200).json({
        result: result[0]
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  }
  
  public async DisputesChargebackCardData(req: Request<DisputesCardRequestBody>,res: Response): Promise<void> {
    try {
      const { date, from, to, searchItem } = req.body;

      const sqlDefault = `
        SELECT COALESCE(SUM(amount), 0) AS DisputesChargebacksAmount,
               COUNT(id) AS DisputesChargebacksTransaction,
               COALESCE(SUM(charges), 0) AS DisputesChargebacksCharges
        FROM tbl_chargeback_disputes
      `;

      const sqlDate = `
        SELECT COALESCE(SUM(amount), 0) AS DisputesChargebacksAmount,
               COUNT(id) AS DisputesChargebacksTransaction,
               COALESCE(SUM(charges), 0) AS DisputesChargebacksCharges
        FROM tbl_chargeback_disputes
        WHERE DATE(created_on) = ?
      `;

      const sqlFromTo = `
        SELECT COALESCE(SUM(amount), 0) AS DisputesChargebacksAmount,
               COUNT(id) AS DisputesChargebacksTransaction,
               COALESCE(SUM(charges), 0) AS DisputesChargebacksCharges
        FROM tbl_chargeback_disputes
        WHERE DATE(created_on) >= ? AND DATE(created_on) <= ?
      `;

      const sqlSearch = `
        SELECT COALESCE(SUM(amount), 0) AS DisputesChargebacksAmount,
               COUNT(id) AS DisputesChargebacksTransaction,
               COALESCE(SUM(charges), 0) AS DisputesChargebacksCharges
        FROM tbl_chargeback_disputes
        WHERE customer_name LIKE ?
      `;

      let query = sqlDefault;
      let queryParams: any[] = [];

      if (from && to) {
        query = sqlFromTo;
        queryParams = [from, to];
      } else if (date) {
        query = sqlDate;
        queryParams = [date];
      } else if (searchItem) {
        query = sqlSearch;
        queryParams = [`%${searchItem}%`];
      }

      const result: any[] = await mysqlcon(query, queryParams);

      const data = result[0] || {
        DisputesChargebacksAmount: 0,
        DisputesChargebacksTransaction: 0,
        DisputesChargebacksCharges: 0
      };

      const disputesChargebackAmount = parseFloat(data.DisputesChargebacksAmount || 0).toFixed(2);
      const disputesChargebackTransaction = parseInt(data.DisputesChargebacksTransaction || 0);
      const disputesChargebackCharges = parseFloat(data.DisputesChargebacksCharges || 0).toFixed(2);

      const responseData = [
        {
          name: "Total Transaction",
          amount: disputesChargebackTransaction
        },
        {
          name: "Total Amount",
          amount: disputesChargebackAmount
        },
        {
          name: "Charges & Fees",
          amount: disputesChargebackCharges
        }
      ];

        res.status(200).json({ data: responseData });
    } catch (error) {
      console.error(error);
        res.status(500).json({
        message: "Something went wrong",
        error
      });
    }
  }

  public async downloadDisputeChargeback(req: Request<DisputeChargeback>, res: Response): Promise<void> {
    try {
      const { from, to, date, searchItem } = req.body;
  
      const DefaultSql = `SELECT tbl_chargeback_disputes.user_id, tbl_chargeback_disputes.transaction_id, tbl_chargeback_disputes.mer_name,
      DATE_FORMAT(tbl_chargeback_disputes.recieved_date,'%Y-%m-%d %H:%i:%s') AS recieved_date, tbl_chargeback_disputes.currency, 
      tbl_chargeback_disputes.amount, tbl_chargeback_disputes.charges, payment_gateway.gateway_name AS bank_name, 
      tbl_chargeback_disputes.customer_name, tbl_chargeback_disputes.reason, tbl_chargeback_disputes.status, 
      tbl_chargeback_disputes.mode, tbl_chargeback_disputes.auth, tbl_chargeback_disputes.net_amount, 
      DATE_FORMAT(tbl_chargeback_disputes.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, 
      DATE_FORMAT(tbl_chargeback_disputes.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
      FROM tbl_chargeback_disputes 
      LEFT JOIN payment_gateway ON payment_gateway.id = tbl_chargeback_disputes.bank_name 
      UNION ALL 
      SELECT tbl_merchant_transaction.user_id, tbl_merchant_transaction.transaction_id, tbl_user.name AS mer_name,
      tbl_merchant_transaction.created_on AS recieved_date, tbl_merchant_transaction.ammount_type AS currency,
      tbl_merchant_transaction.ammount AS amount, tbl_merchant_transaction.payin_charges AS charges,
      payment_gateway.gateway_name AS bank_name, tbl_merchant_transaction.i_flname AS customer_name,
      tbl_merchant_transaction.discription AS reason, tbl_merchant_transaction.status,
      tbl_merchant_transaction.payment_type AS mode, tbl_user.email AS auth,
      (tbl_merchant_transaction.ammount - tbl_merchant_transaction.payin_charges) AS net_amount,
      DATE_FORMAT(tbl_merchant_transaction.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,
      DATE_FORMAT(tbl_merchant_transaction.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
      FROM tbl_merchant_transaction 
      LEFT JOIN payment_gateway ON payment_gateway.id = tbl_merchant_transaction.gatewayNumber 
      LEFT JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id 
      WHERE tbl_merchant_transaction.status = 5`;
  
      const FromToSql = `SELECT tbl_chargeback_disputes.user_id, tbl_chargeback_disputes.transaction_id, tbl_chargeback_disputes.mer_name,
      DATE_FORMAT(tbl_chargeback_disputes.recieved_date,'%Y-%m-%d %H:%i:%s') AS recieved_date, tbl_chargeback_disputes.currency, 
      tbl_chargeback_disputes.amount, tbl_chargeback_disputes.charges, payment_gateway.gateway_name AS bank_name, 
      tbl_chargeback_disputes.customer_name, tbl_chargeback_disputes.reason, tbl_chargeback_disputes.status, 
      tbl_chargeback_disputes.mode, tbl_chargeback_disputes.auth, tbl_chargeback_disputes.net_amount, 
      DATE_FORMAT(tbl_chargeback_disputes.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, 
      DATE_FORMAT(tbl_chargeback_disputes.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
      FROM tbl_chargeback_disputes 
      LEFT JOIN payment_gateway ON payment_gateway.id = tbl_chargeback_disputes.bank_name 
      WHERE DATE(created_on) >= ? AND DATE(created_on) <= ? 
      UNION ALL 
      SELECT tbl_merchant_transaction.user_id, tbl_merchant_transaction.transaction_id, tbl_user.name AS mer_name,
      tbl_merchant_transaction.created_on AS recieved_date, tbl_merchant_transaction.ammount_type AS currency,
      tbl_merchant_transaction.ammount AS amount, tbl_merchant_transaction.payin_charges AS charges,
      payment_gateway.gateway_name AS bank_name, tbl_merchant_transaction.i_flname AS customer_name,
      tbl_merchant_transaction.discription AS reason, tbl_merchant_transaction.status,
      tbl_merchant_transaction.payment_type AS mode, tbl_user.email AS auth,
      (tbl_merchant_transaction.ammount - tbl_merchant_transaction.payin_charges) AS net_amount,
      DATE_FORMAT(tbl_merchant_transaction.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,
      DATE_FORMAT(tbl_merchant_transaction.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
      FROM tbl_merchant_transaction 
      LEFT JOIN payment_gateway ON payment_gateway.id = tbl_merchant_transaction.gatewayNumber 
      LEFT JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id 
      WHERE tbl_merchant_transaction.status = 5 
      AND DATE(tbl_merchant_transaction.created_on) >= ? 
      AND DATE(tbl_merchant_transaction.created_on) <= ?`;
  
      const DateSql = `SELECT tbl_chargeback_disputes.user_id, tbl_chargeback_disputes.transaction_id, tbl_chargeback_disputes.mer_name,
      DATE_FORMAT(tbl_chargeback_disputes.recieved_date,'%Y-%m-%d %H:%i:%s') AS recieved_date, tbl_chargeback_disputes.currency, 
      tbl_chargeback_disputes.amount, tbl_chargeback_disputes.charges, payment_gateway.gateway_name AS bank_name, 
      tbl_chargeback_disputes.customer_name, tbl_chargeback_disputes.reason, tbl_chargeback_disputes.status, 
      tbl_chargeback_disputes.mode, tbl_chargeback_disputes.auth, tbl_chargeback_disputes.net_amount, 
      DATE_FORMAT(tbl_chargeback_disputes.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, 
      DATE_FORMAT(tbl_chargeback_disputes.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
      FROM tbl_chargeback_disputes 
      LEFT JOIN payment_gateway ON payment_gateway.id = tbl_chargeback_disputes.bank_name 
      UNION ALL 
      SELECT tbl_merchant_transaction.user_id, tbl_merchant_transaction.transaction_id, tbl_user.name AS mer_name,
      tbl_merchant_transaction.created_on AS recieved_date, tbl_merchant_transaction.ammount_type AS currency,
      tbl_merchant_transaction.ammount AS amount, tbl_merchant_transaction.payin_charges AS charges,
      payment_gateway.gateway_name AS bank_name, tbl_merchant_transaction.i_flname AS customer_name,
      tbl_merchant_transaction.discription AS reason, tbl_merchant_transaction.status,
      tbl_merchant_transaction.payment_type AS mode, tbl_user.email AS auth,
      (tbl_merchant_transaction.ammount - tbl_merchant_transaction.payin_charges) AS net_amount,
      DATE_FORMAT(tbl_merchant_transaction.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,
      DATE_FORMAT(tbl_merchant_transaction.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
      FROM tbl_merchant_transaction 
      LEFT JOIN payment_gateway ON payment_gateway.id = tbl_merchant_transaction.gatewayNumber 
      LEFT JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id 
      WHERE tbl_merchant_transaction.status = 5 
      AND DATE(tbl_merchant_transaction.created_on) = ?`;
  
      const SearchSql = `SELECT tbl_chargeback_disputes.user_id, tbl_chargeback_disputes.transaction_id, tbl_chargeback_disputes.mer_name,
      DATE_FORMAT(tbl_chargeback_disputes.recieved_date,'%Y-%m-%d %H:%i:%s') AS recieved_date, tbl_chargeback_disputes.currency, 
      tbl_chargeback_disputes.amount, tbl_chargeback_disputes.charges, payment_gateway.gateway_name AS bank_name, 
      tbl_chargeback_disputes.customer_name, tbl_chargeback_disputes.reason, tbl_chargeback_disputes.status, 
      tbl_chargeback_disputes.mode, tbl_chargeback_disputes.auth, tbl_chargeback_disputes.net_amount, 
      DATE_FORMAT(tbl_chargeback_disputes.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, 
      DATE_FORMAT(tbl_chargeback_disputes.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
      FROM tbl_chargeback_disputes 
      LEFT JOIN payment_gateway ON payment_gateway.id = tbl_chargeback_disputes.bank_name 
      WHERE customer_name LIKE ? 
      UNION ALL 
      SELECT tbl_merchant_transaction.user_id, tbl_merchant_transaction.transaction_id, tbl_user.name AS mer_name,
      tbl_merchant_transaction.created_on AS recieved_date, tbl_merchant_transaction.ammount_type AS currency,
      tbl_merchant_transaction.ammount AS amount, tbl_merchant_transaction.payin_charges AS charges,
      payment_gateway.gateway_name AS bank_name, tbl_merchant_transaction.i_flname AS customer_name,
      tbl_merchant_transaction.discription AS reason, tbl_merchant_transaction.status,
      tbl_merchant_transaction.payment_type AS mode, tbl_user.email AS auth,
      (tbl_merchant_transaction.ammount - tbl_merchant_transaction.payin_charges) AS net_amount,
      DATE_FORMAT(tbl_merchant_transaction.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,
      DATE_FORMAT(tbl_merchant_transaction.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
      FROM tbl_merchant_transaction 
      LEFT JOIN payment_gateway ON payment_gateway.id = tbl_merchant_transaction.gatewayNumber 
      LEFT JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id 
      WHERE tbl_merchant_transaction.status = 5 
      AND tbl_merchant_transaction.i_flname LIKE ?`;
  
      const [query, params]: [string, any[]] = 
        (from && to) ? [FromToSql, [from, to, from, to]] :
        (date) ? [DateSql, [date, date]] :
        (searchItem) ? [SearchSql, [`%${searchItem}%`]] :
        [DefaultSql, []];
  
      const result = await mysqlcon(query, params);
  
      if (result.length > 0) {
        res.send(result);
      } else {
        res.send("NO DATA");
      }
  
    } catch (error: any) {
      console.error("Error in downloadDisputeChargeback:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async getDisputeDetails(req: Request<CustomerDetails>, res: Response): Promise<void> {
    try {
      const { orderId }: { orderId: string } = req.body;
  
      const sqlCustomerDetails = `
        SELECT 
          ammount AS Amount, 
          payin_charges AS Charges, 
          i_flname AS CustomerName 
        FROM tbl_merchant_transaction 
        WHERE order_no = ?
      `;
  
      const resultCustomerDetails = await mysqlcon(sqlCustomerDetails, [orderId]);
  
      if (resultCustomerDetails.length > 0) {
        res.send(resultCustomerDetails[0]);
      } else {
        res.status(404).json({ message: "No data found" });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Something went wrong",
        error: error.message || error,
      });
    }
  }
}

export default new DisputesChargeBack();
import { Request, Response } from "express";
import mysqlcon from "../../config/db_connection";
import Pagination from "../../services/pagination";

let today = new Date(); 
let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
let dateTime = date+' '+time; 

//default
interface RefundRequest{
  body: {
    from?: string;
    to?: string;
    date?: string;
    searchItem?: string;
    pageNumber?: number;
    limit?: number;
  };
}
//newRefund
interface NewRefundRequest {
  id?: number;
  merchantId: number;
  merchantName?: string;
  recieved_date: string;
  refundCurrency: string;
  bank: number;
  transactionType: string;
  RefundId: string;
  cusName: string;
  refundAmount: number;
  refundCharges: number;
  reason: string;
  orderid: string;
}
//newRefund
interface AuthenticatedRequest extends Request {
  body: NewRefundRequest;
  user?: any; 
}
//updateRefund
interface UpdateRefundRequest {
  ID: string;
  currency: string;
  bank: string;
  type: string;
  reason: string;
  caseNumber: string;
}
//getRefundData
interface GetRefundDataRequest {
  trx_id: string;
}
//refundCardData
interface RefundCardDataRequest {
  date?: string;
  from?: string;
  to?: string;
}
//settlementRefundDownload
interface SettlementRefund {
  user_id: number;
  trx_id: string;
  mer_name: string;
  received_date: string;
  currency: string;
  amount: number;
  charges: number;
  bank_name: string;
  customer_name: string;
  reason: string;
  trx_type: string;
  auth: string;
  net_amount: number;
  created_on: string;
  updated_on: string;
}
//getRefundDetails 
interface RefundDetails {
  Amount: number;
  Charges: number;
  CustomerName: string;
}

class Refunds{
  public async default(req: Request<RefundRequest>, res: Response): Promise<void> {
        try {
          const { from, to, date, searchItem } = req.body;
      
          const pagination = (total: number, page: number, limit: number) => {
            const numOfPages = Math.ceil(total / limit);
            const start = page * limit - limit;
            return { limit, start, numOfPages, searchItem };
          };
      
          const CountFromToSql = `
            SELECT COUNT(*) AS Total 
            FROM tbl_refund_in_settlement 
            WHERE DATE(created_on) >= ? 
              AND DATE(created_on) <= ?
          `;
      
          const CountDateSql = `
            SELECT COUNT(*) AS Total 
            FROM tbl_refund_in_settlement 
            WHERE DATE(created_on) = ?
          `;
      
          const CountDefaultSql = `
            SELECT COUNT(*) AS Total 
            FROM tbl_refund_in_settlement
          `;
      
          const CountSearchSql = `
            SELECT COUNT(*) AS Total 
            FROM tbl_refund_in_settlement 
            WHERE customer_name LIKE ?
          `;
      
          const countQuery = from && to
            ? CountFromToSql
            : date
            ? CountDateSql
            : searchItem
            ? CountSearchSql
            : CountDefaultSql;
      
          const countParams =
            from && to
              ? [from, to]
              : date
              ? [date]
              : searchItem
              ? [`%${searchItem}%`]
              : [];
      
          const CountResult = await mysqlcon(countQuery, countParams);
          const total: number = CountResult[0].Total;
      
          const Page = req.body.pageNumber ? Number(req.body.pageNumber) : 1;
          const limit = req.body.limit ? Number(req.body.limit) : 10;
      
          const page = pagination(total, Page, limit);
      
          const commonSelect = `
            SELECT 
              tbl_refund_in_settlement.*, 
              DATE_FORMAT(tbl_refund_in_settlement.recieved_date,'%Y-%m-%d %H:%i:%s') AS received_date,
              payment_gateway.gateway_name AS bank_name, 
              DATE_FORMAT(tbl_refund_in_settlement.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, 
              DATE_FORMAT(tbl_refund_in_settlement.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
            FROM tbl_refund_in_settlement 
            LEFT JOIN payment_gateway ON payment_gateway.id = tbl_refund_in_settlement.bank_name
          `;
      
          const DefaultSql = `${commonSelect} ORDER BY created_on DESC LIMIT ?,?`;
      
          const FromToSql = `${commonSelect} WHERE DATE(tbl_refund_in_settlement.created_on) >= ? AND DATE(tbl_refund_in_settlement.created_on) <= ? ORDER BY created_on DESC LIMIT ?,?`;
      
          const DateSql = `${commonSelect} WHERE DATE(tbl_refund_in_settlement.created_on) = ? LIMIT ?,?`;
      
          const SearchSql = `${commonSelect} WHERE customer_name LIKE ? LIMIT ?,?`;
      
          const dataQuery = from && to
            ? FromToSql
            : date
            ? DateSql
            : searchItem
            ? SearchSql
            : DefaultSql;
      
          const dataParams =
            from && to
              ? [from, to, page.start, page.limit]
              : date
              ? [date, page.start, page.limit]
              : searchItem
              ? [`%${searchItem}%`, page.start, page.limit]
              : [page.start, page.limit];
      
          const data = await mysqlcon(dataQuery, dataParams);
      
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
//error coming- Merchant not found
  // public async newRefund(req: Request, res: Response): Promise<void> {
  //   try {
  //     const {
  //       id,
  //       merchantId,
  //       merchantName,
  //       recieved_date,
  //       refundCurrency,
  //       bank,
  //       transactionType,
  //       RefundId,
  //       cusName,
  //       refundAmount,
  //       refundCharges,
  //       reason,
  //       orderid,
  //     } = req.body;
  
  //     let merName = merchantName;
  //     if (!merName) {
  //       const sqlName = 'SELECT name FROM tbl_user WHERE id = ?';
  //       const resultName = await mysqlcon(sqlName, [merchantId]);
  //       if (resultName.length === 0) {
  //         res.status(404).json({ message: 'Merchant not found' });
  //         return;
  //       }
  //       merName = resultName[0].name;
  //     }
  
  //     const netAmount =
  //       refundAmount && refundCharges
  //         ? refundAmount - refundCharges
  //         : refundAmount;
  
  //     const formData = {
  //       user_id: merchantId,
  //       mer_name: merName,
  //       recieved_date,
  //       currency: refundCurrency,
  //       bank_name: bank,
  //       trx_type: transactionType,
  //       trx_id: RefundId,
  //       customer_name: cusName,
  //       amount: refundAmount,
  //       charges: refundCharges,
  //       reason,
  //       net_amount: netAmount,
  //       auth: req.user?.email || 'system', 
  //       created_on: dateTime,
  //       updated_on: dateTime,
  //     };
  
  //     let result;
  //     if (id) {
  //       const updateSql = 'UPDATE tbl_refund_in_settlement SET ? WHERE id = ?';
  //       result = await mysqlcon(updateSql, [formData, id]);
  //     } else {
  //       const insertSql = 'INSERT INTO tbl_refund_in_settlement SET ?';
  //       result = await mysqlcon(insertSql, [formData]);
  //     }
  
  //     if (result.affectedRows) {
  //       const msql = 'UPDATE tbl_merchant_transaction SET status = 4 WHERE order_no = ?';
  //       const mres = await mysqlcon(msql, [orderid]);
  
  //       res.status(200).json({ message: 'Successfully processed refund', mres });
  //     } else {
  //       res.status(403).json({ message: 'Error while processing refund' });
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({
  //       message: 'Something went wrong in Bank Deposit',
  //       error,
  //     });
  //   }
  // }

  public async updateRefund(req: Request<UpdateRefundRequest>, res: Response): Promise<void> {
    try {
      const { ID } = req.body;
  
      const formData = {
        currency: req.body.currency,
        bank_name: req.body.bank,
        trx_type: req.body.type,
        reason: req.body.reason,
        case_no: req.body.caseNumber,
        updated_on: dateTime
      }
  
      const sql = "Update tbl_refund_in_settlement SET ? WHERE trx_id = ?";
      const result = await mysqlcon(sql, [formData, ID]);
  
      if (result.affectedRows) {
        res.status(200).json({ message: "Successfully Data Updated" });
      } else {
        res.status(403).json({ message: "Error While Updating" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Something Went Wrong",
        error
      });
    }
  }

  public async getRefundData(req: Request<GetRefundDataRequest>, res: Response): Promise<void> {
    try {
      const { trx_id } = req.body;
  
      const sql = `
        SELECT 
          tbl_refund_in_settlement.*, 
          DATE_FORMAT(tbl_refund_in_settlement.recieved_date, '%Y-%m-%d %H:%i:%s') AS recieved_date 
        FROM 
          tbl_refund_in_settlement 
        WHERE 
          trx_id = ?
      `;
  
      const result = await mysqlcon(sql, [trx_id]);
  
      res.status(200).json({
        result: result[0] || null
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  }

  public async refundCardData(req: Request<RefundCardDataRequest>, res: Response): Promise<void> {
    try {
      const { date, from, to } = req.body;
  
      const sqlDefault = `
        SELECT COUNT(tbl_refund_in_settlement.id) AS TotalRefundTransation, 
               SUM(amount) AS TotalRefundAmount, 
               SUM(charges) AS ChargesFees 
        FROM tbl_refund_in_settlement 
        LEFT JOIN payment_gateway ON tbl_refund_in_settlement.bank_name = payment_gateway.id
      `;
  
      const sqlDate = `
        SELECT COUNT(tbl_refund_in_settlement.id) AS TotalRefundTransation, 
               SUM(amount) AS TotalRefundAmount, 
               SUM(charges) AS ChargesFees 
        FROM tbl_refund_in_settlement 
        LEFT JOIN payment_gateway ON tbl_refund_in_settlement.bank_name = payment_gateway.id 
        WHERE DATE(tbl_refund_in_settlement.created_on) = ?
      `;
  
      const sqlFromTo = `
        SELECT COUNT(tbl_refund_in_settlement.id) AS TotalRefundTransation, 
               SUM(amount) AS TotalRefundAmount, 
               SUM(charges) AS ChargesFees 
        FROM tbl_refund_in_settlement 
        LEFT JOIN payment_gateway ON tbl_refund_in_settlement.bank_name = payment_gateway.id 
        WHERE DATE(tbl_refund_in_settlement.created_on) >= ? 
          AND DATE(tbl_refund_in_settlement.created_on) <= ?
      `;
  
      const query = from && to ? sqlFromTo : date ? sqlDate : sqlDefault;
      const params = from && to ? [from, to] : date ? [date] : [];
  
      const result = await mysqlcon(query, params);
  
      const data = result[0] || {};
  
      const RefundTransaction = data.TotalRefundTransation ?? 0;
      const RefundAmount = data.TotalRefundAmount ? parseFloat(data.TotalRefundAmount).toFixed(2) : "0.00";
      const RefundCharges = data.ChargesFees ? parseFloat(data.ChargesFees).toFixed(2) : "0.00";
  
      const responseData = [
        {
          name: "Total Refund Transaction",
          amount: RefundTransaction,
        },
        {
          name: "Total Refund Amount",
          amount: RefundAmount,
        },
        {
          name: "Charges & Fees",
          amount: RefundCharges,
        },
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
  
  public async settlementRefundDownload(req: Request<SettlementRefund>, res: Response): Promise<void> {
    try {
      const { from, to, date, searchItem } = req.body;
  
      let DefaultSql = `Select tbl_refund_in_settlement.user_id,tbl_refund_in_settlement.trx_id,tbl_refund_in_settlement.mer_name,DATE_FORMAT(tbl_refund_in_settlement.recieved_date,'%Y-%m-%d %H:%i:%s')AS received_date,tbl_refund_in_settlement.currency,tbl_refund_in_settlement.amount,tbl_refund_in_settlement.charges, payment_gateway.gateway_name AS bank_name,tbl_refund_in_settlement.customer_name,tbl_refund_in_settlement.reason,tbl_refund_in_settlement.trx_type,tbl_refund_in_settlement.auth,tbl_refund_in_settlement.net_amount,DATE_FORMAT(tbl_refund_in_settlement.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,DATE_FORMAT(tbl_refund_in_settlement.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on From tbl_refund_in_settlement LEFT JOIN payment_gateway ON payment_gateway.id = tbl_refund_in_settlement.bank_name UNION ALL Select tbl_merchant_transaction.user_id,tbl_merchant_transaction.transaction_id AS trx_id,tbl_user.name AS mer_name,tbl_merchant_transaction.created_on AS received_date,tbl_merchant_transaction.ammount_type AS currency,tbl_merchant_transaction.ammount AS amount,tbl_merchant_transaction.payin_charges AS chatges,payment_gateway.gateway_name AS bank_name,tbl_merchant_transaction.i_flname AS customer_name,tbl_merchant_transaction.discription AS reason,tbl_merchant_transaction.payment_type AS trx_type,tbl_user.email AS auth,(tbl_merchant_transaction.ammount-tbl_merchant_transaction.payin_charges) AS net_amount,DATE_FORMAT(tbl_merchant_transaction.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,DATE_FORMAT(tbl_merchant_transaction.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_merchant_transaction LEFT JOIN payment_gateway ON payment_gateway.id=tbl_merchant_transaction.gatewayNumber LEFT JOIN tbl_user ON tbl_user.id=tbl_merchant_transaction.user_id Where tbl_merchant_transaction.status=4`;
  
      let FromToSql = `Select tbl_refund_in_settlement.user_id,tbl_refund_in_settlement.trx_id,tbl_refund_in_settlement.mer_name,DATE_FORMAT(tbl_refund_in_settlement.recieved_date,'%Y-%m-%d %H:%i:%s')AS received_date,tbl_refund_in_settlement.currency,tbl_refund_in_settlement.amount,tbl_refund_in_settlement.charges, payment_gateway.gateway_name AS bank_name,tbl_refund_in_settlement.customer_name,tbl_refund_in_settlement.reason,tbl_refund_in_settlement.trx_type,tbl_refund_in_settlement.auth,tbl_refund_in_settlement.net_amount,DATE_FORMAT(tbl_refund_in_settlement.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,DATE_FORMAT(tbl_refund_in_settlement.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on From tbl_refund_in_settlement LEFT JOIN payment_gateway ON payment_gateway.id = tbl_refund_in_settlement.bank_name WHERE Date(created_on) >= ? AND DATE(created_on) <= ? UNION ALL Select tbl_merchant_transaction.user_id,tbl_merchant_transaction.transaction_id AS trx_id,tbl_user.name AS mer_name,tbl_merchant_transaction.created_on AS received_date,tbl_merchant_transaction.ammount_type AS currency,tbl_merchant_transaction.ammount AS amount,tbl_merchant_transaction.payin_charges AS charges,payment_gateway.gateway_name AS bank_name,tbl_merchant_transaction.i_flname AS customer_name,tbl_merchant_transaction.discription AS reason,tbl_merchant_transaction.payment_type AS trx_type,tbl_user.email AS auth,(tbl_merchant_transaction.ammount-tbl_merchant_transaction.payin_charges) AS net_amount,DATE_FORMAT(tbl_merchant_transaction.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,DATE_FORMAT(tbl_merchant_transaction.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_merchant_transaction LEFT JOIN payment_gateway ON payment_gateway.id=tbl_merchant_transaction.gatewayNumber LEFT JOIN tbl_user ON tbl_user.id=tbl_merchant_transaction.user_id Where tbl_merchant_transaction.status=4 AND Date(tbl_merchant_transaction.created_on)>= ? AND Date(tbl_merchant_transaction.created_on)<= ?`;
  
      let DateSql = `Select tbl_refund_in_settlement.user_id,tbl_refund_in_settlement.trx_id,tbl_refund_in_settlement.mer_name,DATE_FORMAT(tbl_refund_in_settlement.recieved_date,'%Y-%m-%d %H:%i:%s')AS received_date,tbl_refund_in_settlement.currency,tbl_refund_in_settlement.amount,tbl_refund_in_settlement.charges, payment_gateway.gateway_name AS bank_name, tbl_refund_in_settlement.customer_name,tbl_refund_in_settlement.reason,tbl_refund_in_settlement.trx_type,tbl_refund_in_settlement.auth,tbl_refund_in_settlement.net_amount,DATE_FORMAT(tbl_refund_in_settlement.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,DATE_FORMAT(tbl_refund_in_settlement.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on From tbl_refund_in_settlement LEFT JOIN payment_gateway ON payment_gateway.id = tbl_refund_in_settlement.bank_name WHERE created_on=? UNION ALL Select tbl_merchant_transaction.user_id,tbl_merchant_transaction.transaction_id AS trx_id,tbl_user.name AS mer_name,tbl_merchant_transaction.created_on AS received_date,tbl_merchant_transaction.ammount_type AS currency,tbl_merchant_transaction.ammount AS amount,tbl_merchant_transaction.payin_charges AS chatges,payment_gateway.gateway_name AS bank_name,tbl_merchant_transaction.i_flname AS customer_name,tbl_merchant_transaction.discription AS reason,tbl_merchant_transaction.payment_type AS trx_type,tbl_user.email AS auth,(tbl_merchant_transaction.ammount-tbl_merchant_transaction.payin_charges) AS net_amount,DATE_FORMAT(tbl_merchant_transaction.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,DATE_FORMAT(tbl_merchant_transaction.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_merchant_transaction LEFT JOIN payment_gateway ON payment_gateway.id=tbl_merchant_transaction.gatewayNumber LEFT JOIN tbl_user ON tbl_user.id=tbl_merchant_transaction.user_id Where tbl_merchant_transaction.status=4 AND Date(tbl_merchant_transaction.created_on) = ?`;
  
      let SearchSql = `Select tbl_refund_in_settlement.user_id,tbl_refund_in_settlement.trx_id,tbl_refund_in_settlement.mer_name,DATE_FORMAT(tbl_refund_in_settlement.recieved_date,'%Y-%m-%d %H:%i:%s')AS received_date,tbl_refund_in_settlement.currency,tbl_refund_in_settlement.amount,tbl_refund_in_settlement.charges, payment_gateway.gateway_name AS bank_name,tbl_refund_in_settlement.customer_name,tbl_refund_in_settlement.reason,tbl_refund_in_settlement.trx_type,tbl_refund_in_settlement.auth,tbl_refund_in_settlement.net_amount,DATE_FORMAT(tbl_refund_in_settlement.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,DATE_FORMAT(tbl_refund_in_settlement.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on From tbl_refund_in_settlement LEFT JOIN payment_gateway ON payment_gateway.id = tbl_refund_in_settlement.bank_name WHERE customer_name LIKE '%${searchItem}%'  UNION ALL Select tbl_merchant_transaction.user_id,tbl_merchant_transaction.transaction_id AS trx_id,tbl_user.name AS mer_name,tbl_merchant_transaction.created_on AS received_date,tbl_merchant_transaction.ammount_type AS currency,tbl_merchant_transaction.ammount AS amount,tbl_merchant_transaction.payin_charges AS chatges,payment_gateway.gateway_name AS bank_name,tbl_merchant_transaction.i_flname AS customer_name,tbl_merchant_transaction.discription AS reason,tbl_merchant_transaction.payment_type AS trx_type,tbl_user.email AS auth,(tbl_merchant_transaction.ammount-tbl_merchant_transaction.payin_charges) AS net_amount,DATE_FORMAT(tbl_merchant_transaction.created_on,'%Y-%m-%d %H:%i:%s') AS created_on,DATE_FORMAT(tbl_merchant_transaction.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_merchant_transaction LEFT JOIN payment_gateway ON payment_gateway.id=tbl_merchant_transaction.gatewayNumber LEFT JOIN tbl_user ON tbl_user.id=tbl_merchant_transaction.user_id Where tbl_merchant_transaction.status=4 AND tbl_merchant_transaction.i_flname LIKE '%${searchItem}%'`;
  
      const query = from && to
        ? FromToSql
        : date
        ? DateSql
        : searchItem
        ? SearchSql
        : DefaultSql;
  
      const params = from && to
        ? [from, to, from, to]
        : date
        ? [date, date]
        : searchItem
        ? [searchItem]
        : [];
  
      const data = await mysqlcon(query, params);
  
      res.send(data);
    } catch (error) {
      console.error(error);
      res.status(500).json(error);
    }
  }

  public async getRefundDetails(req: Request<RefundDetails>, res: Response): Promise<void> {
    try {
      const { orderId } = req.body;
  
      const sqlCustomerDetails = `
        SELECT 
          ammount AS Amount, 
          payin_charges AS Charges, 
          i_flname AS CustomerName 
        FROM tbl_merchant_transaction 
        WHERE order_no = ?
      `;
  
      const resultCustomerDetails = await mysqlcon(sqlCustomerDetails, [orderId]);
  
      res.send(resultCustomerDetails[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Something went wrong",
        error
      });
    }
  }
}

export default new Refunds();
import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';

interface sanddepositRequest{
    searchText?: string;
    merchantName?: string
    status?:string
    to?: any
    from?: any
    message?: string
    data? :any
    error? : any
    currentPage? : any
    totalPages?: any
    pageLimit?:any
}

interface DepositsReq{
    searchText?: string;
    merchantName?: string
    status?:string
    to?: any
    from?: any
    message?: string
    error? : any
    data?: any
}

interface statusRequest{
    status?: string, 
    invoice_id? : string
    message?: string
    error? : any
    data?: any
}

class sandboxDeposite {

    async defaultSandboxDeposits(req:Request,res:Response<sanddepositRequest>):Promise<void>{
          let pagination = (total: number, page: number, limit: number) => {
            let numOfPages = Math.ceil(total / limit);
            let start = page * limit - limit;
            return { limit, start, numOfPages };
          }; 
          try {
            let { to, from, status, merchantName, searchText } = req.body;
            
            let sql = "select count(*) as Total from tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id";
        
            let sqlToFromCount ="select count(*) as Total from tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id where DATE(tbl_merchant_transaction_sandbox.created_on) >= ? AND DATE(tbl_merchant_transaction_sandbox.created_on) <= ? ";
        
            let sqlSearchCount = "select count(*) as Total from tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE tbl_merchant_transaction_sandbox.order_no LIKE '%" +
            searchText +
            "%' OR  tbl_merchant_transaction_sandbox.txn_id  LIKE '%" +
            searchText +
            "%'"
        
            let sqlStatus = "SELECT COUNT(*) AS Total FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE tbl_merchant_transaction_sandbox.status = ?"
        
            let sqlMerchantCount = "SELECT COUNT(*) AS Total FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE tbl_merchant_transaction_sandbox.user_id = ?"
        
            let result = await mysqlcon(
              to && from
              ? sqlToFromCount
              : searchText
              ? sqlSearchCount
              : status
              ? sqlStatus
              : merchantName
              ? sqlMerchantCount
              : sql,
              to && from ? [from, to]
              : searchText
              ? [searchText]
              : status ? [status]
              : merchantName
              ? [merchantName]
              :[""]
              );
        
            let total = result[0].Total;
            let page = req.body.page ? Number(req.body.page) : 1;
            let limit = req.body.limit ? Number(req.body.limit) : 10;
            let { start, numOfPages } = pagination(total, page, limit);
        
            let sql1 = "SELECT tbl_user.name, tbl_merchant_transaction_sandbox.*, DATE_FORMAT(tbl_merchant_transaction_sandbox.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_merchant_transaction_sandbox.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id ORDER BY tbl_merchant_transaction_sandbox.created_on DESC LIMIT ?,?";
        
            let sqlToFrom ="SELECT tbl_user.name, tbl_merchant_transaction_sandbox.*, DATE_FORMAT(tbl_merchant_transaction_sandbox.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_merchant_transaction_sandbox.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE DATE(tbl_merchant_transaction_sandbox.created_on)  >= ? AND DATE(tbl_merchant_transaction_sandbox.created_on) <= ? ORDER BY tbl_merchant_transaction_sandbox.created_on DESC limit ?,?";
        
            let sqlSearch = "SELECT tbl_user.name, tbl_merchant_transaction_sandbox.*, DATE_FORMAT(tbl_merchant_transaction_sandbox.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_merchant_transaction_sandbox.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE tbl_merchant_transaction_sandbox.order_no LIKE '%" +
            searchText +
            "%' OR  tbl_merchant_transaction_sandbox.txn_id  LIKE '%" +
            searchText +
            "%'"
        
            let sqlStatus2 = "SELECT tbl_user.name, tbl_merchant_transaction_sandbox.*, DATE_FORMAT(tbl_merchant_transaction_sandbox.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_merchant_transaction_sandbox.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE tbl_merchant_transaction_sandbox.status = ? LIMIT ?,?";
        
            let sqlMerchant = "SELECT tbl_user.name, tbl_merchant_transaction_sandbox.*, DATE_FORMAT(tbl_merchant_transaction_sandbox.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_merchant_transaction_sandbox.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE tbl_merchant_transaction_sandbox.user_id = ? LIMIT ?,?"
        
            let result1 = await mysqlcon( to && from ? sqlToFrom : searchText ? sqlSearch : status ? sqlStatus2 : merchantName ? sqlMerchant : sql1, 
              to && from
              ? [from, to, start, limit]
              : searchText
              ? [searchText]
              : status
              ? [status, start, limit]
              : merchantName
              ? [merchantName, start,limit]
              : [start,limit]);
        
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
            console.log(error);
             res.status(500).json({
              message: "error occurered",
              error: error,
            });
          }
    }

    async downloadSandboxDeposits(req:Request,res:Response<DepositsReq>):Promise<void>{
          try{
            const { to, from, status, merchantName, searchText } = req.body
        
            let sql1 = "SELECT tbl_user.name, tbl_merchant_transaction_sandbox.* FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id";
        
            let sqlToFrom ="SELECT tbl_user.name, tbl_merchant_transaction_sandbox.* FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE DATE(tbl_merchant_transaction_sandbox.created_on)  >= ? AND DATE(tbl_merchant_transaction_sandbox.created_on) <= ?";
        
            let sqlSearch = "SELECT tbl_user.name, tbl_merchant_transaction_sandbox.* FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE tbl_merchant_transaction_sandbox.order_no LIKE '%" +
            searchText +
            "%' OR  tbl_merchant_transaction_sandbox.txn_id  LIKE '%" +
            searchText +
            "%'"
        
            let sqlStatus2 = "SELECT tbl_user.name, tbl_merchant_transaction_sandbox.* FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE tbl_merchant_transaction_sandbox.status = ?";
        
            let sqlMerchant = "SELECT tbl_user.name, tbl_merchant_transaction_sandbox.* FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE tbl_merchant_transaction_sandbox.user_id = ?"
        
            let result = await mysqlcon( to && from ? sqlToFrom : searchText ? sqlSearch : status ? sqlStatus2 : merchantName ? sqlMerchant : sql1, 
              to && from
              ? [from, to]
              : searchText
              ? [searchText]
              : status
              ? [status]
              : merchantName
              ? [merchantName]
              : []
            );
            
              res.send(result)
           }catch(err){
            console.log(err);
             res.status(500).json({
              message : "error occured"
            })
           }  
    }

    async depositsSandboxCards(req:Request,res:Response<DepositsReq>):Promise<void>{
          try {
            let {to, from, status, merchantName, searchText} = req.body;
        
            let sql = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction_sandbox"
        
            let sqlSearch ="SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction_sandbox WHERE order_no LIKE '%" +
            searchText +
            "%' OR txn_id LIKE '%" +
            searchText +
            "%'";
        
            let cbRefundSql = "SELECT SUM(ammount) AS amount from tbl_merchant_transaction_sandbox WHERE status IN(4,5)"
        
            let sqlToFrom = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction_sandbox where DATE(created_on)  >= ? AND DATE(created_on) <= ?";
        
            let sqlMerchant = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction_sandbox WHERE user_id = ?"
        
            let sqlStatus = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction_sandbox WHERE status = ?"
        
            let sqlMerchantStatus = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction_sandbox WHERE user_id = ? AND status = ?"
        
            let sqlToFromMerchant = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction_sandbox WHERE user_id = ? AND DATE(created_on)  >= ? AND DATE(created_on) <= ?"
        
            let sqlToFromMerchantStatus = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction_sandbox WHERE user_id = ? AND status = ? AND DATE(created_on)  >= ? AND DATE(created_on) <= ?"
        
            let result = await mysqlcon(
              merchantName && status && to && from
              ? sqlToFromMerchantStatus
              : merchantName && to && from
              ? sqlToFromMerchant
              : to && from
              ? sqlToFrom
              : merchantName && status
              ? sqlMerchantStatus
              : merchantName
              ? sqlMerchant
              : status
              ? sqlStatus
              : searchText
              ? sqlSearch
              : sql,
              merchantName && status && to && from
              ? [merchantName, status, from, to]
              : merchantName && to && from
              ? [merchantName, from, to]
              : to && from
              ? [from, to]
              : merchantName && status
              ? [merchantName, status]
              : merchantName
              ? [merchantName]
              : status
              ? [status]
              : searchText
              ? [searchText]
              : []
              );
              
              let cbRefundResult = await mysqlcon(cbRefundSql)
        
              let transaction;
              let payinAmount;
              let payinCharges;
              let payinRefund
        
              if(result[0].count === null){
                transaction = 0
              } else{
                transaction = result[0].count
              }
        
              if(result[0].amount === null){
                payinAmount = 0
              } else{
                payinAmount = result[0].amount.toFixed(2)
              }
        
              if(result[0].charges === null){
                payinCharges = 0
              } else{
                payinCharges = result[0].charges.toFixed(2)
              }
        
              if(cbRefundResult[0].amount === null){
                payinRefund = 0
              } else{
                payinRefund = cbRefundResult[0].amount.toFixed(2)
              }
        
            if ((result[0].count) === 0) {
               res.status(201).json({
                data: [
                  {
                    name: "Total No. Of Transaction",
                    amount: 0,
                  },
                  {
                    name: "Total Amount Recieved",
                    amount: 0,
                  },
                  {
                    name: "Total Charges Recieved",
                    amount: 0,
                  },
                  {
                    name: "Total Refund & Chargeback",
                    amount: payinRefund
                  },
                ],
              });
            } else {
               res.status(200).json({
                data: [
                  {
                    name: "Total No. Of Transaction",
                    amount: transaction,
                  },
                  {
                    name: "Total Amount Recieved",
                    amount: payinAmount,
                  },
                  {
                    name: "Total Charges Recieved",
                    amount: payinCharges,
                  },
                  {
                    name: "Total Refund & Chargeback",
                    amount: payinRefund
                  },
                ],
              });
            }
        
          } catch(error){
            console.log(error)
            res.status(500).json({
              message:"Server Error",
              error,
            })
          }
    }

    async changeSandboxDepositStatus(req:Request,res:Response<statusRequest>):Promise<void>{
          try {
            let { status, invoice_id } = req.body;
        
            if (status > 5 || status < 0) {
               res.status(201).json({
                message: `Status Not Updated`,
              });
            }
        
            let sql = "UPDATE tbl_merchant_transaction_sandbox SET status = ? WHERE invoice_id = ?";
            let result = await mysqlcon(sql, [status, invoice_id]);
        
            if (result.affectedRows > 0) {
               res.status(200).json({
                message: `Status ${
                  status === "0"
                    ? "Failed"
                    : status === "1"
                    ? "Success"
                    : status === "2"
                    ? "Waiting"
                    : status === "3"
                    ? "Pending"
                    : status === "4"
                    ? "Refund"
                    : status === "5"
                    ? "ChargeBack"
                    : ""
                } Updated`,
                data: result,
              });
            } else {
               res.status(201).json({
                message: "Error while Changing Status",
                data: result,
              });
            }
          } catch (error) {
             res.status(500).json({
              message: "error occurered",
              error: error,
            });
          }
    }
}

export default new sandboxDeposite
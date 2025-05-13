import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';

interface sandpayoutRequest{
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


interface statusRequest{
    status?: string, 
    id? : string
    message?: string
    error? : any
    data?: any
}

interface PayoutReq{
    searchText?: string;
    merchantName?: string
    status?:string
    to?: any
    from?: any
    message?: string
    error? : any
    data?: any
}

class sandboxPayout{
    
    async defaultSandboxpayout(req:Request,res:Response<sandpayoutRequest>):Promise<void>{
          try {
            let pagination = (total: number, page: number, limit: number) => {
              let numOfPages = Math.ceil(total / limit);
              let start = page * limit - limit;
              return { limit, start, numOfPages };
            };
            let {to, from, status, merchantName, searchText} = req.body;
        
            let sqlCount = "SELECT COUNT(*) AS Total from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id"
        
            let sqlSearchCount ="SELECT COUNT(*) AS Total from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.uniqueid LIKE '%" +
            searchText +
            "%' OR  tbl_icici_payout_transaction_sandbox_response_details.payee_name  LIKE '%" +
            searchText +
            "%'";
        
            let sqlToFromCount = "SELECT COUNT(*) AS Total from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id where DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on) <= ?";
        
            let sqlMerchantCount = "SELECT COUNT(*) AS Total from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ?"
        
            let sqlStatusCount = "SELECT COUNT(*) AS Total from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.status = ?"
        
            let sqlMerchantStatusCount = "SELECT COUNT(*) AS Total from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? AND tbl_icici_payout_transaction_sandbox_response_details.status = ?"
        
            let sqlToFromMerchantCount = "SELECT COUNT(*) AS Total from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on) <= ?"
        
            let sqlToFromMerchantStatusCount = "SELECT COUNT(*) AS Total from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? AND tbl_icici_payout_transaction_sandbox_response_details.status = ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on) <= ?"
        
            let result = await mysqlcon(
              merchantName && status && to && from
              ? sqlToFromMerchantStatusCount
              : merchantName && to && from
              ? sqlToFromMerchantCount
              : to && from
              ? sqlToFromCount
              : merchantName && status
              ? sqlMerchantStatusCount
              : merchantName
              ? sqlMerchantCount
              : status
              ? sqlStatusCount
              : searchText
              ? sqlSearchCount
              : sqlCount,
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
        
              let total = result[0].Total;
              let page = req.body.page ? Number(req.body.page) : 1;
              let limit = req.body.limit ? Number(req.body.limit) : 10;
              let { start, numOfPages } = pagination(total, page, limit);
        
              let sql = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.*, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id ORDER BY tbl_icici_payout_transaction_sandbox_response_details.created_on DESC LIMIT ?,?"
        
              let sqlSearch ="SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.*, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.uniqueid LIKE '%" +
              searchText +
              "%' OR  tbl_icici_payout_transaction_sandbox_response_details.payee_name  LIKE '%" +
              searchText +
              "%'";
        
              let sqlToFrom = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.*, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id where DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on) <= ? LIMIT ?,?";
          
              let sqlMerchant = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.*, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? LIMIT ?,?"
          
              let sqlStatus = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.*, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.status = ? LIMIT ?,?"
          
              let sqlMerchantStatus = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.*, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? AND tbl_icici_payout_transaction_sandbox_response_details.status = ? LIMIT ?,?"
          
              let sqlToFromMerchant = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.*, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on) <= ? LIMIT ?,?"
          
              let sqlToFromMerchantStatus = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.*, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_icici_payout_transaction_sandbox_response_details.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? AND tbl_icici_payout_transaction_sandbox_response_details.status = ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on) <= ? LIMIT ?,?"
        
              let result1 = await mysqlcon(
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
                ? [merchantName, status, from, to, start, limit]
                : merchantName && to && from
                ? [merchantName, from, to, start, limit]
                : to && from
                ? [from, to, start, limit]
                : merchantName && status
                ? [merchantName, status, start, limit]
                : merchantName
                ? [merchantName, start, limit]
                : status
                ? [status, start, limit]
                : searchText
                ? [searchText, start, limit]
                : [start, limit]
              );
        
              let startRange = start + 1;
              let endRange = start + result1.length;
        
               res.status(200).json({
                message: result1.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
                currentPage: page,
                totalPages: numOfPages,
                pageLimit: limit,
                data: result1,
              });
        
          } catch(error){
            console.log(error)
            res.status(500).json({
              message:"Server Error",
              error,
            })
          }
    }

    async toggleSandboxPayout(req:Request,res:Response<statusRequest>):Promise<void>{
          try {
            let { status, id } = req.body;
        
            if (status !== "PENDING" && status !== "SUCCESS" && status !== "FAILURE") {
               res.status(201).json({
                message: `Status Not Updated`,
              });
            }
        
            let sql = "UPDATE tbl_icici_payout_transaction_sandbox_response_details SET status = ? WHERE id = ?";
            let result = await mysqlcon(sql, [status, id]);
            if (result.affectedRows > 0) {
               res.status(200).json({
                message: `Status ${
                  status === "SUCCESS"
                    ? "Success"
                    : status === "PENDING"
                    ? "Pending"
                    : status === "FAILURE"
                    ? "Failure"
                    : ""
                } Successfully `,
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

    async downloadSandboxPayout(req:Request,res:Response<PayoutReq>):Promise<void>{
        try{
            let {to, from, status, merchantName, searchText} = req.body;

            let sql = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.* from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id";

            let sqlToFrom = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.* from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id where DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on) <= ?";

            let sqlSearch ="SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.* from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.uniqueid LIKE '%" +
            searchText +
            "%' OR  tbl_icici_payout_transaction_sandbox_response_details.payee_name  LIKE '%" +
            searchText +
            "%'";
            
            let sqlMerchant = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.* from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ?"
            
            let sqlStatus = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.* from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.status = ?"
            
            let sqlMerchantStatus = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.* from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? AND tbl_icici_payout_transaction_sandbox_response_details.status = ?";
            
            let sqlToFromMerchant = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.* from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on) <= ?";
            
            let sqlToFromMerchantStatus = "SELECT tbl_user.name, tbl_icici_payout_transaction_sandbox_response_details.* from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? AND tbl_icici_payout_transaction_sandbox_response_details.status = ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on) <= ?"

            let data = await mysqlcon(
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
            
            res.send(data)
        }catch(err){
        console.log(err);
            res.status(500).json({
            message : "error occured"
            })
        }
    }

    async sandboxPayoutCards(req:Request,res:Response<statusRequest>):Promise<void>{
          try {
            let {to, from, status, merchantName, searchText} = req.body;
            
            let sql = "SELECT COUNT(*) AS count, SUM(tbl_icici_payout_transaction_sandbox_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_sandbox_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_sandbox_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id"
        
            let sqlSearch ="SELECT COUNT(*) AS count, SUM(tbl_icici_payout_transaction_sandbox_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_sandbox_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_sandbox_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.uniqueid LIKE '%" +
            searchText +
            "%' OR  tbl_icici_payout_transaction_sandbox_response_details.payee_name  LIKE '%" +
            searchText +
            "%'";
        
            let sqlToFrom = "SELECT COUNT(*) AS count, SUM(tbl_icici_payout_transaction_sandbox_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_sandbox_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_sandbox_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id where DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on) <= ?";
        
            let sqlMerchant = "SELECT COUNT(*) AS count, SUM(tbl_icici_payout_transaction_sandbox_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_sandbox_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_sandbox_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ?"
        
            let sqlStatus = "SELECT COUNT(*) AS count, SUM(tbl_icici_payout_transaction_sandbox_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_sandbox_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_sandbox_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.status = ?"
        
            let sqlMerchantStatus = "SELECT COUNT(*) AS count, SUM(tbl_icici_payout_transaction_sandbox_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_sandbox_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_sandbox_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? AND tbl_icici_payout_transaction_sandbox_response_details.status = ?"
        
            let sqlToFromMerchant = "SELECT COUNT(*) AS count, SUM(tbl_icici_payout_transaction_sandbox_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_sandbox_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_sandbox_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on) <= ?"
        
            let sqlToFromMerchantStatus = "SELECT COUNT(*) AS count, SUM(tbl_icici_payout_transaction_sandbox_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_sandbox_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_sandbox_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_sandbox_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id WHERE tbl_icici_payout_transaction_sandbox_response_details.users_id = ? AND tbl_icici_payout_transaction_sandbox_response_details.status = ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_sandbox_response_details.created_on) <= ?"
        
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
        
              let transaction;
              let payoutAmount;
              let payoutCharges;
              let payoutGST
        
              if(result[0].count === null){
                transaction = 0
              } else{
                transaction = result[0].count
              }
        
              if(result[0].amount === null){
                payoutAmount = 0
              } else{
                payoutAmount = result[0].amount.toFixed(2)
              }
        
              if(result[0].charges === null){
                payoutCharges = 0
              } else{
                payoutCharges = result[0].charges.toFixed(2)
              }
        
              if(result[0].gst === null){
                payoutGST = 0
              } else{
                payoutGST = result[0].gst.toFixed(2)
              }
        
            if ((result[0].count) === 0) {
               res.status(201).json({
                data: [
                  {
                    name: "Total No. Of Transaction",
                    amount: 0,
                  },
                  {
                    name: "Total Payout Transaction",
                    amount: 0,
                  },
                  {
                    name: "Total Payout Charges",
                    amount: 0,
                  },
                  {
                    name: "Total GST Amount",
                    amount: 0
                  },
                ],
              });
            } else {
               res.status(200).json({
                data: [
                  {
                    name: "Total No. Of Transaction",
                    amount: transaction
                  },
                  {
                    name: "Total Payout Transaction",
                    amount: payoutAmount,
                  },
                  {
                    name: "Total Payout Charges",
                    amount: payoutCharges,
                  },
                  {
                    name: "Total GST Amount",
                    amount: payoutGST
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
}


export default new sandboxPayout
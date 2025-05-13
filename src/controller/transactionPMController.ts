import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';


interface ExportPayoutsRequest{
    to?: string;
    from?: string;
    status?: string;
    merchantName?: string;
    searchText?: string;
    currency?: string;
    vendor?: string;
}
    
interface ToggleStatusRequest {
    status?: string;
    id?: string;
    message?: string
    data? :any
    error? : any
}

interface createRequest{
    users_id?: string, 
    currency_id?: string, 
    trx_type?: string, 
    uniqueId?: string, 
    payee_name?: string, 
    amount?: string, 
    akonto_charge?: string, 
    wallet_deduct?: string, 
    wallet_address?: string 
    message?: string
    data? :any
    error? : any
}

interface cronPayRequest{
    id?:string
    message?: string
    data? :any
    error? : any
}

interface getcurrRequest{
    id?:string
    message?: string
    data? :any
    error? : any
}

interface payourRequest{
    to?: string;
    from?: string;
    status?: string
    merchantName?: string;
    searchText?: string;
    currency?: string;
    payout_bank?: string;
    message?: string
    data? :any
    error? : any
}

class transactionPM{

    async defaultPM(req:Request,res:Response):Promise<void>{
          try {
            let pagination = (total: number, page: number, limit: number) => {
              let numOfPages = Math.ceil(total / limit);
              let start = (page - 1) * limit;
              return { limit, start, numOfPages };
            };
        
            let { to, from,TO,FROM,status, merchantName, searchText, currency, vendor} = req.body;
            
            searchText = searchText || '';
           let sqlCount = "SELECT COUNT(*) AS Total from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id";
            let conditions = [];
            let values = [];
            if (searchText) {
              conditions.push("(tbl_icici_payout_transaction_response_details.uniqueid LIKE ? OR tbl_icici_payout_transaction_response_details.payee_name LIKE ?)");
              values.push(`%${searchText}%`, `%${searchText}%`);
            }
            if (from && to) {
              conditions.push("DATE(tbl_icici_payout_transaction_response_details.created_on) >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?");
              values.push(from, to);
            }
            if (FROM && TO) {
              conditions.push("DATE(tbl_icici_payout_transaction_response_details.updated_on) >= ? AND DATE(tbl_icici_payout_transaction_response_details.updated_on) <= ?");
              values.push(FROM, TO);
            }
            if (merchantName) {
              conditions.push(`tbl_icici_payout_transaction_response_details.users_id IN (?)`);
              values.push(merchantName.split(','))
            }
            if (status) {
              conditions.push(`tbl_icici_payout_transaction_response_details.status IN(?)`);
              values.push(status.split(','));
            }
            if (currency) {
              conditions.push("tbl_icici_payout_transaction_response_details.currency IN (?)");
              values.push(currency.split(','));
            }
            if (vendor) {
              conditions.push("tbl_icici_payout_transaction_response_details.payout_bank IN (?)");
              values.push(vendor.split(','));
            }
            let sql1 = conditions.length > 0 ? `${sqlCount} WHERE ${conditions.join(" AND ")}` : sqlCount;
            let result = await mysqlcon(sql1, values);
            let total = result[0].Total;
            let page = req.body.page ? Number(req.body.page) : 1;
            let limit = req.body.limit ? Number(req.body.limit) : 10;
            let { start, numOfPages } = pagination(total, page, limit);
            let sqlCount1 = "SELECT tbl_user.name, payment_gateway.gateway_name, tbl_icici_payout_transaction_response_details.*, DATE_FORMAT(tbl_icici_payout_transaction_response_details.created_on, '%Y-%m-%d %H:%i:%s') as created_on, DATE_FORMAT(tbl_icici_payout_transaction_response_details.updated_on, '%Y-%m-%d %H:%i:%s') as updated_on FROM tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id LEFT JOIN payment_gateway ON payment_gateway.gateway_number = tbl_icici_payout_transaction_response_details.payout_bank";
            let conditions1 = [];
            let values1 = [];
            if (searchText) {
              conditions1.push("(tbl_icici_payout_transaction_response_details.uniqueid LIKE ? OR tbl_icici_payout_transaction_response_details.payee_name LIKE ?)");
              values1.push(`%${searchText}%`, `%${searchText}%`);
            }
            if (from && to) {
              conditions1.push("DATE(tbl_icici_payout_transaction_response_details.created_on) >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?");
              values1.push(from, to);
            }
            if (FROM && TO) {
              conditions1.push("DATE(tbl_icici_payout_transaction_response_details.updated_on) >= ? AND DATE(tbl_icici_payout_transaction_response_details.updated_on) <= ?");
              values1.push(FROM, TO);
            }
             if (merchantName) {
              conditions1.push(`tbl_icici_payout_transaction_response_details.users_id IN (?)`);
              values1.push(merchantName.split(','))
            }
           if (status) {
              conditions1.push(`tbl_icici_payout_transaction_response_details.status IN (?)`);
              values1.push(status.split(','));
            }
            if (currency) {
              conditions1.push("tbl_icici_payout_transaction_response_details.currency IN (?)");
               values1.push(currency.split(','));
            }
            if (vendor) {
              conditions1.push("tbl_icici_payout_transaction_response_details.payout_bank IN (?)");
              values1.push(vendor.split(','));
            }
            let sql2 = conditions1.length > 0 ? `${sqlCount1} WHERE ${conditions1.join(" AND ")} ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC LIMIT ?,?` : `${sqlCount1} ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC LIMIT ?,?`;
            let result1 = await mysqlcon(sql2, [...values1, start, limit]);
            let startRange = start + 1;
            let endRange = Math.min(start + limit, total);
             res.status(200).json({
              message: result1.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
              currentPage: page,
              totalPages: numOfPages,
              pageLimit: limit,
              data: result1,
            });
          } catch (err) {
            console.log(err)
            res.status(500).json({
              message: "Server Error",
              err,
            })
          }
    }

    async exportPayouts(req: Request<ExportPayoutsRequest>, res: Response): Promise<void> {
        try {
          const {
            to,
            from,
            status,
            merchantName,
            searchText,
            currency,
            vendor,
        } = req.body;
    
          let baseQuery = `
            SELECT tbl_icici_payout_transaction_response_details.*
            FROM tbl_icici_payout_transaction_response_details
            LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id
          `;
    
          const conditions: string[] = [];
          const parameters: any[] = [];
    
          if (searchText) {
            conditions.push(`
              (tbl_icici_payout_transaction_response_details.uniqueid LIKE ? 
              OR tbl_icici_payout_transaction_response_details.payee_name LIKE ?)
            `);
            parameters.push(`%${searchText}%`, `%${searchText}%`);
          }
    
          if (from && to) {
            conditions.push(`
              DATE(tbl_icici_payout_transaction_response_details.created_on) BETWEEN ? AND ?
            `);
            parameters.push(from, to);
          }
    
          if (merchantName) {
            conditions.push(`tbl_icici_payout_transaction_response_details.users_id = ?`);
            parameters.push(merchantName);
          }
    
          if (status) {
            conditions.push(`tbl_icici_payout_transaction_response_details.status = ?`);
            parameters.push(status);
          }
    
          if (currency) {
            conditions.push(`tbl_icici_payout_transaction_response_details.currency = ?`);
            parameters.push(currency);
          }
    
          if (vendor) {
            conditions.push(`tbl_icici_payout_transaction_response_details.bank_name = ?`);
            parameters.push(vendor);
          }
    
          const finalQuery = conditions.length > 0
            ? `${baseQuery} WHERE ${conditions.join(' AND ')}`
            : baseQuery;
    
          const result: any[] = await mysqlcon(finalQuery, parameters);
    
          res.status(200).json({
            message: 'Payout export successful',
            total: result.length,
            data: result
          });
    
        } catch (err) {
          console.error('Export Error:', err);
          res.status(500).json({
            message: "Server Error",
            err
          });
        }
    }
    
    async  toggleStatusPM (req: Request, res: Response<ToggleStatusRequest>): Promise<void>{
        try {
            let { status, id } = req.body;

            if (status !== "PENDING" && status !== "SUCCESS" && status !== "FAILURE") {
            res.status(201).json({
                message: `Status Not Updated`,
            });
            }

            let sql =
            "UPDATE tbl_icici_payout_transaction_response_details SET status = ? WHERE id = ?";
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
                    // data: result,
                });
            } else {
                res.status(201).json({
                    message: "Error while Changing Status",
                    // data: result,
                });
            }
        } catch (error) {
            res.status(500).json({
            message: "error occurered",
            error: error,
            });
        }
    };
    
    async createPM(req:Request,res:Response<createRequest>):Promise<void>{
          try {
            const currentUTC = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000; 
            const istTime = new Date(currentUTC.getTime() + istOffset);
            const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');
        
            let { users_id, currency_id, trx_type, uniqueId, payee_name, amount, akonto_charge, wallet_deduct, wallet_address } = req.body;
            let currencySql = "SELECT sortname FROM countries WHERE id = ?";
            let currencyResult = await mysqlcon(currencySql, [currency_id]);
            let sortname = currencyResult[0].sortname
            
            let gst_amount = 0;
            let bank_charges = 0;
            let details = {
              users_id: users_id,
              currency: sortname,
              trx_type,
              uniqueid: uniqueId,
              payee_name,
              amount,
              status: "SUCCESS",
              akonto_charge: akonto_charge,
              merchant_db_response: 1,
              tnx_status_check: 1,
              bank_request: 2,
              gst_amount: gst_amount,
              bank_charges: bank_charges,
              wallet_deduct,
              wallet_address,
              created_on: formattedIST,
              updated_on: formattedIST,
            };
            
        
            let sql = "INSERT INTO tbl_icici_payout_transaction_response_details SET ?";
        
            let result = await mysqlcon(sql, [details]);
        
            if (result.affectedRows > 0) {
               res.status(200).json({
                message: "Row Created",
                // data: result,
              });
            } else {
               res.status(201).json({
                message: "Error While Creating",
                // data: result,
              });
            }
          } catch (error) {
            console.log(error);
             res.status(500).json({
              message: "error occurered",
              error,
            });
          }
    }

    async cronPayoutLogs(req:Request,res:Response<cronPayRequest>):Promise<void>{   //table not exist tbl_payout_json
        try {
            const { id } = req.body;
            const sql = `SELECT tbl_icici_payout_transaction_response_details.merchant_db_response, tbl_payout_json.req_to_bank,tbl_payout_json.payout_json_data,tbl_payout_json.end_point_response,tbl_payout_json.endpoint_response_decrypt, tbl_payout_json.full_bank_response FROM tbl_icici_payout_transaction_response_details LEFT JOIN tbl_payout_json  ON  tbl_icici_payout_transaction_response_details.uniqueid = tbl_payout_json.order_no WHERE tbl_icici_payout_transaction_response_details.uniqueid = ?`;
            const result = await mysqlcon(sql, [id]);
            if (result && result.length > 0) {
                 res.status(200).json({
                    data: result[0],
                });
            } else {
                 res.status(404).json({
                    message: "No data found",
                });
            }
        } catch (error) {
            console.log(error);
             res.status(500).json({
                message: "An error occurred",
                error,
            });
        }
    }

    async getCurrency(req:Request,res:Response<getcurrRequest>):Promise<void>{

        try {
            let { id } = req.body;
        
            let sql = "SELECT * FROM tbl_user WHERE id = ?";
        
            let result = await mysqlcon(sql, [id]);
        
            let currencyId = "";
        
            if (result.length !== 0) {
              currencyId += result[0].solution_apply_for_country;
            }
        
            let currA = currencyId.split(",");
        
            let sql1 = "SELECT id as currencyID, currency FROM countries WHERE id IN (";
        
            for (let i = 0; i < currA.length; i++) {
              sql1 += "'";
              sql1 += currA[i];
              sql1 += "',";
            }
        
            sql1 = sql1.slice(0, -1);
            sql1 += ")";
        
            let result1 = await mysqlcon(sql1);
        
            if (result1.length !== 0) {
               res.status(200).json({
                message: `Currency for merchant id = ${id} are ${currA.length}`,
        
                data: result1,
              });
            } else {
               res.status(201).json({
                message: `No Record Found`,
                data: result1,
              });
            }
          } catch (error) {
             res.status(500).json({
              message: "error occurered",
              error: error,
            });
          }

    }

    async payoutCards(req:Request,res:Response<payourRequest>):Promise<void>{
          try {
            let { to, from, status, merchantName, searchText, currency, payout_bank } = req.body;
        
            let sqlCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id"
        
            let sqlSearchCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.uniqueid LIKE '%" +
              searchText +
              "%' OR  tbl_icici_payout_transaction_response_details.payee_name  LIKE '%" +
              searchText +
              "%'";
        
            let sqlToFromCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id where DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?";
        
            let sqlMerchantCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ?"
        
            let sqlStatusCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.status = ?"
        
            let sqlCurrencyCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.currency = ?"
        
            let sqlpayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.bank_name = ?"
        
            let sqlToFromStatusCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.status= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
        
            let sqlToFromMerchantCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from  tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
            let sqlToFromCurrencyCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst  from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.currency = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
            let sqlToFrompayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.bank_name = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
            let sqlMerchantStatusCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from  tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.status = ?"
        
            let sqlStatusCurrencyCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst  from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.currency = ? AND tbl_icici_payout_transaction_response_details.status = ?"
        
            let sqlStatuspayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst  from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.bank_name = ? AND tbl_icici_payout_transaction_response_details.status = ?"
        
            let sqlMerchantCurrencyCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst  from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.currency = ?"
        
            let sqlMerchantpayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.bank_name = ?"
        
            let sqlCurrencypayout_bankCount = "SELECT COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.bank_name = ? AND tbl_icici_payout_transaction_response_details.currency = ?"
        
        
            let sqlToFromMerchantStatusCount = "SELECT COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.status = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
        
            let sqlToFromStatusCurrencyCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.currency = ? AND tbl_icici_payout_transaction_response_details.status = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
            let sqlToFromStatuspayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.bank_name = ? AND tbl_icici_payout_transaction_response_details.status = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
            let sqlToFromMerchantCurrencyCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.currency = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
            let sqlToFromMerchantPayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.bank_name = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
            let sqlToFromCurrencypayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.bank_name = ? AND tbl_icici_payout_transaction_response_details.currency = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
            let sqlMerchantStatusCurrencyCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.status = ? AND tbl_icici_payout_transaction_response_details.currency = ? "
        
            let sqlMerchantStatuspayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.status = ? AND tbl_icici_payout_transaction_response_details.bank_name = ? "
        
            let sqlStatusCurrencypayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.status = ? AND tbl_icici_payout_transaction_response_details.currency = ? AND tbl_icici_payout_transaction_response_details.bank_name = ? "
        
            let sqlMerchantCurrencypayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.currency = ? AND tbl_icici_payout_transaction_response_details.bank_name = ? "
        
            let sqlToFromMerchantStatusCurrencyCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.status = ? AND tbl_icici_payout_transaction_response_details.currency = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
            let sqlToFromMerchantStatuspayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.status = ? AND tbl_icici_payout_transaction_response_details.bank_name = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
            let sqlToFromCurrencyStatuspayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.currency = ? AND tbl_icici_payout_transaction_response_details.status = ? AND tbl_icici_payout_transaction_response_details.bank_name = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
            let sqlToFromMerchantCurrencypayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.currency = ? AND tbl_icici_payout_transaction_response_details.bank_name = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
            let sqlCurrencyMerchantStatuspayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE  tbl_icici_payout_transaction_response_details.currency = ? AND tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.status = ? AND tbl_icici_payout_transaction_response_details.bank_name = ?"
        
        
            let sqlToFromMerchantStatusCurrencyPayout_bankCount = "SELECT  COUNT(*) AS count, SUM(tbl_icici_payout_transaction_response_details.amount) AS amount, SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges, SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.status = ? AND tbl_icici_payout_transaction_response_details.currency = ? AND tbl_icici_payout_transaction_response_details.bank_name = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?"
        
        
        
        
        
        
            let result = await mysqlcon(
              merchantName && status && to && from && currency && payout_bank
                ? sqlToFromMerchantStatusCurrencyPayout_bankCount
                : currency && merchantName && status && payout_bank
                  ? sqlCurrencyMerchantStatuspayout_bankCount
                  : to && from && merchantName && currency && payout_bank
                    ? sqlToFromMerchantCurrencypayout_bankCount
                    : to && from && currency && status && payout_bank
                      ? sqlToFromCurrencyStatuspayout_bankCount
                      : to && from && merchantName && status && payout_bank
                        ? sqlToFromMerchantStatuspayout_bankCount
                        : to && from && merchantName && status && currency
                          ? sqlToFromMerchantStatusCurrencyCount
                          : merchantName && currency && payout_bank
                            ? sqlMerchantCurrencypayout_bankCount
                            : status && currency && payout_bank
                              ? sqlStatusCurrencypayout_bankCount
                              : merchantName && status && payout_bank
                                ? sqlMerchantStatuspayout_bankCount
                                : merchantName && status && currency
                                  ? sqlMerchantStatusCurrencyCount
                                  : to && from && currency && payout_bank
                                    ? sqlToFromCurrencypayout_bankCount
                                    : to && from && merchantName && payout_bank
                                      ? sqlToFromMerchantPayout_bankCount
                                      : to && from && merchantName && currency
                                        ? sqlToFromMerchantCurrencyCount
                                        : to && from && status && payout_bank
                                          ? sqlToFromStatuspayout_bankCount
                                          : to && from && status && currency
                                            ? sqlToFromStatusCurrencyCount
                                            : to && from && merchantName && status
                                              ? sqlToFromMerchantStatusCount
                                              : currency && payout_bank
                                                ? sqlCurrencypayout_bankCount
                                                : merchantName && payout_bank
                                                  ? sqlMerchantpayout_bankCount
                                                  : merchantName && currency
                                                    ? sqlMerchantCurrencyCount
                                                    : status && payout_bank
                                                      ? sqlStatuspayout_bankCount
                                                      : status && currency
                                                        ? sqlStatusCurrencyCount
                                                        : merchantName && status
                                                          ? sqlMerchantStatusCount
                                                          : to && from && payout_bank
                                                            ? sqlToFrompayout_bankCount
                                                            : to && from && currency
                                                              ? sqlToFromCurrencyCount
                                                              : to && from && merchantName
                                                                ? sqlToFromMerchantCount
                                                                : to && from && status
                                                                  ? sqlToFromStatusCount
                                                                  : payout_bank
                                                                    ? sqlpayout_bankCount
                                                                    : currency
                                                                      ? sqlCurrencyCount
                                                                      : status
                                                                        ? sqlStatusCount
                                                                        : merchantName
                                                                          ? sqlMerchantCount
                                                                          : to && from
                                                                            ? sqlToFromCount
                                                                            : searchText
                                                                              ? sqlSearchCount : sqlCount,
              merchantName && status && to && from && currency && payout_bank ? [merchantName, status, currency, payout_bank, from, to] : currency && merchantName && status && payout_bank ? [currency, merchantName, status, payout_bank] : to && from && merchantName && currency && payout_bank ? [merchantName, currency, payout_bank, from, to] : to && from && currency && status && payout_bank ? [currency, status, payout_bank, from, to] : to && from && merchantName && status && payout_bank ? [merchantName, status, payout_bank, from, to] : to && from && merchantName && status && currency ? [merchantName, status, currency, from, to] : merchantName && currency && payout_bank ? [merchantName, currency, payout_bank] : status && currency && payout_bank
                ? [status, currency, payout_bank]
                : merchantName && status && payout_bank
                  ? [merchantName, status, payout_bank]
                  : merchantName && status && currency
                    ? [merchantName, status, currency]
                    : to && from && currency && payout_bank
                      ? [payout_bank, currency, from, to]
                      : to && from && merchantName && payout_bank
                        ? [merchantName, payout_bank,]
                        : to && from && merchantName && currency
                          ? [merchantName, currency, from, to]
                          : to && from && status && payout_bank
                            ? [payout_bank, status, to, from]
                            : to && from && status && currency
                              ? [currency, status, to, from]
                              : to && from && merchantName && status
                                ? [merchantName, status, to, from]
                                : currency && payout_bank
                                  ? [payout_bank, currency]
                                  : merchantName && payout_bank
                                    ? [merchantName, payout_bank]
                                    : merchantName && currency
                                      ? [merchantName, currency]
                                      : status && payout_bank
                                        ? [payout_bank, status]
                                        : status && currency
                                          ? [currency, status]
                                          : merchantName && status
                                            ? [merchantName, status]
                                            : to && from && payout_bank
                                              ? [payout_bank, from, to]
                                              : to && from && currency
                                                ? [currency, from, to]
                                                : to && from && merchantName
                                                  ? [merchantName, from, to]
                                                  : to && from && status
                                                    ? [status, from, to]
                                                    : payout_bank
                                                      ? [payout_bank]
                                                      : currency
                                                        ? [currency]
                                                        : status
                                                          ? [status]
                                                          : merchantName
                                                            ? [merchantName]
                                                            : to && from
                                                              ? [from, to]
                                                              : searchText
                                                                ? [searchText] : ""
        
            );
        
        
        
        
        
        
        
            let transaction;
            let payoutAmount;
            let payoutCharges;
            let payoutGST
        
            if (result[0].count === null) {
              transaction = 0
            } else {
              transaction = result[0].count
            }
        
            if (result[0].amount === null) {
              payoutAmount = 0
            } else {
              payoutAmount = result[0].amount.toFixed(2)
            }
        
            if (result[0].charges === null) {
              payoutCharges = 0
            } else {
              payoutCharges = result[0].charges.toFixed(2)
            }
        
            if (result[0].gst === null) {
              payoutGST = 0
            } else {
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
        
          } catch (error) {
            console.log(error)
            res.status(500).json({
              message: "Server Error",
              error,
            })
          }
    }

}

export default new transactionPM
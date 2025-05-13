import { Request,Response } from "express";
import mysqlcon from '../config/db_connection';
import helpers from '../helper/defaultheler'
import nodemailer from 'nodemailer';
import path from 'path';
import ejs from 'ejs';
import md5 from 'md5';
import axios from 'axios'
const webhookUrl = 'https://hooks.slack.com/services/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';
let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;

interface defaultResponse {
  message: string;
  currentPage?: number;
  totalPages?: number;
  pageLimit?: number;
  data?: any[];
  error?: any;
}

interface getidResponse {
    id? : string,
    message? : string,
    error? : any,
    data? : any
}

interface cronMidRes {
    id? : string,
    message? : string,
    error? : any,
    data? : any
}

interface statusResponse{
    order_no? : string,
    message? : string,
    error? : any,
    data? : any
}

interface createResponse {
    merchantId? : string, 
    currency_id? : string, 
    trx_type? : string, 
    transaction_id? :  string, 
    name? : string, 
    amount? : number,
    message? : string,
    error? : any,
    data? : any
}

interface getCurrResponse{
    id? : string,
    message? : string,
    error? : any,
    data? : any
}

interface allmidResponse{
    adminfilter? : string,
    message? : string,
    error? : any,
    data? : any
}


interface exportResponse{
    merchantName? : string,
    currency? : string,
    gatewayNumber? : string,
    message? : string,
    error? : any,
    data? : any
}

interface depCardResponse {
    merchantName? : string,
    message? : string,
    amount? : string,
    error? : any,
    data? : any
}

interface OTPEntry {
  otp: string;
  timestamp: number;
}

interface OTPStore {
  [key: string]: OTPEntry;
}

const otpStore: OTPStore = {};

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(email: string, otp: string): Promise<any> {
  const templatePath = path.join(__dirname, '../view/statusotp.ejs');
  const htmlContent = await ejs.renderFile(templatePath, { otp });

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: "mark@ubankconnect.com",
      pass: "ziczkpuzpyyemklv",
    },
  });

  const mailOptions = {
    from: '"UbankConnect" <mark@ubankconnect.com>',
    to: email,
    subject: 'Transaction Status Change Verification OTP Code',
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions);
}

function cleanupExpiredOTPs(): void {
  const currentTime = Date.now();
  for (const id in otpStore) {
    const { timestamp } = otpStore[id];
    const timeDifference = (currentTime - timestamp) / 1000 / 60;
    if (timeDifference > 5) {
      delete otpStore[id];
    }
  }
}

setInterval(cleanupExpiredOTPs, 60000);

interface manualResponse {
  expiry? : any
  error?: any;
  message?: string;
  state_code?: string;
  state?: string;
  user?:any
}

interface AuthenticatedRequest extends Request {
  user?: any; 
}

class transactionMT {
  async defaultMT (req: Request,res: Response<defaultResponse>): Promise<void>{
      try {
        const {
          searchText,
          to,
          from,
          status,
          merchantName,
          currency,
          gatewayNumber,
          page: reqPage,
          limit: reqLimit,
        } = req.body;
    
        const page = reqPage && !isNaN(reqPage) && reqPage > 0 ? Number(reqPage) : 1;
        const limit = reqLimit && !isNaN(reqLimit) && reqLimit > 0 ? Number(reqLimit) : 10;
    
        const sqlCall = `CALL GetMerchantTransactions(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const sqlValues = [
          merchantName || null,
          status || null,
          from || null,
          to || null,
          currency || null,
          gatewayNumber || null,
          searchText || null,
          page,
          limit,
        ];
    
        const result = await mysqlcon(sqlCall, sqlValues);
    
        const total = result[0][0]?.Total || 0;
        const transactions = result[1] || [];
    
        const startRange = (page - 1) * limit + 1;
        const endRange = Math.min(startRange + limit - 1, total);
        const numOfPages = Math.ceil(total / limit);
    
        const message = transactions.length > 0 ? `Showing ${startRange} to ${endRange} of ${total} records`: "No data found";
    
        res.status(200).json({
          message,
          currentPage: page,
          totalPages: numOfPages,
          pageLimit: limit,
          data: transactions,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "An error occurred while fetching transactions.",
          error,
        });
      }
  };

  async getIdMT (req :Request ,res : Response<getidResponse>): Promise<void>{
        try {
          let { id } = req.body;
          console.log(id)
          let sql = "SELECT * FROM tbl_merchant_transaction WHERE invoice_id = ?";
          let result = await mysqlcon(sql, [id]);
          if (result.length !== 0) {
              res.status(200).json({
              message: `Records for id =  ${id}`,
              data: result
            });
          } else {
              res.status(201).json({
              message: `No Record Found`,
              data: result[0],
            });
          }
        } catch (error) {
          console.log(error)
            res.status(500).json({
            message: "error occurered",
            error: error,
          });
        }
  }

  async cronMerchantLogs (req:Request,res:Response<cronMidRes>):Promise<void>{
        try {
          const { id } = req.body;
          const sql = `SELECT tbl_merchant_transaction.*, tbl_payin_request.*, tbl_payment_gate_response_tale.*, tbl_cron_log.* FROM tbl_merchant_transaction  LEFT JOIN tbl_payin_request  ON tbl_merchant_transaction.order_no = tbl_payin_request.order_id LEFT JOIN tbl_payment_gate_response_tale  ON tbl_merchant_transaction.order_no = tbl_payment_gate_response_tale.order_id LEFT JOIN tbl_cron_log  ON  tbl_merchant_transaction.order_no = tbl_cron_log.order_no WHERE tbl_merchant_transaction.invoice_id = ?`;
          const result = await mysqlcon(sql, [id]);
      
          if (result[0].length === 0) {
              res.status(201).json({
              message: `No Record Found`,
              data: result[0],
            });
          }
      
            res.status(200).json({
            data: result,
          });
        } catch (error) {
          console.log(error);
            res.status(500).json({
            message: "An error occurred",
            error,
          });
        }
  }

  async statusApi (req:Request,res:Response<statusResponse>):Promise<void>{
  try {
      let {order_no} = req.body
      console.log(req.body)
      let sql = "SELECT * FROM tbl_order_status WHERE order_no = ? ORDER BY creation_date DESC";
      let result = await mysqlcon(sql, [order_no])
      res.status(200).json({
      data : result,
      });
  } catch (error) {
      console.log(error);
      res.status(500).json({
      message: "An error occurred",
      error,
      });
  }
  }

  async createMT (req:Request,res:Response<createResponse>):Promise<void>{
      try {
          let { merchantId, currency_id, trx_type, transaction_id, name, amount } = req.body;
          let sqlF = "SELECT * FROM tbl_merchant_charges WHERE currency_id = ?";
          let resultF = await mysqlcon(sqlF, [currency_id]);
          let charge = 0;
          if (resultF.length === 0) {
              let sqlU = "SELECT * FROM tbl_user WHERE id = ?";
              let resultU = await mysqlcon(sqlU, [merchantId]);
                  if (resultU.length !== 0) {
                      if (trx_type === "CASH") {
                      charge = resultU[0].payin_card_credit;
                  } else {
                      charge = resultU[0].payin_card_credit;
                  }
              }
          } else {
              charge = resultF[0].payin_amount;
          }
          let akonto_charge = (amount * charge) / 100;
          let gst_amount = 0;
              if (currency_id === "53") {
                  gst_amount = (amount * 18) / 100;
              }
          
          let settle_amount = amount - (akonto_charge + gst_amount);
          let details = {
              ammount: amount,
              user_id: merchantId,
              i_flname: name,
              transaction_id: transaction_id,
              payment_type: trx_type,
              payment_status: `Success by ${trx_type}`,
              status: 1,
              payin_charges: akonto_charge,
              merchant_db_response: 1,
              sales_from: 1,
              pending_hit_response_by: 2,
              gst_charges: gst_amount,
              trx_live_test: 1,
              settle_amount: settle_amount,
              created_on: dateTime,
              updated_on: dateTime,
              settlement_on: dateTime,
          };

          if (merchantId !== undefined && trx_type !== undefined && transaction_id !== undefined && name !== undefined && amount !== undefined) {
              let sql = "INSERT INTO tbl_merchant_transaction SET ?";
              let result = await mysqlcon(sql, [details]);
              
                  if (result.affectedRows > 0) {
                      res.status(200).json({
                      message: "Row Created"
                      });
                  } else {
                      res.status(201).json({
                      message: "Error While Creating"
                      });
                  }
              } else {
                  res.status(201).json({
                  message: "Error While Creating! Enter All 5 Parameter",
              });
          }
      } catch (error) {
          console.log(error)
          res.status(500).json({
              message: "error occurered",
              error: error,
          });
      }
  }

  async getCurrencyMT(req:Request,res:Response<getCurrResponse>):Promise<void>{
        try {
          let { id } = req.body;
          let sql = "SELECT * FROM tbl_user WHERE id = ?";
          let result = await mysqlcon(sql, [id]);
          let currencyId = "";
          if (result.length !== 0) {
            currencyId += result[0].solution_apply_for_country;
          }
          let currA = currencyId.split(",");
          let sql1 = "SELECT id as currencyID,sortname FROM countries WHERE id IN (";
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

  async allMerchant(req:Request,res:Response<allmidResponse>): Promise<void>{
      try{
          const {adminfilter} = req.body
          
          let sqlM ="SELECT id, name, wallet from tbl_user WHERE status = 1 AND complete_profile = 1 AND account_type != 3";
          let sqlAdmin = "select user_id as id , CONCAT(firstname, lastname) as name from tbl_login"
          let resultM = await mysqlcon(adminfilter?sqlAdmin:sqlM);
      
          res.status(200).json({
              data:resultM
          })

      } catch(error){
          res.status(500).json({
          message:"Server Error",
          error,
          })
      }
  }

  async exportMT(req:Request,res:Response<exportResponse>): Promise<void>{
      try {
          let {searchText, to, from, status, merchantName,currency,gatewayNumber} = req.body;
      
          const sqlDefault = `SELECT tbl_user.name, tbl_merchant_transaction.*, tbl_merchant_transaction.created_on
          FROM tbl_merchant_transaction INNER JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id`;
          const sqlConditions = [];
          const sqlValues = [];
          if (merchantName) {
            sqlConditions.push("tbl_merchant_transaction.user_id = ?");
            sqlValues.push(merchantName);
          }
      
          if (status) {
            sqlConditions.push("tbl_merchant_transaction.status = ?");
            sqlValues.push(status);
          }
      
          if (to && from) {
            sqlConditions.push("DATE(tbl_merchant_transaction.created_on) >= ? AND DATE(tbl_merchant_transaction.created_on) <= ?");
            sqlValues.push(from, to);
          }
      
          if (currency) {
            sqlConditions.push("tbl_merchant_transaction.ammount_type = ?");
            sqlValues.push(currency);
          }
      
          if (gatewayNumber) {
            sqlConditions.push("tbl_merchant_transaction.gatewayNumber = ?");
            sqlValues.push(gatewayNumber);
          }
      
          if (searchText) {
            sqlConditions.push("(tbl_merchant_transaction.order_no LIKE ? OR tbl_merchant_transaction.txn_id LIKE ?)");
            sqlValues.push(`%${searchText}%`, `%${searchText}%`);
          }
      
          const conditionsStr = sqlConditions.length > 0 ? `WHERE ${sqlConditions.join(" AND ")}` : "";
          const sqlData = `${sqlDefault} ${conditionsStr} ORDER BY tbl_merchant_transaction.created_on DESC`;
          let result1 = await mysqlcon(sqlData, [...sqlValues]);
          res.send(result1)
      } catch (error) {
          console.log(error);
          res.status(500).json({
            message: "error occurered",
            error: error,
          });
      }
  }

  async depositsCards(req:Request,res:Response<depCardResponse>): Promise<void>{
        try {
          let {to, from, status, merchantName, searchText} = req.body;
      
          let sql = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction INNER JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id WHERE tbl_user.status = 1 AND tbl_user.complete_profile = 1"
      
          let sqlSearch ="SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction WHERE order_no LIKE '%" +
          searchText +
          "%' OR txn_id LIKE '%" +
          searchText +
          "%'";
      
          let cbRefundSql = "SELECT SUM(ammount) AS amount from tbl_merchant_transaction INNER JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id WHERE tbl_user.status = 1 AND tbl_user.complete_profile = 1 AND tbl_merchant_transaction.status IN(4,5)"
      
          let sqlToFrom = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction INNER JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id WHERE tbl_user.status = 1 AND tbl_user.complete_profile = 1 AND DATE(tbl_merchant_transaction.created_on)  >= ? AND DATE(tbl_merchant_transaction.created_on) <= ?";
      
          let sqlMerchant = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction INNER JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id WHERE tbl_user.status = 1 AND tbl_user.complete_profile = 1 AND tbl_merchant_transaction.user_id = ?"
      
          let sqlStatus = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction INNER JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id WHERE tbl_user.status = 1 AND tbl_user.complete_profile = 1 AND tbl_merchant_transaction.status = ?"
      
          let sqlMerchantStatus = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction INNER JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id WHERE tbl_user.status = 1 AND tbl_user.complete_profile = 1 AND tbl_merchant_transaction.user_id = ? AND tbl_merchant_transaction.status = ?"
      
          let sqlToFromMerchant = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction INNER JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id WHERE tbl_user.status = 1 AND tbl_user.complete_profile = 1 AND tbl_merchant_transaction.user_id = ? AND DATE(tbl_merchant_transaction.created_on)  >= ? AND DATE(tbl_merchant_transaction.created_on) <= ?"
      
          let sqlToFromMerchantStatus = "SELECT COUNT(*) AS count, SUM(ammount) AS amount, SUM(payin_charges) AS charges from tbl_merchant_transaction INNER JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id WHERE tbl_user.status = 1 AND tbl_user.complete_profile = 1 AND tbl_merchant_transaction.user_id = ? AND tbl_merchant_transaction.status = ? AND DATE(tbl_merchant_transaction.created_on)  >= ? AND DATE(tbl_merchant_transaction.created_on) <= ?"
      
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
      
          // let result = await mysqlcon(sql)
          let cbRefundResult = await mysqlcon(cbRefundSql)
      
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
                  amount: cbRefundResult[0].amount ? cbRefundResult[0].amount.toFixed(2) : "0.00"
                },
              ],
            });
          } else {
            res.status(200).json({
              data: [
                {
                  name: "Total No. Of Transaction",
                  amount: result[0].count,
                },
                {
                  name: "Total Amount Recieved",
                  amount: result[0].amount ? result[0].amount.toFixed(2) : "0.00",
                },
                {
                  name: "Total Charges Recieved",
                  amount: result[0].charges ? result[0].charges.toFixed(2) : "0.00",
                },
                {
                  name: "Total Refund & Chargeback",
                  amount: cbRefundResult[0].amount ? cbRefundResult[0].amount.toFixed(2) : "0.00"
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

  async toggleStatusMT (req: Request, res: Response): Promise<void>{
    try {
      const currentUTC = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(currentUTC.getTime() + istOffset);
      const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');

      const loginuserId = (req as any).user.email;
      const { status, id, otp } = req.body;
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      if (status > 5 || status < 0) {
        res.status(201).json({ message: `Status Not Updated` });
        return;
      }

      if (!otp) {
        const sqldata = "SELECT email FROM tbl_login WHERE email = ?";
        const resultData = await mysqlcon(sqldata, [loginuserId]);

        if (resultData.length > 0) {
          const { email } = resultData[0];
          const otpCode = generateOTP();
          otpStore[id] = { otp: otpCode, timestamp: Date.now() };
          await sendOTP(email, otpCode);
          res.status(200).json({ message: 'OTP sent to email' });
        } else {
          res.status(201).json({
            message: "Error while fetching transaction details",
            data: [],
          });
        }
        return;
      }

      if (!otpStore[id]) {
        res.status(401).json({ message: 'Invalid OTP' });
        return;
      }

      const { otp: storedOtp, timestamp } = otpStore[id];
      const timeDifference = (Date.now() - timestamp) / 1000 / 60;
      if (storedOtp === otp && timeDifference <= 5) {
        delete otpStore[id];

        const sql = "UPDATE tbl_merchant_transaction SET status = ? WHERE invoice_id = ?";
        const result = await mysqlcon(sql, [status, id]);

        if (result.affectedRows > 0) {
          const sqldata = "SELECT user_id, order_no, i_flname, i_email, ammount, txn_id, card_4_4, payin_charges, ammount_type FROM tbl_merchant_transaction WHERE invoice_id = ?";
          const resultData = await mysqlcon(sqldata, [id]);

          if (resultData.length > 0) {
            const {
              user_id,
              order_no,
              i_flname,
              i_email,
              ammount,
              txn_id,
              card_4_4,
              payin_charges,
              ammount_type
            } = resultData[0];

            const statusMessage = status === "0" ? "Failed" :
                                  status === "1" ? "Success" :
                                  status === "2" ? "Waiting" :
                                  status === "3" ? "Pending" :
                                  status === "4" ? "Refund" :
                                  status === "5" ? "ChargeBack" : "";

            await axios.post(process.env.WEBHOOK_URL || "", {
              blocks: [
                {
                  type: "section",
                  text: { type: "mrkdwn", text: `*:information_source: DEPOSIT TRANSACTION STATUS CHANGED :information_source:*` },
                },
                {
                  type: "section",
                  text: { type: "mrkdwn", text: `*Status Changed By : * ${loginuserId}\n*IP:* ${ipAddress}` },
                },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `\`\`\`Order ID: ${order_no}\nMerchant ID: ${user_id}\nCustomer Name: ${i_flname}\nCustomer Email: ${i_email}\nAmount: ${ammount}\nDate: ${formattedIST}\nStatus: ${statusMessage}\nTransaction ID: ${txn_id}\nCard: ${card_4_4}\nPayin Charges: ${payin_charges}\nAmount Type: ${ammount_type}\`\`\``,
                  },
                },
              ],
              text: "DEPOSIT TRANSACTION STATUS CHANGED",
            });

            res.status(200).json({ message: `Status ${statusMessage}`, data: result });
          } else {
            res.status(201).json({
              message: "Error while fetching transaction details",
              data: [],
            });
          }
        } else {
          res.status(201).json({
            message: "Error while Changing Status",
            data: result,
          });
        }
      } else {
        res.status(401).json({ message: 'Invalid OTP' });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "error occurred", error: error.message });
    }
  };

  async  manualCallBack(req: AuthenticatedRequest, res: Response<manualResponse>): Promise<void> {
    try {
      const otpStore: Record<string, { otp: string; expiry: number }> = {};
      const currentServerTime = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(currentServerTime.getTime() + istOffset);
      const dateTime = istTime.toISOString().slice(0, 19).replace('T', ' ');
  
      const userEmail = req.user?.email;
      const { orderNo, status, otp } = req.body;
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
      // Step 1: Generate OTP if not provided
      if (!otp) {
        const generatedOTP = generateOTP();
        const expiryTime = Date.now() + 3 * 60 * 1000;
  
        otpStore[userEmail] = { otp: generatedOTP, expiry: expiryTime };
        await sendOTP(userEmail, generatedOTP);
  
         res.send({
          message: 'OTP sent to your email. Please enter the OTP to proceed.',
        });
      }
  
      // Step 2: Validate OTP
      const otpData = otpStore[userEmail];
      if (!otpData) {
         res.status(400).send({ message: 'OTP not generated. Please try again.' });
      }
  
      const { otp: savedOTP, expiry } = otpData;
      if (Date.now() > expiry) {
        delete otpStore[userEmail];
         res.status(400).send({ message: 'OTP expired. Please request again.' });
      }
  
      if (otp !== savedOTP) {
         res.status(400).send({ message: 'Invalid OTP. Please try again.' });
      }
  
      delete otpStore[userEmail]; // Clear OTP after validation
  
      // Step 3: Process transaction
      const transactionDetails = await helpers.getTransactionDetailsByOrderNo(orderNo);
      if (!transactionDetails) {
        res.status(404).send({ message: 'Order Number not found' });
        return;
      }
  
      const userQuery = "SELECT secretkey FROM tbl_user WHERE id = ?";
      const [userDetails] = await mysqlcon(userQuery, [transactionDetails.user_id]);
      const secretKey = userDetails?.secretkey;
  
      let state = '';
      let message = '';
      let state_code = '';
  
      if (status == '1') {
        message = "Transaction success.";
        state = "SUCCESS";
        state_code = "SUCC200";
      } else if (status == '0') {
        message = "Transaction failed.";
        state = "FAILED";
        state_code = "SUCC202";
      } else {
        state = "PENDING";
        message = "Transaction pending.";
        state_code = "SUCC203";
      }
  
      const checksumString = `${transactionDetails.user_id}${transactionDetails.ammount}${state}${transactionDetails.created_on}${transactionDetails.txn_id}${secretKey}`;
      const checksum = md5(checksumString);
  
      const data = {
        orderId: orderNo,
        actualAmount: transactionDetails.ammount,
        amount: transactionDetails.ammount,
        currency: transactionDetails.ammount_type,
        transactionStatus: state,
        message: message,
        transactionTime: transactionDetails.created_on,
        statusCode: state_code,
        checksum: checksum,
      };
  
      const merchantResponse: any = { ...data };
  
      if (state === "SUCCESS" || state === "FAILED") {
        const end_point_response = await helpers.merchantPaymentStatusUpdateOnEndPoint(
          data,
          transactionDetails.end_point_url
        );
  
        const cronResult = await mysqlcon(
          `SELECT * FROM tbl_cron_log WHERE order_no = ?`,
          [transactionDetails.order_no]
        );
  
        const updatedData = {
          order_id: orderNo,
          orderAmount: transactionDetails.ammount,
          requestedAmount: transactionDetails.ammount,
          currency: transactionDetails.ammount_type,
          txStatus: state,
          txMsg: message,
          txTime: transactionDetails.created_on,
          txCode: state_code,
          checksum: checksum,
          date_time: dateTime,
          curltime: "UbankConnect",
          end_point_response: end_point_response,
          merchant_response: "Manual Callback",
          order_no: transactionDetails.order_no,
          created_on: dateTime,
        };
  
        await mysqlcon(
          `UPDATE tbl_cron_log SET data = CONCAT(COALESCE(data, ''), ?), created_on = ? WHERE order_no = ?`,
          [JSON.stringify(updatedData), dateTime, transactionDetails.order_no]
        );
      }
  
      merchantResponse.url = transactionDetails.end_point_url;
  
      // Slack Notification
      await axios.post(webhookUrl, {
        blocks: [
          {
            type: "section",
            text: { type: "mrkdwn", text: `*:information_source: MANUAL CALLBACK STATUS SEND  :information_source:*` },
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: `*Status Changed By :* ${userEmail}\n*IP:* ${ipAddress}` },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `\`\`\`Order ID: ${orderNo}\nMerchant ID: ${transactionDetails.user_id}\nCallBack Data: ${JSON.stringify(merchantResponse, null, 2)}\nCallback Url: ${transactionDetails.end_point_url}\nDate: ${dateTime}\`\`\``,
            },
          },
        ],
        text: "MANUAL CALLBACK STATUS SEND",
      });
  
      res.send(merchantResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Error occurred",
        error,
      });
    }
  }

    
}


export default new transactionMT
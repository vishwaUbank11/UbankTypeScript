import { Request, Response } from 'express';
import mysqlcon from "../config/db_connection";
import { AuthenticatedRequest } from './userInterface';
import ejs from 'ejs';
import md5 from 'md5';
import send_mail from '../helper/send-mail';
import otpGenerator from 'otp-generator';
import path from 'path';

interface User {
    id: number;
    parent_id: number;
    account_type: number;
    created_on: string;
    updated_on: string;
    [key: string]: any;
  }
  
  interface SubMerchantResponse {
    message: string;
    currentPage: number;
    totalPages: number;
    pageLimit: number;
    data: User[];
  }

  interface Submerchant {
    id: number;
    status: number;
    account_type: number;
    name: string;
    fname: string;
    lname: string;
    parent_id: number;
    email: string;
    created_on: string;
    mobile_no: string;
    allow_webpayment: number;
    settle_currency: string;
    bname: string;
    blocation: string;
    apv: string;
    ata: string;
    charge_back_per: string;
    currencies_req: string;
    job_title: string;
    website: string;
  }

  interface CreateMerchantRequest {
      FirstName: string;
      LastName: string;
      Email: string;
      SettleCurrency: string;
      MobileNo: string;
      BusinessName?: string;
      BusinessLocation?: string;
      JobTitle?: string;
      Website?: string;
      AnnualProcessingVolume?: string;
      AverageTransactionAmount?: string;
      chargebackpercentage?: string;
      CurrenciesRequire?: string;
 
  }
  
  interface MerchantDetails {
    fname: string;
    lname: string;
    email: string;
    mobile_no: string;
    parent_id: number;
    name: string;
    settle_currency: string;
    bname?: string;
    blocation?: string;
    job_title?: string;
    website?: string;
    apv?: string;
    ata?: string;
    charge_back_per?: string;
    currencies_req?: string;
    bankid: string;
    x_api_key: string;
    secretkey: string;
    account_type: number;
    password: string;
    created_on: string;
  }

const SubMerchant = {
    subMerchant : async(req: AuthenticatedRequest , res: Response):Promise<void> =>{
        try {
            const id = req.user?.id;
            if (!id) {
              res.status(401).json({ message: 'Unauthorized: No user ID found' });
            }
            const page = req.body.page ? Number(req.body.page) : 1;
            const limit = req.body.limit ? Number(req.body.limit) : 10;
            const start = (page - 1) * limit + 1;
            const end = start + limit - 1;
            const countSql = "SELECT COUNT(*) AS Total FROM tbl_user WHERE parent_id = ? AND account_type = 0";
            const countResult: { Total: number }[] = await mysqlcon(countSql, [id]);
            const total = countResult[0].Total;
            const selectSql = `SELECT tbl_user.*, DATE_FORMAT(tbl_user.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_user.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_user WHERE parent_id = ? AND account_type = 0 ORDER BY created_on DESC LIMIT ?, ?`;
            const users: User[] = await mysqlcon(selectSql, [id, start - 1, limit]);
            const rangeStart = start > total ? total : start;
            const rangeEnd = end > total ? total : end;
            const message = `Showing ${rangeStart} to ${rangeEnd} out of ${total} results`;
            const response: SubMerchantResponse = {
              message,
              currentPage: page,
              totalPages: Math.ceil(total / limit),
              pageLimit: limit,
              data: users,
            };
             res.status(200).json(response);
          } catch (error: any) {
            res.status(500).json({
              message: "Error occurred",
              error: error.message || error,
            });
          }
    },

    getIdSubmerchant : async(req: AuthenticatedRequest , res: Response):Promise<void> =>{
        try {
            const { id } = req.body;
            const sql = `SELECT id, status, account_type, name, fname, lname, parent_id, email, created_on, mobile_no, allow_webpayment, settle_currency, bname, blocation, apv, ata, charge_back_per, currencies_req, job_title, website  FROM tbl_user WHERE id = ?`;
            const result: Submerchant[] = await mysqlcon(sql, [id]);
            if (result.length > 0) {
              res.status(200).json({
                message: `Records for id = ${id}`,
                data: result,
              });
            } else {
              res.status(201).json({
                message: `No Record Found`,
                data: null,
              });
            }
        } catch (error: any) {
            res.status(500).json({
              message: "Error occurred",
              error: error.message || error,
            });
        }
    },

    createMerchant : async(req: AuthenticatedRequest, res: Response):Promise<void> =>{
        try {
            const currentUTC = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istTime = new Date(currentUTC.getTime() + istOffset);
            const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');
        
            const { id } = req.user!;
            const parent_id = id;
            const {
              FirstName,
              LastName,
              Email,
              MobileNo,
              SettleCurrency,
              BusinessName,
              BusinessLocation,
              JobTitle,
              Website,
              AnnualProcessingVolume,
              AverageTransactionAmount,
              chargebackpercentage,
              CurrenciesRequire
            } = req.body as CreateMerchantRequest;
        
            if (!FirstName || !LastName || !Email || !SettleCurrency || !MobileNo) {
             res.status(400).json({ message: "All Fields are Required" });
            }
            const secret_key = otpGenerator.generate(8, {
              upperCaseAlphabets: true,
              specialChars: false,
            });
            const x_api_key = otpGenerator.generate(8, {
              upperCaseAlphabets: true,
              specialChars: false,
            });
            const defaultPassword = Math.random().toString(36).slice();
            const Password = md5(defaultPassword);
            const details: MerchantDetails = {
              fname: FirstName,
              lname: LastName,
              email: Email,
              mobile_no: MobileNo,
              parent_id,
              name: `${FirstName} ${LastName}`,
              settle_currency: SettleCurrency,
              bname: BusinessName,
              blocation: BusinessLocation,
              job_title: JobTitle,
              website: Website,
              apv: AnnualProcessingVolume,
              ata: AverageTransactionAmount,
              charge_back_per: chargebackpercentage,
              currencies_req: CurrenciesRequire,
              bankid: "abc",
              x_api_key,
              secretkey: secret_key,
              account_type: 0,
              password: Password,
              created_on: formattedIST,
            };
            const sqlcreateMerchant = "INSERT INTO tbl_user SET ?";
            const data = await mysqlcon(sqlcreateMerchant, [details]);
            if (!data) {
              res.status(500).json({ message: 'Error in Creating Sub Merchant ❌' });
            }
            const page_path = path.join(__dirname, '../views/submerchant.ejs');
            const name = `${FirstName} ${LastName}`;
            await send_mail.mail({
              email: Email,
              mobile_no: MobileNo,
              name,
              usercode: "Sub Merchant",
              Password: defaultPassword,
              subject: "Sub Merchant Create",
            }, 'submerchant');
            res.status(200).json({ message: "Sub Merchant Added" });
        
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: "Something Went Wrong", error: error.message || error });
        }
    }


}

export default SubMerchant;
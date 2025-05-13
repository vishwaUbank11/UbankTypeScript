import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';
import md5 from 'md5';
import nodemailer from 'nodemailer';
import path from 'path';
import crypto from 'crypto'
import { sendMail } from '../helper/send-mail';
const currentUTC = new Date();
const istOffset = 5.5 * 60 * 60 * 1000; 
const istTime = new Date(currentUTC.getTime() + istOffset);
const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');

interface merchantAdminRequest{
    to?: string, 
    from?: string, 
    date?: string, 
    searchItem?: string
    limit?: string
    page? : string
}

interface updateselectRequest{
    id?:string, 
    secretName?:string, 
    value?:string
}

interface updatemerchantRequest{
    id?:string
}

interface addbankRequest {
    selectedOption: { value: string }[];
    id: string;
}

interface readOnemerRequest{
    id? : string
    data? : any
}

interface deleteMidRequest{
    id? : string
    data? : any
}

interface createRequest {
    fname: string;
    lname: string;
    email: string;
    mobile_no: string;
    bname: string;
    blocation: string;
    job_title: string;
    website: string;
    apv: string;
    ata: string;
    charge_back_per: string;
    currencies_req: string[];
}

interface updatewalletRequest{
    id? : string, 
    wallet? :string 
}

interface profileRequest{
    id? : string, 
}

interface sendMailRequest{
    email? : any
}

interface setPayinRequest{
    merNo?: string, 
    gatewayNo? : string
}

interface assignPayinRequest{
    merNo?: string, 
    gatewayNo? : string
    currency? : string,
    type? : string
}

interface assignPayoutRequest{
    merNo?: string, 
    gatewayNo? : string
    currency? : string,
}

interface DefaultInrData {
    id: string;
    gateway_name?: string;
    akontocode?: string;
    payment_gate?: string;
    bank_services_charge?: string;
    title?: string;
    code?: string;
    merchantno?: string;
    // add more fields if needed from tbl_gateway_switching
  }

interface DefaultswitchRequest{
    merchantno?: string, 
    type?: string, 
    category?: string, 
    card_type?: string
}

interface updateinrinsertRequest{
    id?: string, 
    type?: string, 
    category?: string, 
    gateways_0?: string, 
    gateways_1?: string,
    gateways_2?: string, 
    gateways_3?: string, 
    charges_0?: string, 
    charges_1?: string, 
    charges_2?: string, 
    charges_3?: string,
    bank_code?: string
}

interface BankGatewayData {
    type: number;
    id?: number;
    title?: string;
    bankcode?: string;
    payment_gate: string;
    bank_services_charge: string;
    gateway_name: string;
}

interface ubankInsertinrRequest{
    payment_type?:string, 
    bank_id? : string, 
    bankcode? : string
}

interface idRequest{
    id? : string
}

interface SetPaymentRequest {
    id: number;
    value: {
      QRCode?: number;
      UPI?: number;
      Wallet?: number;
      NetBanking?: number;
      Card?: number;
      Payout?: number;
      MidData?: number;
    };
}

interface NonINRUpdateRequest {
    merchantno?: string;
    currency?: string;
    waynumber1?: string;
    waynumber2?: string;
    waynumber3?: string;
    charge1?: string;
    charge2?: string;
    charge3?: string;
}

interface NonInrRequest {
    merchantno?: string;
    currencies?: string;
}

interface updatemerRequest{
    id?: string
}
  
class merchantAdminController{

    async merchantAdmin(req:Request<{},{},merchantAdminRequest>,res:Response):Promise<void>{
        let pagination = (total: number, page: number, limit: number) => {
            let numOfPages = Math.ceil(total / limit);
            let start = page * limit - limit;
            return { limit, start, numOfPages };
        };
        try {
            let searchItem = req.body.searchItem;
            let sql = "select count (*) as Total from tbl_user WHERE tbl_user.account_type != 3";
            let sqlCount =
            "select count (*) as Total FROM tbl_user WHERE wallet  LIKE '%" +
            searchItem +
            "%' OR  payin_upi  LIKE '%" +
            searchItem +
            "%' or  payout_neft  LIKE '%" +
            searchItem +
            "%' or  payout_imps  LIKE '%" +
            searchItem +
            "%' or  payout_rtgs  LIKE '%" +
            searchItem +
            "%' or  rolling_reverse  LIKE '%" +
            searchItem +
            "%' or  id  LIKE '%" +
            searchItem +
            "%' or  name  LIKE '%" +
            searchItem +
            "%' or  secretkey  LIKE '%" +
            searchItem +
            "%' or  sec_iv  LIKE '%" +
            searchItem +
            "%' or  test_secretkey  LIKE '%" +
            searchItem +
            "%' or  test_sec_iv  LIKE '%" +
            searchItem +
            "%'";

            // list api 👇
            let paymentSql = "select * from payment_gateway where type ='0'";
            let paymentResult = await mysqlcon(paymentSql);
            let urlSql = "select * from tbl_ingenico_mid";
            let urlResult = await mysqlcon(urlSql);
            let payoutSql = "select * from payment_gateway where type = '1'";
            let payoutResult = await mysqlcon(payoutSql);

            // list api End 👇

            let result = await mysqlcon(searchItem ? sqlCount : sql);
            let total = result[0].Total;
            let page = req.body.page ? Number(req.body.page) : 1;
            let limit = req.body.limit ? Number(req.body.limit) : 10;
            let { start, numOfPages } = pagination(total, page, limit);

            let sql1 = "SELECT tbl_user.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_user WHERE tbl_user.account_type != 3 ORDER BY created_on DESC LIMIT ?,?";
            let sql2 =
            "SELECT tbl_user.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_user  WHERE wallet  LIKE '%" +
            searchItem +
            "%' OR  payin_upi  LIKE '%" +
            searchItem +
            "%' or  payout_neft  LIKE '%" +
            searchItem +
            "%' or  payout_imps  LIKE '%" +
            searchItem +
            "%' or  payout_rtgs  LIKE '%" +
            searchItem +
            "%' or  rolling_reverse  LIKE '%" +
            searchItem +
            "%' or  id  LIKE '%" +
            searchItem +
            "%' or  name  LIKE '%" +
            searchItem +
            "%' or  secretkey  LIKE '%" +
            searchItem +
            "%' or  sec_iv  LIKE '%" +
            searchItem +
            "%' or  test_secretkey  LIKE '%" +
            searchItem +
            "%' or  test_sec_iv  LIKE '%" +
            searchItem +
            "%' LIMIT ?,?";

            let result1 = await mysqlcon(searchItem ? sql2 : sql1, [start, limit]);

            let startRange = start + 1;
            let endRange = start + result1.length;

            res.status(200).json({
                message: result1.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
                currentPage: page,
                totalPages: numOfPages,
                pageLimit: limit,
                data: result1,
                paymentResult,
                urlResult,
                payoutResult,
            });
        } catch (error) {
            res.status(500).json({
            message: "error occurered",
            error: error,
            });
        }
    }

    async updateSelectKey(req:Request<{},{},updateselectRequest>,res:Response):Promise<void>{ 
          try {
            let { id, secretName, value } = req.body;
        
            if (!id && !secretName) {
                res.status(205).json({
                    message: "Kindly Provide Id and Name🆔",
                });
            }
            if (
              secretName === "secretkey" ||
              secretName === "sec_iv" ||
              secretName === "test_secretkey" ||
              secretName === "test_sec_iv" ||
              secretName === "x_api_key"
            ) {
              value = crypto.randomBytes(8).toString("hex");
            }
        
            let sql = "UPDATE tbl_user SET " + secretName + " = ? WHERE id = ?";
        
            let result = await mysqlcon(sql, [value, id]);
            if (result) {
                res.status(200).json({
                    message: "Update Successfully✅",
                });
            }
          } catch (error) {
            console.log(error);
            res.status(500).json({
              message: "error occurered",
              error: error,
            });
        }
    }

    async countryList(req:Request,res:Response):Promise<void>{
        try {
            let sql = "SELECT id, name FROM countries ORDER BY name ASC";
        
            let result = await mysqlcon(sql);
            res.status(200).json({
                result
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "error occurered",
                error: error,
            });
        }
    }

    async updateMerchantAdmin(req:Request<updatemerchantRequest>,res:Response):Promise<void>{
          try {
        
            let { id } = req.body;
            console.log(req.body);
            // let details = {
            //   // mid: req.body.value.MID,
            //   merchant_url: req.body.value.MerchantURL,
            //   fname: req.body.value.Firstname,
            //   lname: req.body.value.Lastname,
            //   name: `${req.body.value.Firstname} ${req.body.value.Lastname}`,
            //   email: req.body.value.Email,
            //   mobile_no: req.body.value.Mobileno,
            //   bname: req.body.value.Businessname,
            //   blocation: req.body.value.Businesslocation,
            //   job_title: req.body.value.Jobtitle,
            //   website: req.body.value.Website,
            //   apv: req.body.value.AnnualProcessingVolume,
            //   ata: req.body.value.AverageTransactionAmount,
            //   charge_back_per: req.body.value.Chargebackpercentage,
            //   currencies_req: req.body.value.Currenciesrequired,
            //   settle_currency: req.body.value.SettledCurrency,
            //   mid2: req.body.value.MIDBilldesk,
            //   mkey2: req.body.value.MKEYBilldesk,
            //   mkey3: req.body.value.IsPayEncryptionKey,
            //   secure_secret: req.body.value.IsPaySecureSecret,
            //   access_code: req.body.value.IsPayAccessCode,
            //   mcc_code: req.body.value.IsPayMerchantCode,
            //   terminal_id: req.body.value.IsPayTerminalID,
            //   chargebk_down: req.body.value.ChargeBackChargesDown,
            //   chargebk_up: req.body.value.ChargeBackChargesUp,
            //   mid3: req.body.value.IsPayMerchantCode,
            //   cashfree_mid: req.body.value.CashfreeMid,
            //   cashfree_scerity_key: req.body.value.CashfreeSecretkey,
            //   mkey: req.body.value.MKEY,
            //   rolling_reverse: req.body.value.RollingReverseCharges,
            //   rolling_reverse_months: req.body.value.RollingReversemonth,
            //   refund: req.body.value.RefundChargesINR,
            //   updated_on:formattedIST,
            //   payoutCountries: req.body.value.payoutCountries,
            //   company_website_target_live_date: req.body.value.IncorporationDate,
            //   busines_Country:req.body.BusinessCountry,
            //   director1_name: req.body.value.FirstDirectorName,
            //   director1_dob: req.body.value.FirstDirectorDOB,
            //   director1_nationality:req.body.value.FirstDirectorNationality,
            //   director2_name: req.body.value.SecondDirectorName,
            //   director2_dob: req.body.value.SecondDirectorDOB,
            //   director2_nationality:req.body.value.SecondDirectorNationality,
            //   shareholder1_name: req.body.value.FirstShareholderName,
            //   shareholder1_dob: req.body.value.FirstShareholderDOB,
            //   shareholder1_nationality:req.body.value.FirstShareholderNationality,
            //   shareholder2_name: req.body.value.SecondShareholderName,
            //   shareholder2_dob: req.body.value.SecondShareholderDOB,
            //   shareholder2_nationality:req.body.value.SecondShareholderNationality,
            //   comp_officer_name: req.body.value.ComplianceOfficerName,
            //   comp_officer_email: req.body.value.ComplianceOfficerEmail,
            //   comp_officer_phone:req.body.value.ComplianceOfficerPhone,
            //   comp_officer_address:req.body.value.ComplianceOfficerAddress,
            //   bankName: req.body.value.SettledBankName,
            //   bankAddress:req.body.value.SettledBankAddress,
            //   accountNumber: req.body.value.SettledBankAccountNumber,
            //   swift: req.body.value.SettledBankSwiftCode,
            //   settle_currency:req.body.SettledBankCurrency,
            //   wallet_url: req.body.value.SettledBankWalletAddress
            // };
        
            let details = {
              merchant_url: req.body.value.MerchantURL,
              fname: req.body.value.Firstname,
              lname: req.body.value.Lastname,
              name: `${req.body.value.Firstname} ${req.body.value.Lastname}`,
              email: req.body.value.Email,
              mobile_no: req.body.value.Mobileno,
              bname: req.body.value.Businessname,
              blocation: req.body.value.Businesslocation,
              job_title: req.body.value.Jobtitle,
              website: req.body.value.Website,
              settle_currency: req.body.value.SettledCurrency,
              rolling_reverse: req.body.value.RollingReverseCharges,
              rolling_reverse_months: req.body.value.RollingReversemonth,
              refund: req.body.value.RefundChargesINR,
              updated_on:formattedIST,
              payoutCountries: req.body.value.payoutCountries,
              company_website_target_live_date: req.body.value.IncorporationDate,
              busines_Country:req.body.BusinessCountry,
              director1_name: req.body.value.FirstDirectorName,
              director1_dob: req.body.value.FirstDirectorDOB,
              director1_nationality:req.body.value.FirstDirectorNationality,
              director2_name: req.body.value.SecondDirectorName,
              director2_dob: req.body.value.SecondDirectorDOB,
              director2_nationality:req.body.value.SecondDirectorNationality,
              shareholder1_name: req.body.value.FirstShareholderName,
              shareholder1_dob: req.body.value.FirstShareholderDOB,
              shareholder1_nationality:req.body.value.FirstShareholderNationality,
              shareholder2_name: req.body.value.SecondShareholderName,
              shareholder2_dob: req.body.value.SecondShareholderDOB,
              shareholder2_nationality:req.body.value.SecondShareholderNationality,
              comp_officer_name: req.body.value.ComplianceOfficerName,
              comp_officer_email: req.body.value.ComplianceOfficerEmail,
              comp_officer_phone:req.body.value.ComplianceOfficerPhone,
              comp_officer_address:req.body.value.ComplianceOfficerAddress,
              bankName: req.body.value.SettledBankName,
              bankAddress:req.body.value.SettledBankAddress,
              accountNumber: req.body.value.SettledBankAccountNumber,
              swift: req.body.value.SettledBankSwiftCode,
              wallet_url: req.body.value.SettledBankWalletAddress
            };
        
            // let detail = {
            //   payin_upi: req.body.value1.payinUPI,
            //   payin_card: req.body.value1.PayinCard,
            //   payin_netbanking: req.body.value1.PayinNetbanking,
            //   payin_wallet: req.body.value1.PayinWallet,
            //   payin_qr: req.body.value1.PayinQR,
            //   vaoffline: req.body.value1.vaoffline,
            //   payout_amount: req.body.value1.PayoutAmount,
            //   gst_amount: req.body.value1.GstAmount,
            //   currency_id: req.body.value1.currency_id,
            //   currency_code: req.body.value1.sortname
            // };
            if (id) {
              let sql = "UPDATE tbl_user SET ? where id = ?";
              // let sqlmerchantCharges = "UPDATE tbl_merchant_charges SET ? WHERE currency_id = ?"
              let result = await mysqlcon(sql, [details, id]);
              // let resultMerchantCharges = await mysqlcon(sqlmerchantCharges, [detail, req.body.value1.currency_id])
              // if (result && resultMerchantCharges) {
              if (result) {
                res.status(200).json({
                  message: "Merchant Details Updated",
                });
              } else {
                res.status(201).json({
                  message: "Error while updating",
                });
              }
            } else {
            res.status(205).json({
                message: "Kindly Provide Id",
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

    async addBanks(req:Request<{},{},addbankRequest>,res:Response):Promise<void>{
        try {
        let {selectedOption, id} = req.body
        const values = selectedOption.map(item => item.value);
        const commaSeparatedValues = values.join(', ');
        let sql = "UPDATE tbl_user SET bankid = ? where id = ?";
        let result = await mysqlcon(sql, [commaSeparatedValues, id])
            if(result){
                res.status(200).json({
                    message: "Merchant Details Updated",
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

    async readOneMerchantAdmin(req:Request<{},{},readOnemerRequest>,res:Response):Promise<void>{
        try {
        let { id } = req.body;
        if (!id) {
            res.json(205).json({
                message: "Kindly Provide Id",
            });
        }
        let sql = "SELECT *, countries.name as incorporationCountry FROM tbl_user LEFT JOIN countries ON countries.id = tbl_user.busines_Country WHERE tbl_user.id = ?";
        let result = await mysqlcon(sql, [id]);
        
        let sql2 = "SELECT c.name, c.id,c.sortname FROM countries c INNER JOIN tbl_user u ON FIND_IN_SET(c.id,u.solution_apply_for_country) WHERE u.id=?";
        let country = await mysqlcon(sql2, [id]);
        
        let sql4 = "SELECT currency_id,payin_amount,payin_upi,payin_card,payin_netbanking,payin_wallet,payin_qr,vaoffline,payout_amount,gst_amount FROM tbl_merchant_charges WHERE user_id = ?"
        
        let rem_res = await mysqlcon(sql4, [id]);
    
    
        var countryResult = country.map((item: { id: any; sortname: any; name: any; }) => {
            return {
                currency_id: rem_res.filter((data: { currency_id: any; }) => item.id == data.currency_id).reduce((initial: any, value: { currency_id: any; }) => { return value.currency_id }, item.id),
                sortname: item.sortname,
                name: item.name,
                payinUPI: rem_res.filter((data: { currency_id: any; }) => data.currency_id == item.id).reduce((initial: any, value: { payin_upi: null; }) => { return value.payin_upi != null ? value.payin_upi : 0 }, 0),
                payinAmount: rem_res.filter((data: { currency_id: any; }) => data.currency_id == item.id).reduce((initial: any, value: { payin_amount: null; }) => { return value.payin_amount != null ? value.payin_amount : 0 }, 0),
                PayinCard: rem_res.filter((data: { currency_id: any; }) => data.currency_id == item.id).reduce((initial: any, value: { payin_card: null; }) => { return value.payin_card != null ? value.payin_card : 0 }, 0),
                PayinNetbanking: rem_res.filter((data: { currency_id: any; }) => data.currency_id == item.id).reduce((initial: any, value: { payin_netbanking: null; }) => { return value.payin_netbanking != null ? value.payin_netbanking : 0 }, 0),
                PayinWallet: rem_res.filter((data: { currency_id: any; }) => data.currency_id == item.id).reduce((initial: any, value: { payin_wallet: null; }) => { return value.payin_wallet != null ? value.payin_wallet : 0 }, 0),
                PayinQR: rem_res.filter((data: { currency_id: any; }) => data.currency_id == item.id).reduce((initial: any, value: { payin_qr: null; }) => { return value.payin_qr != null ? value.payin_qr : 0 }, 0),
                vaoffline: rem_res.filter((data: { currency_id: any; }) => data.currency_id == item.id).reduce((initial: any, value: { vaoffline: null; }) => { return value.vaoffline != null ? value.vaoffline : 0 }, 0),
                PayoutAmount: rem_res.filter((data: { currency_id: any; }) => data.currency_id == item.id).reduce((initial: any, value: { payout_amount: null; }) => { return value.payout_amount != null ? value.payout_amount : 0 }, 0),
                GstAmount: rem_res.filter((data: { currency_id: any; }) => data.currency_id == item.id).reduce((initial: any, value: { gst_amount: any; }) => { return value.gst_amount }, 0),
            }
        })
    
        let sql3 = "SELECT code as value , title as label FROM tbl_akonto_banks_code";
        let bankName = await mysqlcon(sql3);
        
        
        let selectedBank = "SELECT bankid FROM tbl_user WHERE id = ?";
        let bankTitleQuery = "SELECT title FROM tbl_akonto_banks_code WHERE code = ?";
        let selectResult = await mysqlcon(selectedBank, [id]);
        
        let bankTitles = [];
    
        if(selectResult.length>0){
            // Split the comma-separated list of bank IDs into an array
            let bankIds = selectResult[0].bankid.split(',').map((id: string) => id.trim());
    
            for (const bankId of bankIds) {
            let titleResult = await mysqlcon(bankTitleQuery, [bankId]);
                if (titleResult.length > 0) {
                    bankTitles.push(titleResult[0].title);
                }
            }
        }
    
        if (result) {
            res.status(200).json({
                message: "Data Found",
                data: result[0],
                country: countryResult,
                bankName: bankName,
                bankTitles
            });
        } else {
            res.status(201).json({
            message: "Data Not Found",
            });
        }
        } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "error occurered",
            error: error,
        });
        }
    }

    async deleteMerchantAdmin(req:Request<{},{},deleteMidRequest>,res:Response):Promise<void>{
        try {
            let { id } = req.body;
        
            let sql = "DELETE FROM tbl_user WHERE id = ?";
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

    async createMerchantAdmin(req:Request<{},{},createRequest>,res:Response):Promise<void>{
        try {
            
            let {
                fname,
                lname,
                email,
                mobile_no,
                bname,
                blocation,
                job_title,
                website,
                apv,
                ata,
                charge_back_per,
                currencies_req,
            } = req.body;
            
            let currenciesString = currencies_req.join(',');
            
            let countryIds = [];

            for (let currency of currencies_req) {
            let countrySql = "SELECT id FROM countries WHERE sortname = ?";
            let [country] = await mysqlcon(countrySql, [currency]);
                if (country && country.id) {
                    countryIds.push(country.id);
                }
            }
            
            let countryIdsString = countryIds.join(',');

            const defaultPassword = Math.random().toString(36).slice();
            const Password = md5(defaultPassword)

            let details = {
                name: fname + " " + lname,
                fname,
                lname,
                email,
                mobile_no,
                bname,
                blocation,
                job_title,
                website,
                apv,
                ata,
                charge_back_per,
                solution_apply_for_country: countryIdsString,
                currencies_req: currenciesString,
                account_type: 1,
                password: Password,
                created_on : formattedIST,
                updated_on : formattedIST
            };
        

            let sql = "INSERT INTO tbl_user SET ?";
            let result = await mysqlcon(sql, [details]);

            if (result) {
            var page_path = path.join(__dirname, '../views/submerchant.ejs');
            let name = `${req.body.fname} ${req.body.lname}`;
            await sendMail(
                {
                  email: req.body.email,
                  mobile_no: req.body.mobile_no,
                  name: name,
                  usercode: "Merchant",
                  Password: defaultPassword,
                  subject: "Merchant Created"
                },
                'Mercahnt'
              );
            res.status(200).json({
                message: "Merchant Added Successfully✅",
            });
            } else {
                res.status(201).json({
                    message: "Error While Creating",
                });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "error occurered",
                error: error,
            });
        }
    }

    async updateWallet(req:Request<{},{},updatewalletRequest>,res:Response):Promise<void>{
        try {
            let { id, wallet } = req.body;
            if (!id && !wallet) {
                res.status(205).json({
                    message: "Kindly Provide Id and Wallet",
                });
            }
            let sql = "UPDATE tbl_user SET wallet = ? where id = ?";
            let result = await mysqlcon(sql, [wallet, id]);
            if (result) {
                res.status(200).json({
                    message: "Merchant Wallet Updated Successfully✅",
                });
            } else {
                res.status(201).json({
                    message: "Data Not updated",
                });
            }
        } catch (error) {
            res.status(500).json({
            message: "error occurered",
            error: error,
            });
        }
    }

    async updateSandboxWallet(req:Request<{},{},updatewalletRequest>,res:Response):Promise<void>{
        try {
            let { id, wallet } = req.body;
            if (!id && !wallet) {
                res.status(205).json({
                    message: "Kindly Provide Id and Wallet",
                });
            }
            let sql = "UPDATE tbl_user SET sandboxwallet = ? where id = ?";
            let result = await mysqlcon(sql, [wallet, id]);
            if (result) {
                res.status(200).json({
                    message: "Merchant Sandbox Wallet Updated Successfully✅",
                });
            } else {
                res.status(201).json({
                    message: "Data Not updated",
                });
            }
        } catch (error) {
            res.status(500).json({
                message: "error occurered",
                error: error,
            });
        }
    }

    async verifyProfile(req:Request<{},{},profileRequest>,res:Response):Promise<void>{
        try {
            let {id} = req.body;
            
            let sql = "UPDATE tbl_user SET email_verification = 1 WHERE id = ?";
            let result = await mysqlcon(sql, [ id]);
            
            if (result) {
                res.status(200).json({
                    message : `Email Verified Successfully`
                });
            }else {
                res.status(201).json({
                    message: "Error while Changing email",
                });
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "error occurred",
                error: error,
            });
        }
    }

    async completeProfile(req:Request<{},{},profileRequest>,res:Response):Promise<void>{
        try {
            let {id} = req.body;
        
            let sql = "UPDATE tbl_user SET complete_profile = 1 WHERE id = ?";
            let result = await mysqlcon(sql, [id]);

            if (result) {
            res.status(200).json({
                message: `Profile Completed Successfully`
            });
            } else {
            res.status(201).json({
                message: "Error while Changing Profile",
            });
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "error occurred",
                error: error,
            });
        }
    }

    async sendMail(req:Request<{},{},sendMailRequest>,res:Response):Promise<void>{
        const {email} = req.body;
        
        try{
        const defaultPassword = Math.random().toString(36).slice();

        const sql = `UPDATE tbl_user SET password ='${md5(defaultPassword)}' WHERE email='${email}'`
        let result = await mysqlcon(sql,[email])
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
            user: "kr.manjeet319@gmail.com",
            pass: "mfvadlyccsgukabu",
            }
        });
        
        const mailOptions = {
            from: "kr.manjeet319@gmail.com",
            to: email,
            subject: 'Your new password',
            text: 'Your new password is ' + defaultPassword
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error){
                res.status(200).json({
                    message : "error",
                })
            } else {
                res.status(200).json({
                    message : "The reset password link has been sent to your email address",
                });
            }
        });

        }catch(error){
            console.log(error)
            res.status(500).json({
            message  : "error occurred"
            })
        }
    }

    async payinGateway(req:Request,res:Response):Promise<void>{
        try {
            let paymentSql = "select gateway_number, gateway_name from payment_gateway where type ='0' AND status = 1";
            let paymentResult = await mysqlcon(paymentSql);
                res.status(200).json({
                    paymentResult
                });
        } catch (error) {
            res.status(500).json({
                message: "error occurered",
                error: error,
            });
        }
    }

    async payoutGateway(req:Request,res:Response):Promise<void>{
        try {
            let payoutSql = "select id, gateway_name from payment_gateway where type = '1' AND status = 1";
            let payoutResult = await mysqlcon(payoutSql);
            res.status(200).json({
                payoutResult
            });
        } catch (error) {
            res.status(500).json({
                message: "error occurered",
                error: error,
            });
        }
    }

    async setPayinGateway(req:Request<{},{},setPayinRequest>,res:Response):Promise<void>{
        try {
            let {merNo, gatewayNo} = req.body
        
            let sqlGateway = await mysqlcon(`SELECT akontocode from tbl_code WHERE payment_gate = ${gatewayNo}`)
            let akontocode = sqlGateway[0].akontocode
            const sqlSelect = "SELECT bankId from tbl_user WHERE id = ?";
            const resultSelect = await mysqlcon(sqlSelect, [merNo]);
            if(resultSelect[0].bankId === null){
                console.log("hello", resultSelect[0].bankId);
                // let sqlUpdate = "INSERT tbl_user SET bankId = ? WHERE id = ?";
                // await mysqlcon(sqlUpdate, [akontocode, merNo]);
            } else {
                console.log("bye", resultSelect[0].bankId);
                // let sqlUpdate = "INSERT tbl_user SET bankId = ? WHERE id = ?";
                //   await mysqlcon(sqlUpdate, [akontocode, merNo]);
            }
            res.status(200).json({
                result: resultSelect[0].bankId
            });
        } catch (error) {
        res.status(500).json({
            message: "error occurered",
            error: error,
        });
        }
    }

    async assignPayinGateway(req:Request<{},{},assignPayinRequest>,res:Response):Promise<void>{
          try{
            let {merNo,gatewayNo,currency,type} = req.body;
            console.log(req.body);
            let sqlS = "SELECT * FROM gateway_detail WHERE merNo = ? AND currency = ? AND type = ?"
            let resultS = await mysqlcon(sqlS,[merNo, currency, type])
        
            let merName = "SELECT name FROM tbl_user WHERE id = ?"
            let nameResult = await mysqlcon(merName, [merNo])
        
            if (resultS.length>0){
              let details = {
                gatewayNo,
                currency,
                type
              };
              let sqlU = "UPDATE gateway_detail SET ? WHERE merNo = ? AND currency = ? AND type = ?";
              let resultU = await mysqlcon(sqlU, [details, merNo, currency, type]);
        
              // Insert or Update tbl_user
              let codeSql = await mysqlcon(`SELECT akontocode FROM tbl_code WHERE payment_gate = ${gatewayNo}`);
              let sqlSelect = "SELECT bankId from tbl_user WHERE id = ?";
              let resultSelect = await mysqlcon(sqlSelect, [merNo]);
              // return res.send(resultSelect)
              if(resultSelect[0].bankId === null){
                let insertSql = await mysqlcon(`Update tbl_user SET bankId = '${codeSql[0].akontocode}' WHERE id = ${merNo}`)
              } else {
                let bankIdArray = resultSelect[0].bankId.split(',').map((item: string) => item.trim());
                if (!bankIdArray.includes(codeSql[0].akontocode)) {
                  bankIdArray.push(codeSql[0].akontocode);
                }
                let bankIdString = bankIdArray.join(', ') + ',';
                let sqlUpdate = await mysqlcon(`UPDATE tbl_user SET bankId = '${bankIdString}' WHERE id = ${merNo}`);
              }
        
              if (resultU) {
                res.status(200).json({
                  message: `Deposit Gateway Updated For Merchant Name ${nameResult[0].name}`,
                });
              } else {
                res.status(201).json({
                  message: "Error while updating",
                });
              }
            } else{
              let detail = {
                merNo  ,
                gatewayNo,
                currency,
                type
              };
              let sqlC = "INSERT INTO gateway_detail SET ?";
              let resultC = await mysqlcon(sqlC, [detail]);
        
              // Insert or Update tbl_user
              let codeSql = await mysqlcon(`SELECT akontocode FROM tbl_code WHERE payment_gate = ${gatewayNo}`);
              let sqlSelect = "SELECT bankid from tbl_user WHERE id = ?";
              let resultSelect = await mysqlcon(sqlSelect, [merNo]);
              if(resultSelect[0].bankid === null){
                let insertSql = await mysqlcon(`UPDATE tbl_user SET bankid = '${codeSql[0].akontocode}' WHERE id = ${merNo}`)
              } else {
                let bankIdArray = resultSelect[0].bankid.split(',').map((item: string) => item.trim());
                if (!bankIdArray.includes(codeSql[0].akontocode)) {
                  bankIdArray.push(codeSql[0].akontocode);
                }
                let bankIdString = bankIdArray.join(', ');
                let sqlUpdate = await mysqlcon(`UPDATE tbl_user SET bankid = '${bankIdString}' WHERE id = ${merNo}`);
              }
              if (resultC) {
                res.status(200).json({
                  message: `Deposit Gateway Updated For Merchant Name ${nameResult[0].name}`,
                });
              } else {
                res.status(201).json({
                  message: "Error while creating",
                });
              }
            }
          }catch(error){
            console.log(error)
            res.status(500).json({
              message : "error occurred"
            })
          }
    }

    async assignPayoutGateway(req:Request<{},{},assignPayoutRequest>,res:Response):Promise<void>{
          try{
            let {merNo,gatewayNo,currency} = req.body;
            console.log(req.body)
            // return
            let sqlS = "SELECT * FROM payout_gateway_detail WHERE merNo = ? AND currency = ? AND type = 10"
            let resultS = await mysqlcon(sqlS,[merNo, currency])
        
            let merName = "SELECT name FROM tbl_user WHERE id = ?"
            let nameResult = await mysqlcon(merName, [merNo])
            if (resultS.length>0){
              let details = {
                gatewayNo,
                currency,
                type: 10
              };
              let sqlU = "UPDATE payout_gateway_detail SET ? WHERE merNo = ?";
              let resultU = await mysqlcon(sqlU, [details, merNo]);
              
              // Insert or Update tbl_user
              let codeSql = await mysqlcon(`SELECT akontocode FROM tbl_code WHERE payment_gate = ${gatewayNo}`);
              let sqlSelect = "SELECT bankid from tbl_user WHERE id = ?";
              let resultSelect = await mysqlcon(sqlSelect, [merNo]);
              if(resultSelect[0].bankid === null){
                let insertSql = await mysqlcon(`UPDATE tbl_user SET bankid = '${codeSql[0].akontocode}' WHERE id = ${merNo}`)
              } else {
                let bankIdArray = resultSelect[0].bankid.split(',').map((item: string) => item.trim());
                if (!bankIdArray.includes(codeSql[0].akontocode)) {
                  bankIdArray.push(codeSql[0].akontocode);
                }
                let bankIdString = bankIdArray.join(', ');
                let sqlUpdate = await mysqlcon(`UPDATE tbl_user SET bankid = '${bankIdString}' WHERE id = ${merNo}`);
              }
              if (resultU) {
                res.status(200).json({
                  message: `Payout Gateway Updated For Merchant Name ${nameResult[0].name}`,
                });
              } else {
                res.status(201).json({
                  message: "Error while updating",
                });
              }
            } else{
              let detail = {
                merNo,
                gatewayNo,
                currency,
                type: 10
              };
              let sqlC = "INSERT INTO payout_gateway_detail  SET ?";
              let resultC = await mysqlcon(sqlC, [detail]);
        
              // Insert or Update tbl_user
              let codeSql = await mysqlcon(`SELECT akontocode FROM tbl_code WHERE payment_gate = ${gatewayNo}`);
              let sqlSelect = "SELECT bankid from tbl_user WHERE id = ?";
              let resultSelect = await mysqlcon(sqlSelect, [merNo]);
              if(resultSelect[0].bankid === null){
                let insertSql = await mysqlcon(`UPDATE tbl_user SET bankid = '${codeSql[0].akontocode}' WHERE id = ${merNo}`)
              } else {
                let bankIdArray = resultSelect[0].bankid.split(',').map((item: string) => item.trim());
                if (!bankIdArray.includes(codeSql[0].akontocode)) {
                  bankIdArray.push(codeSql[0].akontocode);
                }
                let bankIdString = bankIdArray.join(', ');
                let sqlUpdate = await mysqlcon(`UPDATE tbl_user SET bankid = '${bankIdString}' WHERE id = ${merNo}`);
              }
              if (resultC) {
                res.status(200).json({
                  message: `Payout Gateway Updated For Merchant Name ${nameResult[0].name}`,
                });
              } else {
                res.status(201).json({
                  message: "Error while creating",
                });
              }
            }
          }catch(error){
            console.log(error)
            res.status(500).json({
              message : 'error'
            })
          }
    }

    async default_inr(req: Request<{}, {}, DefaultInrData>,res: Response): Promise<void>{
      try {
        const { id } = req.body;
    
        const sql = `
          SELECT 
            payment_gateway.gateway_name,
            tc.akontocode,
            tc.payment_gate,
            tc.bank_services_charge,
            tc.title,
            tc.code
          FROM tbl_code tc
          INNER JOIN tbl_akonto_banks_code abc ON abc.code = tc.akontocode
          INNER JOIN payment_gateway ON tc.payment_gate = payment_gateway.id
          WHERE abc.currencies = 'INR'
          GROUP BY tc.payment_gate
        `;
    
        const result: DefaultInrData[] = await mysqlcon(sql);
    
        const sql1 = "SELECT * FROM tbl_gateway_switching WHERE merchantno = ?";
        const result1: DefaultInrData[] = await mysqlcon(sql1, [id]);
    
        const groupedBanks: Record<string, { payment_gate: string; waynames: string[] }> = {};
    
        result.forEach((bank) => {
          const { gateway_name, title, bank_services_charge, payment_gate } = bank;
          if (title && gateway_name && bank_services_charge && payment_gate) {
            groupedBanks[title] = {
              payment_gate,
              waynames: [`${gateway_name}_${bank_services_charge}`],
            };
          }
        });
    
        const filteredBanks = Object.values(groupedBanks);
    
        res.status(200).json({
          filteredBanks,
          result1,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "An error occurred while processing the request",
        });
      }
    };

    async defautlSwitchingData(req:Request<{}, {}, DefaultswitchRequest>,res:Response):Promise<void>{
          try {
            let {merchantno, type, category, card_type} = req.body;
            let sql;
            if(type === "1"){
              sql = `SELECT * FROM tbl_gateway_switching WHERE merchantno = ${merchantno} AND currency = 'INR' AND type = ${type} AND category_id = ${category} AND card_type IN (${card_type})`;
            } else {
              sql = `SELECT * FROM tbl_gateway_switching WHERE merchantno = ${merchantno} AND currency = 'INR' AND type = ${type} AND category_id = ${category}`;
            }
            let result = await mysqlcon(sql)
            res.status(200).json({result})
          } catch (error) {
            console.log(error)
            res.status(500).json({
              message : 'error'
            })
          }
    }

    async update_inrInsert_inr(req:Request<{}, {}, updateinrinsertRequest>,res:Response):Promise<void>{
          try {
            let {id, type, category, gateways_0, gateways_1, gateways_2, gateways_3, charges_0, charges_1, charges_2, charges_3,bank_code} = req.body;
            let details = {
              type: type,
              category_id: category,
              gateway_1: gateways_0 ,
              gateway_2: gateways_1,
              gateway_3: gateways_2,
              gateway_4: gateways_3,
              charges_1: charges_0,
              charges_2: charges_1,
              charges_3: charges_2,
              charges_4: charges_3,
              bank_code: bank_code || null, 
              // Set bank_code to provided value or null if not provided ->
              // value = card = [1- CREDIT CARD, 2- DEBIT CARD 3- RUPAY, 4- AMERICAN EXPRESS]
              //  Ewallet = [1- paytm, 2- phonePay, 3- GooglePay, 4- Amazon Pay, 5- freecharge, 6- Mobikwik, 7- Other]
              //  netBanking = [1- Axis Bank, 2- ICICI Bank, 3- Kotak, 4- HDFC Bank, 5- State Bank Of India, 6- Yes Bank, 7- Other]
              updated_on : formattedIST,
              currency :'INR',
            };
            let detail = {
              merchantno: id,
              type: type,
              category_id: category,
              gateway_1: gateways_0 ,
              gateway_2: gateways_1,
              gateway_3: gateways_2,
              gateway_4: gateways_3,
              charges_1: charges_0,
              charges_2: charges_1,
              charges_3: charges_2,
              charges_4: charges_3,
              bank_code: bank_code || null, // Set bank_code to provided value or null if not provided
              created_on : formattedIST,
              updated_on : formattedIST,
              currency :'INR',
            };
        
            // let insertDetails;
            // let insertSql;
            // let insertResult;
        
            let sqlCheckMerchant = "SELECT merchantno FROM tbl_gateway_switching WHERE merchantno = ?";
            let resultCheckMerchant = await mysqlcon(sqlCheckMerchant, [id]);
            console.log("hello", resultCheckMerchant.length);
            // return
            if (resultCheckMerchant.length > 0) {
              // Update existing record
              let sqlUpdate = "UPDATE tbl_gateway_switching SET ? WHERE merchantno = ?";
              let resultUpdate = await mysqlcon(sqlUpdate, [details, id]);
              // insertDetails ={
              //   user_id : merchantno,
              //   title : "GateWay Updated",
              //   message: `Gateway Updated For INR Currency`,
              //   created_on: formattedIST,
              //   updated_on: formattedIST,
              //   type: 1
              // }
              // insertSql = "INSERT INTO tbl_notification SET ?"
              // insertResult = await mysqlcon(insertSql, [insertDetails])
              if (resultUpdate) {
                res.status(200).json({
                  message: 'Data updated',
                  // insertResult
                });
              } else {
                res.status(201).json({
                  message: 'Error updating data'
                });
              }
            } else {
              // Insert new record
              let sqlInsert = "INSERT INTO tbl_gateway_switching SET ?";
              let resultInsert = await mysqlcon(sqlInsert, [detail]);
        
              // insertDetails ={
              //   user_id : merchantno,
              //   title : "GateWay Updated",
              //   message: `Gateway Inserted For INR Currency`,
              //   created_on: formattedIST,
              //   updated_on: formattedIST,
              //   type: 1
              // }
              // insertSql = "INSERT INTO tbl_notification SET ?"
              // insertResult = await mysqlcon(insertSql, [insertDetails])
        
                if (resultInsert) {
                res.status(200).json({
                    message: 'Data added',
                    // insertResult
                  });
                } else {
                res.status(201).json({
                    message: 'Error inserting data'
                  });
                }
            }
          }
          catch(error){
            console.log(error);
            res.status(500).json({
              message: 'error'
            })
          }
    }
    
    async default_inr_netbankingEwallet(req: Request<{}, {}, BankGatewayData>,res: Response): Promise<void>{
        try {
            const { type } = req.body;

            const sqlEwallet = `SELECT sb.id, sb.name AS title, sba.bankcode, tc.payment_gate, tc.bank_services_charge, pg.gateway_name FROM switching_banks sb INNER JOIN switching_bank_akontocode sba ON sb.id = sba.bank_id INNER JOIN tbl_code tc ON sba.bankcode = tc.akontocode INNER JOIN payment_gateway pg ON tc.payment_gate = pg.id WHERE sb.status = 1 AND sb.type = ?`;

            const result: BankGatewayData[] = await mysqlcon(sqlEwallet, [type]);

            const categorizedBanks: Record<string, { payment_gate: string; waynames: string }[]> = {
                mobikwik: [],
                otherWallet: [],
                paytm: [],
                amazonPay: [],
                phonePay: [],
                freecharge: [],
                googlePay: [],
                axis: [],
                hdfc: [],
                icici: [],
                kotak: [],
                sbi: [],
                yes: [],
                otherNetBanking: [],
            };

            result.forEach((bank) => {
                const { gateway_name, title, bank_services_charge, payment_gate } = bank;
                const bankData = {
                    payment_gate,
                    waynames: `${gateway_name}_${bank_services_charge}`,
                };

                switch (title) {
                    case "Mobikwik":
                    categorizedBanks.mobikwik.push(bankData);
                    break;
                    case "Other Wallet":
                    categorizedBanks.otherWallet.push(bankData);
                    break;
                    case "Paytm":
                    categorizedBanks.paytm.push(bankData);
                    break;
                    case "Amazon Pay":
                    categorizedBanks.amazonPay.push(bankData);
                    break;
                    case "Phone Pay":
                    categorizedBanks.phonePay.push(bankData);
                    break;
                    case "Freecharge":
                    categorizedBanks.freecharge.push(bankData);
                    break;
                    case "Google Pay":
                    categorizedBanks.googlePay.push(bankData);
                    break;
                    case "Other Netbanking":
                    categorizedBanks.otherNetBanking.push(bankData);
                    break;
                    case "Axis":
                    categorizedBanks.axis.push(bankData);
                    break;
                    case "ICICI":
                    categorizedBanks.icici.push(bankData);
                    break;
                    case "Kotak":
                    categorizedBanks.kotak.push(bankData);
                    break;
                    case "HDFC":
                    categorizedBanks.hdfc.push(bankData);
                    break;
                    case "SBI":
                    categorizedBanks.sbi.push(bankData);
                    break;
                    case "YES":
                    categorizedBanks.yes.push(bankData);
                    break;
                }
            });
            res.status(201).json(categorizedBanks);
        } catch (error) {
            console.error(error);
            res.status(500).json({
            message: "error occurred",
            error,
            });
        }
    }

    async default_bankUbankconnect(req:Request,res:Response):Promise<void>{
        try {
            let walletSql = `SELECT abc.title, abc.code FROM tbl_akonto_banks_code abc INNER JOIN tbl_user user ON FIND_IN_SET(abc.code, user.bankid) INNER JOIN tbl_code ON abc.code = tbl_code.akontocode INNER JOIN payment_gateway ON tbl_code.payment_gate = payment_gateway.id WHERE LOWER(abc.currencies) = 'INR' AND abc.type = 1 AND abc.status = 1 GROUP BY abc.code `;
        
            let walletResult = await mysqlcon(walletSql);
        
            let netBankingSql = `SELECT abc.title, abc.code FROM tbl_akonto_banks_code abc INNER JOIN tbl_user user ON FIND_IN_SET(abc.code, user.bankid) INNER JOIN tbl_code ON abc.code = tbl_code.akontocode INNER JOIN payment_gateway ON tbl_code.payment_gate = payment_gateway.id WHERE LOWER(abc.currencies) = 'INR' AND abc.type = 0 AND abc.status = 1 GROUP BY abc.code `;
        
            let netBankingResult = await mysqlcon(netBankingSql);
            
            res.status(200).json({
              walletResult,
              netBankingResult
            });
        }catch(error){
            console.log(error);
            res.status(500).json({
                message: 'error'
            })
        }
    }

    async updateInsert_bankUbank_inr(req:Request<{}, {}, ubankInsertinrRequest>,res:Response):Promise<void>{
          try {
            let { payment_type, bank_id, bankcode} = req.body;
            let sqlbankid = "SELECT id FROM switching_banks WHERE status = 1 and id = ?";
            let result =  await mysqlcon(sqlbankid, [bank_id]);
            
            let details = {
              payment_type,
              bank_id : result[0].id,
              bankcode,
              modification_date : formattedIST,
            };
            let detail = {
              payment_type,
              bank_id : result[0].id,
              bankcode,
              creation_date: formattedIST,
              modification_date : formattedIST,
            }
            let sqlCheckMerchant = "SELECT id FROM switching_bank_akontocode WHERE id = ?";
            let resultCheckMerchant = await mysqlcon(sqlCheckMerchant, [bank_id]);
            if (resultCheckMerchant.length > 0) {
              // Update existing record
              let sqlUpdate = "UPDATE switching_bank_akontocode SET ? WHERE id = ?";
              let resultUpdate = await mysqlcon(sqlUpdate, [details, bank_id]);
              if (resultUpdate) {
                res.status(200).json({
                  message: 'Data updated'
                });
              } else {
                res.status(201).json({
                  message: 'Error updating data'
                });
              }
            } else {
              // Insert new record
              let sqlInsert = "INSERT INTO switching_bank_akontocode SET ?";
              let resultInsert = await mysqlcon(sqlInsert, [detail]);
              if (resultInsert) {
                res.status(200).json({
                  message: 'Data added'
                });
              } else {
                res.status(201).json({
                  message: 'Error inserting data'
                });
              }
            }
          }
          catch(error){
            console.log(error);
            res.status(500).json({
              message: 'error'
            })
          }
    }
    
    async NonINR(req: Request<{}, {}, NonInrRequest>, res: Response): Promise<void> {
        try {
            const { merchantno, currencies } = req.body;
        
            const sql = `SELECT tbl_akonto_banks_code.code AS Code, tbl_akonto_banks_code.title AS bankname, tbl_akonto_banks_code.type AS type, payment_gateway.gateway_name AS wayname, payment_gateway.gateway_number AS waynumber, tbl_code.bank_services_charge AS bankcharge FROM tbl_akonto_banks_code  INNER JOIN tbl_user ON FIND_IN_SET(tbl_akonto_banks_code.code, tbl_user.bankid) INNER JOIN tbl_code ON tbl_akonto_banks_code.code = tbl_code.akontocode  INNER JOIN payment_gateway ON tbl_code.payment_gate = payment_gateway.id  WHERE tbl_akonto_banks_code.currencies = ? AND tbl_user.id = ?`;
        
            const result: any[] = await mysqlcon(sql, [currencies, merchantno]);
        
            const bankDataByType: Record<string, any[]> = {
                netbanking: [],
                wallet: [],
                debitcard: [],
                creditcard: [],
                qrcode: [],
                apm: [],
            };
    
            const groupBank: Record<string, any> = {};
    
            for (const bank of result) {
                const { bankname, Code, bankcharge, wayname, waynumber, type } = bank;
    
                if (!groupBank[bankname]) {
                    groupBank[bankname] = {
                        Code,
                        type,
                        bankname,
                        waynumbers: [],
                        waynames: [],
                        typeName: this.getTypeArrayName(type),
                    };
                }
    
                groupBank[bankname].waynames.push(`${wayname}-${bankcharge}`);
                groupBank[bankname].waynumbers.push(`${Code}_${waynumber}`);
            }
    
            for (const bank of Object.values(groupBank)) {
                const { typeName } = bank;
                if (typeName && bankDataByType[typeName]) {
                bankDataByType[typeName].push(bank);
                }
            }
        
            res.status(200).json({
                data: bankDataByType,
            });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    getTypeArrayName(type: number): string {
        switch (type) {
            case 0:
            return 'netbanking';
            case 1:
            return 'wallet';
            case 5:
            return 'qrcode';
            case 6:
            return 'apm';
            default:
            return '';
        }
    }
    
    async  NonINRUpdate(req: Request<{}, {}, NonINRUpdateRequest>,res: Response): Promise<void> {
      try {
        const {
          merchantno,
          currency,
          waynumber1 = "",
          waynumber2 = "",
          waynumber3 = "",
          charge1,
          charge2,
          charge3
        } = req.body;
    
        if (!merchantno || !currency || !waynumber1 || !waynumber2 || !waynumber3) {
          res.status(400).json({ message: "Missing required fields" });
          return;
        }
    
        const checkSql = "SELECT merchantno FROM tbl_gateway_switching WHERE merchantno = ?";
        const existing = await mysqlcon(checkSql, [merchantno]);
    
        const parts1 = waynumber1.split('_');
        const parts2 = waynumber2.split('_');
        const parts3 = waynumber3.split('_');
    
        const typeText = parts1[0];
        const akontoCode = parts1[1];
        const gateway1 = parts1[2];
        const gateway2 = parts2[2];
        const gateway3 = parts3[2];
    
        let type: number;
    
        switch (typeText.toLowerCase()) {
          case "netbanking":
            type = 3;
            break;
          case "wallet":
            type = 4;
            break;
          case "qrcode":
            type = 5;
            break;
          case "creditcard":
          case "debitcard":
            type = 1;
            break;
          default:
            res.status(400).json({ message: "Invalid type in waynumber1" });
            return;
        }
    
        const payload = {
          currency,
          type,
          gateway_1: gateway1,
          gateway_2: gateway2,
          gateway_3: gateway3,
          akonto_code: akontoCode,
          charges_1: charge1,
          charges_2: charge2,
          charges_3: charge3,
          updated_on: formattedIST
        };
    
        if (existing.length > 0) {
          const updateSql = "UPDATE tbl_gateway_switching SET ? WHERE merchantno = ?";
          const resultU = await mysqlcon(updateSql, [payload, merchantno]);
    
          res.status(200).json({
            message: resultU ? "Data Updated" : "Error when updating"
          });
        } else {
          const insertSql = "INSERT INTO tbl_gateway_switching SET ?";
          const resultC = await mysqlcon(insertSql, [{
            ...payload,
            merchantno,
            created_on: formattedIST
          }]);
    
          res.status(200).json({
            message: resultC ? "Data Created" : "Error when creating"
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "error", error });
      }
    }
    
    async updateMerchantCharges(req:Request< updatemerRequest>,res:Response):Promise<void>{
          try {
            let { id } = req.body;
            
            let sqlCheckCurrency = "SELECT currency_id FROM tbl_merchant_charges WHERE user_id = ? AND currency_id = ?"
            let resultCheckCurrency = await mysqlcon(sqlCheckCurrency, [id, req.body.value1.currency_id]);
        
            if (resultCheckCurrency.length > 0){
              let detail = {
                payin_upi: req.body.value1.payinUPI,
                payin_amount: req.body.value1.payinAmount,
                payin_card: req.body.value1.PayinCard,
                payin_netbanking: req.body.value1.PayinNetbanking,
                payin_wallet: req.body.value1.PayinWallet,
                payin_qr: req.body.value1.PayinQR,
                vaoffline: req.body.value1.vaoffline,
                payout_amount: req.body.value1.PayoutAmount,
                gst_amount: req.body.value1.GstAmount,
                currency_id: req.body.value1.currency_id,
                currency_code: req.body.value1.sortname
              };
              let sqlmerchantCharges = "UPDATE tbl_merchant_charges SET ? WHERE user_id = ? AND currency_id = ?"
              let resultMerchantCharges = await mysqlcon(sqlmerchantCharges, [detail, id, req.body.value1.currency_id])
              if (resultMerchantCharges) {
                res.status(200).json({
                  message: "Payment Method Charges Updated",
                });
              } else {
                res.status(201).json({
                  message: "Error while updating",
                });
              }
            } else {
              let detail1 = {
                payin_upi: req.body.value1.payinUPI,
                payin_amount: req.body.value1.payinAmount,
                payin_card: req.body.value1.PayinCard,
                payin_netbanking: req.body.value1.PayinNetbanking,
                payin_wallet: req.body.value1.PayinWallet,
                payin_qr: req.body.value1.PayinQR,
                vaoffline: req.body.value1.vaoffline,
                payout_amount: req.body.value1.PayoutAmount,
                gst_amount: req.body.value1.GstAmount,
                currency_id: req.body.value1.currency_id,
                currency_code: req.body.value1.sortname,
                user_id: id,
                created_on: formattedIST
              };
              let sqlInsert = "INSERT INTO tbl_merchant_charges SET ?";
              let resultInsert = await mysqlcon(sqlInsert, [detail1]);
              if (resultInsert) {
                res.status(200).json({
                  message: 'Payment Method Charges Inserted'
                });
              } else {
                res.status(201).json({
                  message: 'Error inserting data'
                })
              }
            }
        
          } catch (error) {
            console.log(error)
            res.status(500).json({
              message: "error occurered",
              error: error,
            });
          }
    }

    async setPaymentMethod(req: Request<{}, {}, SetPaymentRequest>,res: Response): Promise<void> {
        try {
            const { id, value } = req.body;
        
            const updatedFields: Record<string, number> = {};
        
            if (value.QRCode !== undefined) updatedFields.allow_qr_payment = value.QRCode;
            if (value.UPI !== undefined) updatedFields.allow_upi_payment = value.UPI;
            if (value.Wallet !== undefined) updatedFields.allow_wallet_payment = value.Wallet;
            if (value.NetBanking !== undefined) updatedFields.allow_netbanking_payment = value.NetBanking;
            if (value.Card !== undefined) updatedFields.allow_card_payment = value.Card;
            if (value.Payout !== undefined) updatedFields.allow_payout = value.Payout;
            if (value.MidData !== undefined) updatedFields.data_from_mid = value.MidData;
        
            const sql = "UPDATE tbl_user SET ? WHERE id = ?";
            const result = await mysqlcon(sql, [updatedFields, id]);
        
            res.status(200).json({
                message: "Payment Mode Set Successfully",
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "error occurred",
                error: error,
            });
        }
    }

    async merchantCurrency(req:Request<{}, {}, idRequest>,res:Response):Promise<void>{
          try {
            let {id} = req.body
            const test = "SELECT solution_apply_for_country FROM tbl_user WHERE id = ?";
            const testResult = await mysqlcon(test, [id]);
            const curr = [];
        
            if (testResult.length > 0 && testResult[0].solution_apply_for_country) {
                const countryList = testResult[0].solution_apply_for_country.split(',');
                for (const country of countryList) {
                    const test1 = "SELECT sortname FROM countries WHERE id = ? ORDER BY name";
                    const test1Result = await mysqlcon(test1, [country]);
                    curr.push(test1Result[0].sortname);
                }
                res.status(200).json({
                    data: curr
                });
            } else {
                res.status(200).json({
                    message: "No currency chosen"
                });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong", error });
        }
    }

    async depositPayoutGateway(req:Request<{}, {}, idRequest>,res:Response):Promise<void>{
        try {
            let deposit = await mysqlcon(`SELECT payment_gateway.gateway_name AS gateway, gateway_detail.* FROM gateway_detail JOIN payment_gateway ON payment_gateway.gateway_number = gateway_detail.gatewayNo WHERE gateway_detail.merNo = ${req.body.id}`);
        
            let payout = await mysqlcon(`SELECT payment_gateway.gateway_name AS gateway, payout_gateway_detail.* FROM payout_gateway_detail JOIN payment_gateway ON payment_gateway.gateway_number = payout_gateway_detail.gatewayNo WHERE payout_gateway_detail.merNo = ${req.body.id}`);
        
            res.status(200).json({
                deposit,
                payout,
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong", error });
        }
    }
    
}

export default new merchantAdminController
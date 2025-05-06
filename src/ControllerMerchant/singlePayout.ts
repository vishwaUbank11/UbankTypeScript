import { Request, Response } from 'express';
import mysqlcon from "../config/db_connection";
import { format } from 'date-fns';
import md5 from "md5";
import axios from 'axios';
import { AuthenticatedRequest } from './userInterface';
const payouthelper = require("../helper/payouthelper");

interface CountryResult {
    id: number;
    sortname: string;
}

interface Merchant {
    id: string;
    end_point_url: string;
    secretkey: string;
    sec_iv: string;
    x_api_key: string;
}


const generateRandomString = (length: number): string => {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
};

const singlePayoutTransaction = {
    singlePayoutCurrency : async(req : AuthenticatedRequest, res : Response):Promise<void> =>{
        try {
            const user = req.user!;
            const ID = user.account_type === 3 ? user.parent_id! : user.id;
            const [userResult]: { solution_apply_for_country: string }[] = await mysqlcon(
              "SELECT solution_apply_for_country FROM tbl_user WHERE id = ?",
              [ID]
            );
            const options: { value: number; text: string }[] = [];
            if (userResult?.solution_apply_for_country) {
              const countryList = userResult.solution_apply_for_country.split(",");
              for (const country of countryList) {
                    const [countryResult]: CountryResult[] = await mysqlcon("SELECT id, sortname FROM countries WHERE id = ? ORDER BY name",
                    [country] );
                    if (countryResult) {
                    options.push({
                        value: countryResult.id,
                        text: countryResult.sortname,
                    });
                    }
                }
               options.sort((a, b) => a.text.localeCompare(b.text));
            }
            const user_id = ID.toString();
            const formatted_time = format(new Date(), 'HH:mm:ss');
            const transactionId = user_id + generateRandomString(1) + md5(formatted_time);
            res.status(200).json({
              data: options,
              transactionId,
              wallet_amount: user.wallet,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Something went wrong", error });
        }

    },

    singlePayoutBankcodes : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        try {
            const user = req.user!;
            const ID = user.account_type === 3 ? user.parent_id! : user.id;
            const sql = `SELECT payment_gateway.gateway_name, gatewayNo FROM payout_gateway_detail INNER JOIN payment_gateway ON payment_gateway.id = payout_gateway_detail.gatewayNo WHERE payout_gateway_detail.merNo = ? AND payout_gateway_detail.currency = ?`;
            const testResult = await mysqlcon(sql, [ID, req.body.currency]);
            res.status(200).json({
              data: testResult,
            });
        } catch (error) {
            res.status(500).json({ message: 'Something went wrong', error });
        }
    },

    singlePayoutPayment : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        try {
            const user = req.user!;
            let ID: number;
            let secretKey: string;
            if (user.account_type === 3) {
              ID = user.parent_id!;
              const [parentUser]: { secretkey: string }[] = await mysqlcon(`SELECT secretkey FROM tbl_user WHERE parent_id = ?`, [ID]);
              secretKey = parentUser.secretkey;
            } else {
              ID = user.id;
              secretKey = user.secretkey!;
            }
            const userid = ID;
            if (!userid) {
              res.status(400).json({ message: 'Unable to create a payout transaction. No user selected for payout.' });
            }
            const merchant: Merchant[] = await payouthelper.getDetail(userid, secretKey);
            if (!merchant || merchant.length === 0) {
              res.status(400).json({ message: 'Merchant not found.' });
            }
            const end_point_url = merchant[0].end_point_url;
            if (!end_point_url.trim()) {
              res.status(400).json({ message: 'Unable to create a payout transaction. End URL is not set.' });
            }
            let jrequest = '';
            let url = '';
            if (req.body.currency && req.body.currency.toUpperCase().trim() === 'INR') {
              jrequest = JSON.stringify([{
                order_id: req.body.uniqueid,
                bank: req.body.bankcode || 'NOCode',
                trx_type: req.body.txn_type,
                payeename: req.body.customer_name,
                bnf_nick_name: req.body.customer_name,
                amount: req.body.amount,
                account_no: req.body.creditacc,
                ifsc: req.body.ifsc_code,
                address1: req.body.address,
                city: req.body.city,
                state: req.body.address,
                pincode: req.body.pincode,
                email: req.body.email,
                phone: req.body.phone
              }]);
              url = 'https://api.bankconnect.live/payoutNonInr';
            } else {
              jrequest = JSON.stringify([{
                transactionID: req.body.uniqueid,
                memberID: merchant[0].id,
                currencyCode: req.body.currency,
                bankCode: req.body.bankcode || 'NOCode',
                cardNumber: req.body.creditacc,
                accountHolderFirstName: req.body.customer_name,
                toProvince: req.body.address,
                toCity: req.body.city,
                toBranch: req.body.branch,
                toAddress: req.body.address,
                email: req.body.email,
                mobileNumber: req.body.phone,
                amount: req.body.amount,
                payoutDescription: req.body.remark,
                optional: {
                  accountType: 'CHECKING',
                  method: 'bank-transfer-br',
                  documentNumber: '21532652313',
                  documentType: 'CPF',
                  region: 'Amazonas'
                }
              }]);
              url = 'http://localhost:9240/v2/payments/payout';
            }
            const enc_data = await payouthelper.encryptValue(jrequest, userid, merchant[0].secretkey, merchant[0].sec_iv);
            const utoken = Buffer.from(`${userid}::${merchant[0].secretkey}`).toString('base64');
            const data1 = {
              endpointUrl: end_point_url,
              encryptedPayoutRequest: enc_data,
              callbackUrl: 'https://homeofbulldogs.com/dev/pay-form/wp-callback/wp-callback.php',
            };
            const req_data = JSON.stringify(data1);
            const resdata = JSON.parse(req_data);
            const config = {
              method: 'post',
              maxBodyLength: Infinity,
              url: 'http://localhost:9240/v2/payments/payout',
              headers: {
                'x-api-key': merchant[0].x_api_key,
                'user-token': utoken
              },
              data: resdata,
            };
            const response = await axios.request(config);
            res.status(200).json(response.data);
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : "Unknown error";
            res.status(500).json({
              message: 'Error occurred',
              error: errMsg
            });
        }
    }

}

export default singlePayoutTransaction
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_connection_1 = __importDefault(require("../config/db_connection"));
const date_fns_1 = require("date-fns");
const md5_1 = __importDefault(require("md5"));
const axios_1 = __importDefault(require("axios"));
const payouthelper = require("../helper/payouthelper");
const generateRandomString = (length) => {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
};
const singlePayoutTransaction = {
    singlePayoutCurrency: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = req.user;
            const ID = user.account_type === 3 ? user.parent_id : user.id;
            const [userResult] = yield (0, db_connection_1.default)("SELECT solution_apply_for_country FROM tbl_user WHERE id = ?", [ID]);
            const options = [];
            if (userResult === null || userResult === void 0 ? void 0 : userResult.solution_apply_for_country) {
                const countryList = userResult.solution_apply_for_country.split(",");
                for (const country of countryList) {
                    const [countryResult] = yield (0, db_connection_1.default)("SELECT id, sortname FROM countries WHERE id = ? ORDER BY name", [country]);
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
            const formatted_time = (0, date_fns_1.format)(new Date(), 'HH:mm:ss');
            const transactionId = user_id + generateRandomString(1) + (0, md5_1.default)(formatted_time);
            res.status(200).json({
                data: options,
                transactionId,
                wallet_amount: user.wallet,
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Something went wrong", error });
        }
    }),
    singlePayoutBankcodes: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = req.user;
            const ID = user.account_type === 3 ? user.parent_id : user.id;
            const sql = `SELECT payment_gateway.gateway_name, gatewayNo FROM payout_gateway_detail INNER JOIN payment_gateway ON payment_gateway.id = payout_gateway_detail.gatewayNo WHERE payout_gateway_detail.merNo = ? AND payout_gateway_detail.currency = ?`;
            const testResult = yield (0, db_connection_1.default)(sql, [ID, req.body.currency]);
            res.status(200).json({
                data: testResult,
            });
        }
        catch (error) {
            res.status(500).json({ message: 'Something went wrong', error });
        }
    }),
    singlePayoutPayment: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = req.user;
            let ID;
            let secretKey;
            if (user.account_type === 3) {
                ID = user.parent_id;
                const [parentUser] = yield (0, db_connection_1.default)(`SELECT secretkey FROM tbl_user WHERE parent_id = ?`, [ID]);
                secretKey = parentUser.secretkey;
            }
            else {
                ID = user.id;
                secretKey = user.secretkey;
            }
            const userid = ID;
            if (!userid) {
                res.status(400).json({ message: 'Unable to create a payout transaction. No user selected for payout.' });
            }
            const merchant = yield payouthelper.getDetail(userid, secretKey);
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
            }
            else {
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
            const enc_data = yield payouthelper.encryptValue(jrequest, userid, merchant[0].secretkey, merchant[0].sec_iv);
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
            const response = yield axios_1.default.request(config);
            res.status(200).json(response.data);
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : "Unknown error";
            res.status(500).json({
                message: 'Error occurred',
                error: errMsg
            });
        }
    })
};
exports.default = singlePayoutTransaction;

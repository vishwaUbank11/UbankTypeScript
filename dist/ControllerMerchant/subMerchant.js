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
const md5_1 = __importDefault(require("md5"));
const send_mail_1 = __importDefault(require("../helper/send-mail"));
const otp_generator_1 = __importDefault(require("otp-generator"));
const path_1 = __importDefault(require("path"));
const SubMerchant = {
    subMerchant: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!id) {
                res.status(401).json({ message: 'Unauthorized: No user ID found' });
            }
            const page = req.body.page ? Number(req.body.page) : 1;
            const limit = req.body.limit ? Number(req.body.limit) : 10;
            const start = (page - 1) * limit + 1;
            const end = start + limit - 1;
            const countSql = "SELECT COUNT(*) AS Total FROM tbl_user WHERE parent_id = ? AND account_type = 0";
            const countResult = yield (0, db_connection_1.default)(countSql, [id]);
            const total = countResult[0].Total;
            const selectSql = `SELECT tbl_user.*, DATE_FORMAT(tbl_user.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_user.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_user WHERE parent_id = ? AND account_type = 0 ORDER BY created_on DESC LIMIT ?, ?`;
            const users = yield (0, db_connection_1.default)(selectSql, [id, start - 1, limit]);
            const rangeStart = start > total ? total : start;
            const rangeEnd = end > total ? total : end;
            const message = `Showing ${rangeStart} to ${rangeEnd} out of ${total} results`;
            const response = {
                message,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                pageLimit: limit,
                data: users,
            };
            res.status(200).json(response);
        }
        catch (error) {
            res.status(500).json({
                message: "Error occurred",
                error: error.message || error,
            });
        }
    }),
    getIdSubmerchant: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.body;
            const sql = `SELECT id, status, account_type, name, fname, lname, parent_id, email, created_on, mobile_no, allow_webpayment, settle_currency, bname, blocation, apv, ata, charge_back_per, currencies_req, job_title, website  FROM tbl_user WHERE id = ?`;
            const result = yield (0, db_connection_1.default)(sql, [id]);
            if (result.length > 0) {
                res.status(200).json({
                    message: `Records for id = ${id}`,
                    data: result,
                });
            }
            else {
                res.status(201).json({
                    message: `No Record Found`,
                    data: null,
                });
            }
        }
        catch (error) {
            res.status(500).json({
                message: "Error occurred",
                error: error.message || error,
            });
        }
    }),
    createMerchant: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const currentUTC = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istTime = new Date(currentUTC.getTime() + istOffset);
            const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');
            const { id } = req.user;
            const parent_id = id;
            const { FirstName, LastName, Email, MobileNo, SettleCurrency, BusinessName, BusinessLocation, JobTitle, Website, AnnualProcessingVolume, AverageTransactionAmount, chargebackpercentage, CurrenciesRequire } = req.body;
            if (!FirstName || !LastName || !Email || !SettleCurrency || !MobileNo) {
                res.status(400).json({ message: "All Fields are Required" });
            }
            const secret_key = otp_generator_1.default.generate(8, {
                upperCaseAlphabets: true,
                specialChars: false,
            });
            const x_api_key = otp_generator_1.default.generate(8, {
                upperCaseAlphabets: true,
                specialChars: false,
            });
            const defaultPassword = Math.random().toString(36).slice();
            const Password = (0, md5_1.default)(defaultPassword);
            const details = {
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
            const data = yield (0, db_connection_1.default)(sqlcreateMerchant, [details]);
            if (!data) {
                res.status(500).json({ message: 'Error in Creating Sub Merchant ❌' });
            }
            const page_path = path_1.default.join(__dirname, '../views/submerchant.ejs');
            const name = `${FirstName} ${LastName}`;
            yield send_mail_1.default.mail({
                email: Email,
                mobile_no: MobileNo,
                name,
                usercode: "Sub Merchant",
                Password: defaultPassword,
                subject: "Sub Merchant Create",
            }, 'submerchant');
            res.status(200).json({ message: "Sub Merchant Added" });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Something Went Wrong", error: error.message || error });
        }
    })
};
exports.default = SubMerchant;

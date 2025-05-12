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
const send_mail_1 = __importDefault(require("../helper/send-mail"));
const md5_1 = __importDefault(require("md5"));
const otp_generator_1 = __importDefault(require("otp-generator"));
const email_validator_1 = __importDefault(require("email-validator"));
const MerchantTeam = {
    default: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { id, searchText, to, from, From, To, page = 1, limit = 10 } = req.body;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        try {
            const merchantIdArray = id ? id.split(',') : [ID];
            const pagination = (total, page, limit) => {
                const numOfPages = Math.ceil(total / limit);
                const start = (page - 1) * limit;
                return { limit, start, numOfPages };
            };
            const formattedDateFields = `DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on`;
            let baseQuery = `SELECT *, ${formattedDateFields} FROM tbl_user WHERE account_type = 3 AND parent_id IN (${merchantIdArray.map(() => '?').join(', ')})`;
            let countQuery = `SELECT COUNT(*) AS Total FROM tbl_user WHERE account_type = 3 AND parent_id IN (${merchantIdArray.map(() => '?').join(', ')})`;
            const queryValues = [...merchantIdArray];
            const conditions = [];
            if (to && from) {
                conditions.push('DATE(created_on) BETWEEN ? AND ?');
                queryValues.push(from, to);
            }
            if (To && From) {
                conditions.push('DATE(updated_on) BETWEEN ? AND ?');
                queryValues.push(From, To);
            }
            if (searchText) {
                conditions.push('(order_no LIKE ? OR txn_id LIKE ?)');
                queryValues.push(`%${searchText}%`, `%${searchText}%`);
            }
            if (conditions.length > 0) {
                const conditionStr = ' AND ' + conditions.join(' AND ');
                baseQuery += conditionStr;
                countQuery += conditionStr;
            }
            const countResult = yield (0, db_connection_1.default)(countQuery, queryValues);
            const total = countResult[0].Total;
            const { start, numOfPages } = pagination(total, page, limit);
            baseQuery += ` ORDER BY created_on DESC LIMIT ?, ?`;
            const finalQueryValues = [...queryValues, start, limit];
            const resultData = yield (0, db_connection_1.default)(baseQuery, finalQueryValues);
            const startRange = start + 1;
            const endRange = Math.min(start + limit, total);
            res.json({
                message: resultData.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : 'NO DATA',
                currentPage: page,
                totalPages: numOfPages || 1,
                pageLimit: limit,
                data: resultData,
                userRefund: user.refund,
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Server Error',
                error: error.message || error,
            });
        }
    }),
    createEmployee: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const currentUTC = new Date();
            const istTime = new Date(currentUTC.getTime() + 5.5 * 60 * 60 * 1000);
            const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');
            const user = req.user;
            const parentID = user.account_type === 3 ? user.parent_id : user.id;
            const { id = parentID, email, mobile_no, fname, lname, usercode, } = req.body;
            if (!email || !email_validator_1.default.validate(email)) {
                res.status(201).json({ message: "Email Not Valid/Correct" });
            }
            const emailCheckQuery = `SELECT email FROM tbl_user WHERE parent_id = ? AND email = ? AND account_type = 3`;
            const existingEmail = yield (0, db_connection_1.default)(emailCheckQuery, [id, email]);
            if (existingEmail.length > 0) {
                res.status(201).json({ message: "Employee Email Already Exist" });
            }
            const mobileCheckQuery = `SELECT mobile_no FROM tbl_user WHERE parent_id = ? AND mobile_no = ? AND account_type = 3`;
            const existingMobile = yield (0, db_connection_1.default)(mobileCheckQuery, [id, mobile_no]);
            if (existingMobile.length > 0) {
                res.status(201).json({ message: "Employee Mobile Number Already Exist" });
            }
            const defaultPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = (0, md5_1.default)(defaultPassword);
            const verification_token = otp_generator_1.default.generate(8, { upperCaseAlphabets: true, specialChars: false, });
            const name = `${fname} ${lname}`;
            const newEmployee = {
                email,
                fname,
                lname,
                mobile_no,
                name,
                created_on: formattedIST,
                updated_on: formattedIST,
                parent_id: id,
                usercode,
                status: 0,
                password: hashedPassword,
                account_type: 3,
                complete_profile: 1,
                verification_token,
            };
            const insertQuery = "INSERT INTO tbl_user SET ?";
            const insertResult = yield (0, db_connection_1.default)(insertQuery, newEmployee);
            if (!insertResult) {
                res.status(201).json({ message: "Error in Adding Employee" });
            }
            const roleNames = {
                1: "Administrator",
                2: "Manager",
                3: "Cashier",
                4: "Reporter",
            };
            const roleName = roleNames[usercode] || "Employee";
            send_mail_1.default.mail({
                email,
                mobile_no,
                name,
                usercode: roleName,
                password: defaultPassword,
                subject: "Team Create",
            }, 'employee');
            res.status(200).json({ message: "Employee Added. Please Wait...." });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                message: "An error occurred",
                error: error.message || error
            });
        }
    }),
    getTeamDetails: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.body;
            const sql = "SELECT * FROM tbl_user WHERE id = ?";
            const result = yield (0, db_connection_1.default)(sql, [id]);
            res.status(200).json({
                result: result[0] || null
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                message: "error occurred",
                error: error.message || error
            });
        }
    }),
    teamEditDetails: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id, fname = '', lname = '', email = '', mobile_no = '', usercode = '', } = req.body;
            if (!id) {
                res.status(400).json({ message: "User ID is required." });
            }
            const currentUTC = new Date();
            const istTime = new Date(currentUTC.getTime() + 5.5 * 60 * 60 * 1000);
            const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');
            const updated_on = formattedIST;
            const name = `${fname} ${lname}`.trim();
            const updateData = { fname, lname, email, mobile_no, usercode, updated_on, name, };
            const sql = "UPDATE tbl_user SET ? WHERE id = ?";
            const result = yield (0, db_connection_1.default)(sql, [updateData, id]);
            if (result.affectedRows > 0) {
                res.status(200).json({
                    message: "Employee details updated successfully.",
                    data: result,
                });
            }
            else {
                res.status(404).json({
                    message: "No matching record found to update.",
                    data: result,
                });
            }
        }
        catch (error) {
            console.error("Update Error:", error);
            res.status(500).json({
                message: "An error occurred while updating team details.",
                error: error.message || error,
            });
        }
    }),
    deleteTeam: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.body;
            if (!id) {
                res.status(400).json({ message: "ID is required." });
            }
            const sql = "DELETE FROM tbl_user WHERE id = ?";
            const result = yield (0, db_connection_1.default)(sql, [id]);
            if ((result === null || result === void 0 ? void 0 : result.affectedRows) > 0) {
                res.status(200).json({
                    message: "Team Member Deleted Successfully✅",
                });
            }
            else {
                res.status(404).json({
                    message: "No matching record found to delete.",
                });
            }
        }
        catch (error) {
            res.status(500).json({
                message: "An error occurred during deletion.",
                error: error.message || error,
            });
        }
    }),
    verifyTeam: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.body;
            if (!id) {
                res.status(400).json({ message: "ID is required." });
            }
            const sql = "UPDATE tbl_user SET status = 1 WHERE id = ?";
            const result = yield (0, db_connection_1.default)(sql, [id]);
            if ((result === null || result === void 0 ? void 0 : result.affectedRows) > 0) {
                res.status(200).json({
                    message: "Team Member Verified Successfully",
                });
            }
            else {
                res.status(404).json({
                    message: "No matching team member found to verify.",
                });
            }
        }
        catch (error) {
            console.error("Verification Error:", error);
            res.status(500).json({
                message: "An error occurred during verification.",
                error: error.message || error,
            });
        }
    }),
    getEmployeePermission: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.body;
            const modules = {
                submerchant: "Sub Merchant",
                deposits: "Deposits",
                payouts: "Payouts",
                refund_chargebacks: "Refunds/Chargebacks",
                single_payout: "Single Payout",
                settlements: "Settlements",
                wallet_logs: "Wallet Logs",
                reports: "Reports",
                sandbox: "SandBox Module",
                statements: "Statements",
                teams: "Teams",
                buisness_setting: "Buisness Setting",
            };
            const sql1 = "SELECT name, email FROM tbl_user WHERE id = ?";
            const userDetails = yield (0, db_connection_1.default)(sql1, [id]);
            const sql2 = `SELECT module, m_add, m_edit, m_delete, m_view, m_download, status FROM tbl_employee_action WHERE user_id = ?`;
            const permissions = yield (0, db_connection_1.default)(sql2, [id]);
            const output = [];
            const moduleNames = Object.values(modules);
            for (const module of moduleNames) {
                const match = permissions.find((perm) => perm.module === module);
                if (match) {
                    output.push(match);
                }
                else {
                    output.push({
                        module,
                        m_add: 0,
                        m_edit: 0,
                        m_delete: 0,
                        m_view: 0,
                        m_download: 0,
                        status: 0,
                    });
                }
            }
            if (userDetails.length > 0) {
                res.status(200).json({
                    message: `Permission for ${userDetails[0].name}`,
                    details: userDetails,
                    permissions: output,
                });
            }
            else {
                res.status(404).json({
                    message: "No SubAdmin Found",
                    details: [],
                    permissions: output,
                });
            }
        }
        catch (error) {
            console.error("Permission Error:", error);
            res.status(500).json({
                message: "An error occurred while fetching permissions.",
                error: error.message || error,
            });
        }
    }),
    permissionEmployee: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id, actionData } = req.body;
            const modules = {
                submerchant: "Sub Merchant",
                deposits: "Deposits",
                payouts: "Payouts",
                refund_chargebacks: "Refunds/Chargebacks",
                single_payout: "Single Payout",
                settlements: "Settlements",
                wallet_logs: "Wallet Logs",
                reports: "Reports",
                sandbox: "SandBox Module",
                statements: "Statements",
                teams: "Teams",
                buisness_setting: "Buisness Setting",
            };
            let result;
            for (const action of actionData) {
                const moduleName = modules[action.id];
                if (!moduleName)
                    continue;
                const details = {
                    user_id: id,
                    module: moduleName,
                    m_add: action.permissions.add ? 1 : 0,
                    m_edit: action.permissions.edit ? 1 : 0,
                    m_view: action.permissions.view ? 1 : 0,
                    m_delete: action.permissions.delete ? 1 : 0,
                    m_download: action.permissions.download ? 1 : 0,
                    status: action.enabled ? 1 : 0,
                };
                const sqlCheck = "SELECT * FROM tbl_employee_action WHERE user_id = ? AND module = ?";
                const resultCheck = yield (0, db_connection_1.default)(sqlCheck, [id, moduleName]);
                if (resultCheck.length > 0) {
                    const sqlUpdate = "UPDATE tbl_employee_action SET ? WHERE user_id = ? AND module = ?";
                    result = yield (0, db_connection_1.default)(sqlUpdate, [details, id, moduleName]);
                }
                else {
                    const sqlInsert = "INSERT INTO tbl_employee_action SET ?";
                    result = yield (0, db_connection_1.default)(sqlInsert, [details]);
                }
            }
            if (result && result.affectedRows > 0) {
                res.status(200).json({
                    message: "Employee Permission Updated",
                    data: result,
                });
            }
            else {
                res.status(400).json({
                    message: "Error while Creating/Updating",
                    data: result,
                });
            }
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                message: "An error occurred",
                error: error.message || error,
            });
        }
    })
};
exports.default = MerchantTeam;

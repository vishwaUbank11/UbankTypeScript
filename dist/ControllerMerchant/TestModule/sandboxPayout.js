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
const db_connection_1 = __importDefault(require("../../config/db_connection"));
const TestsandboxPayout = {
    sandboxPayoutsDefault: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const user = req.user;
        const { id, uniqueid, Date: inputDate, from, to, filterType = 1, page = 1 } = req.body;
        const limit = 10;
        const start = (page - 1) * limit;
        const merchantIdArray = id ? id.split(',') : [(_a = user === null || user === void 0 ? void 0 : user.id) === null || _a === void 0 ? void 0 : _a.toString()];
        const filter = Number(filterType);
        const innerJoin = `INNER JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id`;
        let sqlCount = '';
        let sqlData = '';
        let arrCount = [];
        let arrData = [];
        try {
            switch (filter) {
                case 1:
                    sqlCount = `SELECT COUNT(*) AS Total FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE users_id IN (?)`;
                    arrCount = [merchantIdArray];
                    sqlData = `SELECT *, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE users_id IN (?) ORDER BY created_on DESC LIMIT ?, ?`;
                    arrData = [merchantIdArray, start, limit];
                    break;
                case 2:
                    sqlCount = `SELECT COUNT(*) AS Total FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE users_id IN (?) AND uniqueid LIKE ?`;
                    arrCount = [merchantIdArray, uniqueid + '%'];
                    sqlData = `SELECT *, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE users_id IN (?) AND uniqueid LIKE ? ORDER BY created_on DESC`;
                    arrData = [merchantIdArray, uniqueid + '%'];
                    break;
                case 3:
                    sqlCount = `SELECT COUNT(*) AS Total FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE DATE(created_on) = ? AND users_id IN (?)`;
                    arrCount = [inputDate, merchantIdArray];
                    sqlData = `SELECT *, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_icici_payout_transaction_sandbox_response_details  ${innerJoin}  WHERE DATE(created_on) = ? AND users_id IN (?) ORDER BY created_on DESC LIMIT ?, ?`;
                    arrData = [inputDate, merchantIdArray, start, limit];
                    break;
                case 4:
                    sqlCount = `SELECT COUNT(*) AS Total FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE DATE(created_on) BETWEEN ? AND ? AND users_id IN (?)`;
                    arrCount = [from, to, merchantIdArray];
                    sqlData = `SELECT *, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE DATE(created_on) BETWEEN ? AND ? AND users_id IN (?) ORDER BY created_on DESC LIMIT ?, ?`;
                    arrData = [from, to, merchantIdArray, start, limit];
                    break;
                default:
                    res.status(400).json({ message: 'Invalid filter type.' });
            }
            const countResult = yield (0, db_connection_1.default)(sqlCount, arrCount);
            const total = ((_b = countResult[0]) === null || _b === void 0 ? void 0 : _b.Total) || 0;
            const totalPage = Math.ceil(total / limit);
            const dataResult = yield (0, db_connection_1.default)(sqlData, arrData);
            if (dataResult.length === 0) {
                res.status(201).json({
                    message: 'No record found.',
                    data: [],
                });
            }
            const startRange = start + 1;
            const endRange = start + dataResult.length;
            res.status(200).json({
                Status: 'success',
                currPage: page,
                message: `Showing ${startRange} to ${endRange} data from ${total}`,
                totalPage,
                data: dataResult,
            });
        }
        catch (error) {
            console.error('Error in sandboxPayoutsDefault:', error);
            res.status(500).json({
                Status: 'failed',
                message: 'Internal server error',
                error: error.message,
            });
        }
    }),
    sandboxPayoutheader: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const { id } = req.body;
        const user = req.user;
        if (!user) {
            res.status(401).json({ status: false, message: "Unauthorized user" });
        }
        try {
            const userId = id || user.id;
            const sql = `SELECT SUM(amount) AS amount FROM tbl_icici_payout_transaction_sandbox_response_details WHERE users_id = ? AND status = ?`;
            const [successData, declinedData, pendingData] = yield Promise.all([(0, db_connection_1.default)(sql, [userId, "SUCCESS"]), (0, db_connection_1.default)(sql, [userId, "FAILURE"]), (0, db_connection_1.default)(sql, [userId, "PENDING"])]);
            const success = ((_a = successData[0]) === null || _a === void 0 ? void 0 : _a.amount) || 0;
            const failure = ((_b = declinedData[0]) === null || _b === void 0 ? void 0 : _b.amount) || 0;
            const pending = ((_c = pendingData[0]) === null || _c === void 0 ? void 0 : _c.amount) || 0;
            const responseData = [
                { name: "Success", amount: success },
                { name: "Declined", amount: failure },
                { name: "Pending", amount: pending },
                { name: "Total Payout", amount: user.wallet || 0 }
            ];
            res.status(200).json({
                message: "All Payout header Data",
                data: responseData
            });
        }
        catch (error) {
            console.error("Error in sandboxPayoutheader:", error);
            res.status(500).json({ status: false, message: "Some error occurred", error: error.message });
        }
    }),
    downloadSandboxPayoutReport: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { uniqueid, from, to, id } = req.body;
        if (!user) {
            res.status(401).json({ status: false, message: "Unauthorized user", data: [] });
            return;
        }
        try {
            const userId = id || user.id;
            let sql = '';
            let params = [];
            if (uniqueid !== undefined) {
                sql = `SELECT * FROM tbl_icici_payout_transaction_sandbox_response_details WHERE uniqueid IN (?) AND users_id = ?`;
                params = [uniqueid, userId];
            }
            else if (from && to) {
                sql = `SELECT * FROM tbl_icici_payout_transaction_sandbox_response_details WHERE users_id = ? AND DATE(created_on) >= ? AND DATE(created_on) <= ?`;
                params = [userId, from, to];
            }
            else {
                sql = `SELECT * FROM tbl_icici_payout_transaction_sandbox_response_details WHERE users_id = ?`;
                params = [userId];
            }
            const result = yield (0, db_connection_1.default)(sql, params);
            res.send(result);
        }
        catch (error) {
            console.error("Error in downloadSandboxPayoutReport:", error);
            res.status(500).json({ status: false, message: "Some error occurred", data: [] });
        }
    })
};
exports.default = TestsandboxPayout;

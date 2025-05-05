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
const pagination = (total, page) => {
    const limit = 10;
    const numOfPages = Math.ceil(total / limit);
    const start = page * limit - limit;
    return { limit, start, numOfPages };
};
const SettlementTransaction = {
    //➡️ International Settlement
    settlemetnt_Trans: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const user = req.user;
        const { id, from, to, date, settlementId, page: pageNum } = req.body;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        try {
            const Page = pageNum ? Number(pageNum) : 1;
            let total = 0;
            let data = [];
            if (id) {
                const merchantIdArray = id.split(',').map(Number);
                let countQuery = "SELECT COUNT(*) as count FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 1";
                const countResult = yield (0, db_connection_1.default)(countQuery, [merchantIdArray]);
                if (settlementId) {
                    const countSql = "SELECT COUNT(*) as Total FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 1 AND settlementId LIKE ?";
                    const result = yield (0, db_connection_1.default)(countSql, [merchantIdArray, `${settlementId}%`]);
                    total = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.Total) || 0;
                }
                else if (date) {
                    const countSql = "SELECT COUNT(*) as Total FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2 AND DATE(created_on) >= ?";
                    const result = yield (0, db_connection_1.default)(countSql, [merchantIdArray, date]);
                    total = ((_b = result[0]) === null || _b === void 0 ? void 0 : _b.Total) || 0;
                }
                else if (from && to) {
                    const countSql = "SELECT COUNT(*) as Total FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2 AND DATE(created_on) BETWEEN ? AND ?";
                    const result = yield (0, db_connection_1.default)(countSql, [merchantIdArray, from, to]);
                    total = ((_c = result[0]) === null || _c === void 0 ? void 0 : _c.Total) || 0;
                }
                else {
                    total = ((_d = countResult[0]) === null || _d === void 0 ? void 0 : _d.count) || 0;
                }
                const page = pagination(total, Page);
                let query = "SELECT *, DATE_FORMAT(requested_time, '%Y-%m-%d %H:%i:%s') AS requested_time, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 1";
                let params = [merchantIdArray];
                if (settlementId) {
                    query += " AND settlementId LIKE ? ORDER BY created_on DESC LIMIT ?,?";
                    params.push(`${settlementId}%`, page.start, page.limit);
                }
                else if (date) {
                    query += " AND DATE(created_on) = ? ORDER BY created_on DESC LIMIT ?,?";
                    params.push(date, page.start, page.limit);
                }
                else if (from && to) {
                    query += " AND DATE(created_on) BETWEEN ? AND ? ORDER BY created_on DESC LIMIT ?,?";
                    params.push(from, to, page.start, page.limit);
                }
                else {
                    query += " ORDER BY created_on DESC LIMIT ?,?";
                    params.push(page.start, page.limit);
                }
                data = yield (0, db_connection_1.default)(query, params);
                res.status(200).json({
                    message: `Showing ${data.length > 0 ? ((Page - 1) * page.limit + 1) : 0} to ${((Page - 1) * page.limit + data.length)} data from ${total}`,
                    currentPage: Page,
                    totalPage: page.numOfPages || 1,
                    data,
                });
            }
            else {
                let countQuery = "SELECT COUNT(*) as count FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 1";
                const countResult = yield (0, db_connection_1.default)(countQuery, [ID]);
                if (settlementId) {
                    const result = yield (0, db_connection_1.default)("SELECT COUNT(*) as Total FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 1 AND settlementId LIKE ?", [ID, `${settlementId}%`]);
                    total = ((_e = result[0]) === null || _e === void 0 ? void 0 : _e.Total) || 0;
                }
                else if (date) {
                    const result = yield (0, db_connection_1.default)("SELECT COUNT(*) as Total FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 2 AND DATE(created_on) >= ?", [ID, date]);
                    total = ((_f = result[0]) === null || _f === void 0 ? void 0 : _f.Total) || 0;
                }
                else if (from && to) {
                    const result = yield (0, db_connection_1.default)("SELECT COUNT(*) as Total FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 2 AND DATE(created_on) BETWEEN ? AND ?", [ID, from, to]);
                    total = ((_g = result[0]) === null || _g === void 0 ? void 0 : _g.Total) || 0;
                }
                else {
                    total = ((_h = countResult[0]) === null || _h === void 0 ? void 0 : _h.count) || 0;
                }
                const page = pagination(total, Page);
                let query = "SELECT *, DATE_FORMAT(requested_time, '%Y-%m-%d %H:%i:%s') AS requested_time, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 1";
                let params = [ID];
                if (settlementId) {
                    query += " AND settlementId LIKE ? ORDER BY created_on DESC LIMIT ?,?";
                    params.push(`${settlementId}%`, page.start, page.limit);
                }
                else if (date) {
                    query += " AND DATE(created_on) = ? ORDER BY created_on DESC LIMIT ?,?";
                    params.push(date, page.start, page.limit);
                }
                else if (from && to) {
                    query += " AND DATE(created_on) BETWEEN ? AND ? ORDER BY created_on DESC LIMIT ?,?";
                    params.push(from, to, page.start, page.limit);
                }
                else {
                    query += " ORDER BY created_on DESC LIMIT ?,?";
                    params.push(page.start, page.limit);
                }
                data = yield (0, db_connection_1.default)(query, params);
                res.status(200).json({
                    message: `Showing ${data.length > 0 ? ((Page - 1) * page.limit + 1) : 0} to ${((Page - 1) * page.limit + data.length)} data from ${total}`,
                    currentPage: Page,
                    totalPage: page.numOfPages || 1,
                    data,
                });
            }
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Error occurred",
                error: error.message,
            });
        }
    }),
    requestSettlement: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = req.user;
            const ID = user.account_type === 3 ? user.parent_id : user.id;
            const { settlementId, settlementType, fromCurrency, toCurrency, walletAddress, accountNumber, bankName, branchName, city, zip_code, country, swiftCode, available_balance, requestedAmount, net_amount_for_settlement, exchangeRate } = req.body;
            const commonFields = {
                user_id: ID,
                settlementId,
                settlement_mode: 1,
                settlementType,
                fromCurrency,
                toCurrency,
                accountNumber,
                bankName,
                branchName,
                city,
                zip_code,
                country,
                swiftCode,
                available_balance,
                requestedAmount,
                net_amount_for_settlement,
                exchangeRate,
                settlementAmount: requestedAmount,
                source: 'By Merchant',
                status: 2,
                merchant_name: user.name
            };
            const Settlement = settlementType === 'CRYPTO' ? Object.assign(Object.assign({}, commonFields), { walletAddress }) : commonFields;
            const remainingBalance = requestedAmount ? available_balance - requestedAmount : available_balance;
            const insertQuery = 'INSERT INTO tbl_settlement SET ?, requested_time = NOW(), created_on = NOW()';
            const result = yield (0, db_connection_1.default)(insertQuery, Settlement);
            const updateWalletQuery = 'UPDATE tbl_user SET wallet = ? WHERE id = ?';
            yield (0, db_connection_1.default)(updateWalletQuery, [remainingBalance, ID]);
            if (result.affectedRows > 0) {
                res.status(200).json({
                    message: 'Request settlement transaction successful',
                    data: result
                });
            }
            else {
                res.status(201).json({
                    message: 'Error while creating settlement',
                    data: result
                });
            }
        }
        catch (error) {
            console.error('Settlement Error:', error);
            res.status(500).json({
                message: 'An error occurred during settlement request',
                error: error.message || error
            });
        }
    }),
    cardDetails: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        const { id } = req.body;
        try {
            const targetId = id !== null && id !== void 0 ? id : ID;
            const condition = id ? "WHERE user_id = ? AND settlement_mode = 1" : "WHERE user_id = ?";
            const countSql = `SELECT COUNT(*) as count FROM tbl_settlement ${condition}`;
            const [countResult] = yield (0, db_connection_1.default)(countSql, [targetId]);
            const totalCount = countResult.count;
            const sumSqls = {
                requestedAmount: `SELECT SUM(requestedAmount) as request FROM tbl_settlement ${condition}`,
                charges: `SELECT SUM(charges) as charges FROM tbl_settlement ${condition}`,
                sentAmount: `SELECT SUM(settlementAmount) as amount FROM tbl_settlement ${condition}`,
                receivedAmount: `SELECT SUM(settlementAmount) as amount FROM tbl_settlement ${condition}`
            };
            const [statusResult0] = yield (0, db_connection_1.default)(sumSqls.requestedAmount, [targetId]);
            const [statusResult1] = yield (0, db_connection_1.default)(sumSqls.charges, [targetId]);
            const [statusResult4] = yield (0, db_connection_1.default)(sumSqls.sentAmount, [targetId]);
            const [statusResult5] = yield (0, db_connection_1.default)(sumSqls.receivedAmount, [targetId]);
            const data = [
                {
                    name: "Total Settlement Request",
                    amount: (statusResult0 === null || statusResult0 === void 0 ? void 0 : statusResult0.request) || 0
                },
                {
                    name: "Total Fees/Charges",
                    amount: (statusResult1 === null || statusResult1 === void 0 ? void 0 : statusResult1.charges) || 0
                },
                {
                    name: "Total Amount Sent",
                    amount: (statusResult4 === null || statusResult4 === void 0 ? void 0 : statusResult4.amount) || 0
                },
                {
                    name: "Total Amount Received",
                    amount: (statusResult5 === null || statusResult5 === void 0 ? void 0 : statusResult5.amount) || 0
                }
            ];
            res.status(totalCount === 0 ? 201 : 200).json({ data });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Error occurred",
                error: error.message || error
            });
        }
    }),
    downloadReportsc: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { from, to, id, date } = req.body;
        const userId = id !== null && id !== void 0 ? id : (user.account_type === 3 ? user.parent_id : user.id);
        const baseSelectQuery = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 1`;
        let sql = baseSelectQuery;
        let values = [userId];
        if (from && to) {
            sql += ` AND DATE(created_on) >= ? AND DATE(created_on) <= ?`;
            values = [userId, from, to];
        }
        else if (date) {
            sql += ` AND DATE(created_on) = ?`;
            values = [userId, date];
        }
        try {
            const result = yield (0, db_connection_1.default)(sql, values);
            res.send(result);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ status: false, message: "Some error occurred", error: error.message || error });
        }
    }),
    //➡️ Local Settlement
    settlement_Trans: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    }),
    localrequestSettlement: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    }),
    localcardDetails: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    }),
    localdownloadReportsc: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    }),
    //➡️ Common API
    exchangeRate: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    }),
    userWallet: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    })
};
exports.default = SettlementTransaction;

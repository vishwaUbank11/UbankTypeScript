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
const exceljs_1 = __importDefault(require("exceljs"));
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
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        const { from, to, id, date } = req.body;
        try {
            if (id) {
                if (from && to) {
                    const sql = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE DATE(created_on) >= ? AND DATE(created_on) <= ? AND user_id = ? AND settlement_mode = 1`;
                    const result = yield (0, db_connection_1.default)(sql, [from, to, id]);
                    res.send(result.length === 0 ? result : result);
                }
                else if (date) {
                    const sql = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE DATE(created_on) = ? AND user_id = ? AND settlement_mode = 1`;
                    const result = yield (0, db_connection_1.default)(sql, [date, id]);
                    res.send(result.length === 0 ? result : result);
                }
                else {
                    const sql = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 1`;
                    const result = yield (0, db_connection_1.default)(sql, [id]);
                    res.send(result.length === 0 ? result : result);
                }
            }
            else {
                if (from && to) {
                    const sql = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE DATE(created_on) >= ? AND DATE(created_on) <= ? AND user_id = ? AND settlement_mode = 1`;
                    const result = yield (0, db_connection_1.default)(sql, [from, to, ID]);
                    res.send(result.length === 0 ? result : result);
                }
                else if (date) {
                    const sql = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE DATE(created_on) = ? AND user_id = ? AND settlement_mode = 1`;
                    const result = yield (0, db_connection_1.default)(sql, [date, ID]);
                    res.send(result.length === 0 ? result : result);
                }
                else {
                    const sql = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 1`;
                    const result = yield (0, db_connection_1.default)(sql, [ID]);
                    res.send(result.length === 0 ? result : result);
                }
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: "Some error occurred" });
        }
    }),
    //➡️ Local Settlement
    settlement_Trans: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { id, searchText, to, from, status, currency, From, To, settlementMode, page = 1, limit = 10, } = req.body;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        const merchantIdArray = id ? id.split(",") : [ID.toString()];
        const pagination = (total, page, limit) => {
            const numOfPages = Math.ceil(total / limit);
            const start = (page - 1) * limit;
            return { limit, start, numOfPages };
        };
        const formattedDateFields = [
            "DATE_FORMAT(tbl_settlement.created_on, '%Y-%m-%d %H:%i:%s') AS created_on",
            "DATE_FORMAT(tbl_settlement.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on",
            "DATE_FORMAT(tbl_settlement.requested_time, '%Y-%m-%d %H:%i:%s') AS requested_time",
            "DATE_FORMAT(tbl_settlement.settlement_time, '%Y-%m-%d %H:%i:%s') AS settlement_time"
        ].join(", ");
        let baseQuery = `SELECT tbl_user.name, tbl_settlement.*, ${formattedDateFields} FROM tbl_settlement LEFT JOIN tbl_user ON tbl_user.id = tbl_settlement.user_id WHERE tbl_settlement.user_id IN (${merchantIdArray.map(() => "?").join(", ")}) AND tbl_settlement.settlement_mode = ?`;
        let countQuery = `SELECT COUNT(*) AS Total FROM tbl_settlement INNER JOIN tbl_user ON tbl_user.id = tbl_settlement.user_id WHERE tbl_settlement.user_id IN (${merchantIdArray.map(() => "?").join(", ")}) AND tbl_settlement.settlement_mode = ?`;
        let queryValues = [...merchantIdArray, settlementMode];
        let conditions = [];
        if (status === null || status === void 0 ? void 0 : status.length) {
            conditions.push(`tbl_settlement.status IN (${status.map(() => "?").join(", ")})`);
            queryValues.push(...status);
        }
        if (currency === null || currency === void 0 ? void 0 : currency.length) {
            conditions.push(`tbl_settlement.fromCurrency IN (${currency.map(() => "?").join(", ")})`);
            queryValues.push(...currency);
        }
        if (from && to) {
            conditions.push("DATE(tbl_settlement.requested_time) BETWEEN ? AND ?");
            queryValues.push(from, to);
        }
        if (From && To) {
            conditions.push("DATE(tbl_settlement.settlement_time) BETWEEN ? AND ?");
            queryValues.push(From, To);
        }
        if (searchText) {
            conditions.push("(tbl_settlement.settlementId LIKE ?)");
            queryValues.push(`%${searchText}%`);
        }
        if (conditions.length > 0) {
            const conditionStr = " AND " + conditions.join(" AND ");
            baseQuery += conditionStr;
            countQuery += conditionStr;
        }
        try {
            const countResult = yield (0, db_connection_1.default)(countQuery, queryValues);
            const total = countResult[0].Total;
            const { start, numOfPages } = pagination(total, page, limit);
            baseQuery += ` ORDER BY tbl_settlement.created_on DESC LIMIT ?, ?`;
            const finalQueryValues = [...queryValues, start, limit];
            const resultData = yield (0, db_connection_1.default)(baseQuery, finalQueryValues);
            const startRange = start + 1;
            const endRange = Math.min(start + limit, total);
            res.json({
                message: resultData.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
                currentPage: page,
                totalPages: numOfPages || 1,
                pageLimit: limit,
                data: resultData,
            });
        }
        catch (error) {
            console.error(error);
            const errMsg = error instanceof Error ? error.message : "Unknown error";
            res.status(500).json({
                message: "Error occurred",
                error: errMsg,
            });
        }
    }),
    localrequestSettlement: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = req.user;
            const ID = user.account_type === 3 ? user.parent_id : user.id;
            const { settlementId, settlementType, fromCurrency, toCurrency, walletAddress, accountNumber, bankName, branchName, city, country, zip_code, requestedAmount, account_name, swiftCode, settlementMode, remainingBalance, previousBalance, } = req.body;
            let settlementData;
            if (settlementMode === 1) {
                settlementData = {
                    user_id: ID,
                    settlementId,
                    settlement_mode: settlementMode,
                    fromCurrency,
                    accountNumber,
                    bankName,
                    branchName,
                    account_name,
                    swiftCode,
                    available_balance: previousBalance,
                    requestedAmount,
                    settlementAmount: requestedAmount,
                    status: 2,
                    source: "By Merchant",
                };
            }
            else {
                settlementData = {
                    user_id: ID,
                    settlementId,
                    settlementType,
                    settlement_mode: settlementMode,
                    fromCurrency,
                    toCurrency,
                    walletAddress,
                    accountNumber,
                    bankName,
                    branchName,
                    city,
                    country,
                    zip_code,
                    account_name,
                    swiftCode,
                    available_balance: previousBalance,
                    requestedAmount,
                    settlementAmount: requestedAmount,
                    status: 2,
                    source: "By Merchant",
                };
            }
            const insertSql = "INSERT INTO tbl_settlement SET ?, settlement_time = NOW(), requested_time = NOW(), created_on = NOW(), updated_on = NOW()";
            const result = yield (0, db_connection_1.default)(insertSql, settlementData);
            const updateSql = "UPDATE tbl_user SET wallet = ? WHERE id = ?";
            yield (0, db_connection_1.default)(updateSql, [remainingBalance, ID]);
            if (result.affectedRows > 0) {
                res.status(200).json({
                    message: "Settlement request submitted successfully.",
                    data: result,
                });
            }
            else {
                res.status(400).json({
                    message: "Failed to create settlement request.",
                    data: result,
                });
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("Settlement request error:", error);
            res.status(500).json({
                message: "An error occurred while processing the request.",
                error: errorMessage,
            });
        }
    }),
    localcardDetails: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        let { id, from, to, date, searchItem } = req.body;
        try {
            let sql;
            let params;
            if (id) {
                const idList = id.split(",");
                if (from && to) {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges, COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent
                    FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2 AND DATE(created_on) BETWEEN ? AND ?`;
                    params = [idList, from, to];
                }
                else if (date) {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges,COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2 AND DATE(created_on) = ?`;
                    params = [idList, date];
                }
                else if (searchItem) {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges, COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent
                    FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2 AND settlementId LIKE ?`;
                    params = [idList, `%${searchItem}%`];
                }
                else {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges, COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent
                    FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2`;
                    params = [idList];
                }
            }
            else {
                if (from && to) {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges,COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent
                    FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 2 AND DATE(created_on) BETWEEN ? AND ?`;
                    params = [ID, from, to];
                }
                else if (date) {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges,COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent
                    FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 2 AND DATE(created_on) = ?`;
                    params = [ID, date];
                }
                else if (searchItem) {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request,COALESCE(SUM(charges), 0) as charges,COALESCE(SUM(settlementAmount), 0) as total_amount_received,COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 2 AND settlementId LIKE ?`;
                    params = [ID, `%${searchItem}%`];
                }
                else {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges,COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 2`;
                    params = [ID];
                }
            }
            const [result] = yield (0, db_connection_1.default)(sql, params);
            const data = result
                ? [
                    { name: "Total Settlement Request", amount: result.request.toFixed(2) },
                    { name: "Total Fees/Charges", amount: result.charges.toFixed(2) },
                    { name: "Total Amount Sent", amount: result.total_amount_sent.toFixed(2) },
                    { name: "Total Amount Recieved", amount: result.total_amount_received.toFixed(2) },
                ]
                : [
                    { name: "Total Settlement Request", amount: 0 },
                    { name: "Total Fees/Charges", amount: 0 },
                    { name: "Total Amount Sent", amount: 0 },
                    { name: "Total Amount Recieved", amount: 0 },
                ];
            res.status(200).json({ data });
        }
        catch (error) {
            console.error("Error in localcardDetails:", error);
            res.status(500).json({ message: "Error occurred", error });
        }
    }),
    localdownloadReportsc: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { id, searchText, to, from, status, currency, From, To, settlementMode } = req.body;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        try {
            const merchantIdArray = id ? id.split(",") : [ID.toString()];
            const formattedDateFields = [
                "DATE_FORMAT(tbl_settlement.created_on, '%Y-%m-%d %H:%i:%s') AS created_on",
                "DATE_FORMAT(tbl_settlement.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on",
                "DATE_FORMAT(tbl_settlement.settlement_time, '%Y-%m-%d %H:%i:%s') AS settlement_time",
            ].join(", ");
            let baseQuery = `SELECT tbl_user.name, tbl_settlement.*, ${formattedDateFields} FROM tbl_settlement LEFT JOIN tbl_user ON tbl_user.id = tbl_settlement.user_id WHERE tbl_settlement.user_id IN (${merchantIdArray.map(() => "?").join(", ")}) AND tbl_settlement.settlement_mode = ?`;
            const queryValues = [...merchantIdArray, settlementMode];
            const conditions = [];
            if (status === null || status === void 0 ? void 0 : status.length) {
                conditions.push(`tbl_settlement.status IN (${status.map(() => "?").join(", ")})`);
                queryValues.push(...status);
            }
            if (currency === null || currency === void 0 ? void 0 : currency.length) {
                conditions.push(`tbl_settlement.fromCurrency IN (${currency.map(() => "?").join(", ")})`);
                queryValues.push(...currency);
            }
            if (to && from) {
                conditions.push("DATE(tbl_settlement.requested_time) BETWEEN ? AND ?");
                queryValues.push(from, to);
            }
            if (To && From) {
                conditions.push("DATE(tbl_settlement.settlement_time) BETWEEN ? AND ?");
                queryValues.push(From, To);
            }
            if (searchText) {
                conditions.push("(tbl_settlement.settlementID LIKE ?)");
                queryValues.push(`%${searchText}%`);
            }
            if (conditions.length) {
                baseQuery += " AND " + conditions.join(" AND ");
            }
            baseQuery += " ORDER BY tbl_settlement.created_on DESC";
            const resultData = yield (0, db_connection_1.default)(baseQuery, queryValues);
            const workbook = new exceljs_1.default.Workbook();
            const worksheet = workbook.addWorksheet("Settlement");
            worksheet.mergeCells("A1", "T1");
            worksheet.getCell("A1").value = "SETTLEMENT REPORT";
            worksheet.getCell("A1").font = { size: 16, bold: true };
            worksheet.getRow(1).alignment = { horizontal: "center" };
            worksheet.addRow([]);
            if (settlementMode === 2) {
                worksheet.addRow([
                    "Sr. No",
                    "Merchant",
                    "Settlement ID.",
                    "Currency",
                    "Status",
                    "Account Number",
                    "Bank Name",
                    "Branch Name",
                    "Requested Amount",
                    "Charges",
                    "Net Settlement",
                    "Created On",
                    "Updated On",
                ]);
            }
            else {
                worksheet.addRow([
                    "Sr. No",
                    "Merchant",
                    "Settlement ID",
                    "From Currency",
                    "To Currency",
                    "Status",
                    "Account Number",
                    "Bank Name",
                    "Branch Name",
                    "City",
                    "Country",
                    "Zip Code",
                    "Swift Code",
                    "Requested Amount",
                    "Exchange Rate",
                    "Total Charges",
                    "Net Settlement",
                    "Settlement Time",
                    "Created On",
                    "Updated On",
                ]);
            }
            worksheet.getRow(3).font = { bold: true };
            resultData.forEach((row, index) => {
                let statusLabel = "";
                switch (row.status) {
                    case 0:
                        statusLabel = "FAILED";
                        break;
                    case 1:
                        statusLabel = "SUCCESS";
                        break;
                    case 2:
                        statusLabel = "PENDING";
                        break;
                    case 3:
                        statusLabel = "WAITING FOR APPROVAL";
                        break;
                }
                const charges = row.totalCharges ? parseFloat(row.totalCharges) : 0;
                const requestedAmount = parseFloat(row.requestedAmount);
                let netSettlement;
                if (settlementMode === 2) {
                    netSettlement = parseFloat((requestedAmount - charges).toFixed(2));
                    worksheet.addRow([
                        index + 1,
                        `${row.user_id} - ${row.name}`,
                        row.settlementId,
                        row.fromCurrency,
                        statusLabel,
                        row.accountNumber ? parseFloat(row.accountNumber) : "",
                        row.bankName,
                        row.branchName,
                        requestedAmount,
                        charges,
                        netSettlement,
                        row.created_on,
                        row.updated_on,
                    ]);
                }
                else {
                    netSettlement = row.exchangeRate ? parseFloat(((requestedAmount - charges) / parseFloat(row.exchangeRate)).toFixed(2)) : parseFloat((requestedAmount - charges).toFixed(2));
                    worksheet.addRow([
                        index + 1,
                        `${row.user_id} - ${row.name}`,
                        row.settlementId,
                        row.fromCurrency,
                        row.toCurrency,
                        statusLabel,
                        row.accountNumber ? parseFloat(row.accountNumber) : "",
                        row.bankName,
                        row.branchName,
                        row.city,
                        row.country,
                        row.zip_code,
                        row.swiftCode,
                        requestedAmount,
                        parseFloat(row.exchangeRate || 0),
                        charges,
                        netSettlement,
                        row.settlement_time,
                        row.created_on,
                        row.updated_on,
                    ]);
                }
            });
            worksheet.columns.forEach((column) => {
                var _a;
                if (column) {
                    let maxLength = 10;
                    (_a = column.eachCell) === null || _a === void 0 ? void 0 : _a.call(column, { includeEmpty: true }, (cell) => {
                        const length = cell.value ? cell.value.toString().length : 10;
                        if (length > maxLength)
                            maxLength = length;
                    });
                    column.width = maxLength + 5;
                }
            });
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Settlements.xlsx");
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            res.status(500).json({
                message: "Server Error",
                error,
            });
        }
    }),
    //➡️ Common API
    exchangeRate: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { currency, toCurrency } = req.body;
            const sql = `SELECT rate FROM tbl_user_settled_currency WHERE deposit_currency = ? AND settled_currency = ?`;
            const result = yield (0, db_connection_1.default)(sql, [currency, toCurrency]);
            if (result.length !== 0) {
                res.status(200).json({
                    message: "Data",
                    data: result
                });
            }
            else {
                res.status(201).json({
                    message: "No data found",
                    data: result
                });
            }
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Error occurred",
                error
            });
        }
    }),
    userWallet: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = req.user;
            const requestedId = req.body.id;
            const userId = requestedId !== null && requestedId !== void 0 ? requestedId : (user.account_type === 3 ? user.parent_id : user.id);
            const [walletResult, currencyResult] = yield Promise.all([
                (0, db_connection_1.default)("SELECT wallet FROM tbl_user WHERE id = ?", [userId]),
                (0, db_connection_1.default)("SELECT sortname as value, sortname as label FROM countries WHERE status = 1"),
            ]);
            if (walletResult.length > 0) {
                res.status(200).json({
                    data: walletResult[0].wallet,
                    currencyResult,
                });
            }
            else {
                res.status(201).json({
                    message: "No data found",
                    data: null,
                });
            }
        }
        catch (error) {
            res.status(500).json({
                message: "An error occurred",
                error,
            });
        }
    })
};
exports.default = SettlementTransaction;

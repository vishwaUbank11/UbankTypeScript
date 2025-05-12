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
const pagination = (total, page) => {
    const limit = 10;
    const numOfPages = Math.ceil(total / limit);
    const start = page * limit - limit;
    return { limit, start, numOfPages };
};
const buildConditions = (filters) => {
    var _a, _b, _c;
    const conditions = ["user_id IN (?)"];
    const values = [filters.userIds];
    if (filters.date) {
        conditions.push("DATE(created_on) = ?");
        values.push(filters.date);
    }
    else if (filters.from && filters.to) {
        conditions.push("DATE(created_on) >= ?");
        conditions.push("DATE(created_on) <= ?");
        values.push(filters.from, filters.to);
    }
    if ((_a = filters.methodPayment) === null || _a === void 0 ? void 0 : _a.length) {
        conditions.push("payment_type IN (?)");
        values.push(filters.methodPayment);
    }
    if ((_b = filters.status) === null || _b === void 0 ? void 0 : _b.length) {
        conditions.push("status IN (?)");
        values.push(filters.status);
    }
    if ((_c = filters.currency) === null || _c === void 0 ? void 0 : _c.length) {
        conditions.push("ammount_type IN (?)");
        values.push(filters.currency);
    }
    if (filters.searchItem) {
        conditions.push("(order_no LIKE ? OR i_flname LIKE ?)");
        const searchTerm = `%${filters.searchItem}%`;
        values.push(searchTerm, searchTerm);
    }
    return {
        conditionStr: conditions.join(" AND "),
        values,
    };
};
const buildConditionSql = (baseSql, conditions) => {
    let sql = baseSql;
    const params = [conditions.id];
    if (conditions.from && conditions.to) {
        sql += ' AND created_on >= ? AND created_on <= ?';
        params.push(conditions.from, conditions.to);
    }
    else if (conditions.date) {
        sql += ' AND created_on >= ?';
        params.push(conditions.date);
    }
    if (conditions.currency && conditions.currency.length) {
        sql += ' AND ammount_type IN (?)';
        params.push(conditions.currency);
    }
    if (conditions.methodPayment && conditions.methodPayment.length) {
        sql += ' AND payment_type IN (?)';
        params.push(conditions.methodPayment);
    }
    if (conditions.searchItem) {
        sql += ' AND (order_no LIKE ? OR i_flname LIKE ?)';
        const searchLike = `%${conditions.searchItem}%`;
        params.push(searchLike, searchLike);
    }
    return { sql, params };
};
const TestSandbox = {
    downloadSandboxDepositsapi: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const { merchantSelect, from, to, date, methodPayment, status, currency, searchItem, } = req.body;
            const userIds = merchantSelect ? merchantSelect.split(",") : [(_a = req.user) === null || _a === void 0 ? void 0 : _a.id];
            const filters = { userIds, from, to, date, methodPayment: methodPayment ? methodPayment[0].split(",") : [], status: status ? status[0].split(",") : [], currency: currency ? currency[0].split(",") : [], searchItem, };
            const { conditionStr, values } = buildConditions(filters);
            const query = `SELECT * FROM tbl_merchant_transaction_sandbox WHERE ${conditionStr}`;
            const result = yield (0, db_connection_1.default)(query, values);
            res.send(result);
        }
        catch (error) {
            console.error("Error in downloadSandboxDepositsapi:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }),
    statusSandboxDepositsResult: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const { merchantSelect, from, to, date, methodPayment, currency, searchItem } = req.body;
        if (!merchantSelect)
            res.status(400).send('merchantSelect required');
        const id = merchantSelect.split(',');
        const conditionParams = {
            id,
            from,
            to,
            date,
            methodPayment: ((_a = methodPayment === null || methodPayment === void 0 ? void 0 : methodPayment[0]) === null || _a === void 0 ? void 0 : _a.split(',')) || null,
            currency: ((_b = currency === null || currency === void 0 ? void 0 : currency[0]) === null || _b === void 0 ? void 0 : _b.split(',')) || null,
            searchItem,
        };
        try {
            // 1. Total Count
            const totalQueryBase = "SELECT COUNT(status) as count FROM tbl_merchant_transaction_sandbox WHERE user_id IN (?)";
            const { sql: totalSql, params: totalParams } = buildConditionSql(totalQueryBase, conditionParams);
            const totalResult = yield (0, db_connection_1.default)(totalSql, totalParams);
            const totalCount = ((_c = totalResult[0]) === null || _c === void 0 ? void 0 : _c.count) || 0;
            // Helper function to get result for each status
            const getStatusData = (statusValues, label) => __awaiter(void 0, void 0, void 0, function* () {
                const baseSql = `
        SELECT COUNT(status) AS count, COALESCE(SUM(ammount), 0) AS ammount
        FROM tbl_merchant_transaction_sandbox
        WHERE user_id IN (?) AND status ${statusValues.length > 1 ? 'IN (?)' : '= ?'}
      `;
                const { sql, params } = buildConditionSql(baseSql, conditionParams);
                if (statusValues.length > 1) {
                    params.splice(1, 0, statusValues);
                }
                else {
                    params.splice(1, 0, statusValues[0]);
                }
                const result = yield (0, db_connection_1.default)(sql, params);
                return result[0] || { count: 0, ammount: 0 };
            });
            // 2. Status-wise Data
            const failure = yield getStatusData([0], 'failure');
            const success = yield getStatusData([1], 'success');
            const pending = yield getStatusData([2, 3], 'pending');
            const refund = yield getStatusData([4], 'refund');
            const chargeback = yield getStatusData([5], 'chargeback');
            res.json({
                totalCount,
                failure,
                success,
                pending,
                refund,
                chargeback,
            });
        }
        catch (err) {
            console.error('statusSandboxDepositsResult error:', err);
            res.status(500).send('Internal Server Error');
        }
    }),
    searchSandboxDepositsDateFilter: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const { merchantSelect, from, to, date, methodPayment, status, currency, searchItem } = req.body;
        try {
            const id = merchantSelect ? merchantSelect.split(',') : [(_a = req.user) === null || _a === void 0 ? void 0 : _a.id];
            const queries = {
                count: {
                    default: "SELECT COUNT(*) as Total FROM tbl_merchant_transaction_sandbox WHERE user_id IN (?)",
                    search: "SELECT COUNT(*) as Total FROM tbl_merchant_transaction_sandbox WHERE user_id IN (?) AND (order_no LIKE ? OR i_flname LIKE ?)",
                    date: "SELECT COUNT(*) as Total FROM tbl_merchant_transaction_sandbox WHERE user_id IN (?) AND DATE(created_on) = ?",
                    fromTo: "SELECT COUNT(*) as Total FROM tbl_merchant_transaction_sandbox WHERE user_id IN (?) AND DATE(created_on) >= ? AND DATE(created_on) <= ?",
                    methodPayment: "SELECT COUNT(*) as Total FROM tbl_merchant_transaction_sandbox WHERE user_id IN (?) AND payment_type IN (?)",
                    status: "SELECT COUNT(*) as Total FROM tbl_merchant_transaction_sandbox WHERE user_id IN (?) AND status IN (?)",
                    currency: "SELECT COUNT(*) as Total FROM tbl_merchant_transaction_sandbox WHERE user_id IN (?) AND ammount_type IN (?)",
                },
                select: {
                    default: `SELECT tbl_user.name, tbl_merchant_transaction_sandbox.*, DATE_FORMAT(tbl_merchant_transaction_sandbox.created_on, '%Y-%m-%d %H:%i:%s') AS created_on FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE tbl_merchant_transaction_sandbox.user_id IN (?) ORDER BY created_on DESC LIMIT ?, ?`,
                    search: `SELECT tbl_user.name, tbl_merchant_transaction_sandbox.*, DATE_FORMAT(tbl_merchant_transaction_sandbox.created_on, '%Y-%m-%d %H:%i:%s') AS created_on FROM tbl_merchant_transaction_sandbox INNER JOIN tbl_user ON tbl_merchant_transaction_sandbox.user_id = tbl_user.id WHERE tbl_merchant_transaction_sandbox.user_id IN (?) AND (order_no LIKE ? OR i_flname LIKE ?) ORDER BY created_on DESC LIMIT ?, ?`,
                },
            };
            const getCountQuery = (conditions) => {
                for (const key in conditions) {
                    if (conditions[key]) {
                        return queries.count[key];
                    }
                }
                return queries.count.default;
            };
            const getSelectQuery = (conditions) => {
                for (const key in conditions) {
                    if (conditions[key]) {
                        return queries.select[key];
                    }
                }
                return queries.select.default;
            };
            const conditions = {
                default: true,
                search: searchItem,
                date: date,
                fromTo: from && to,
                methodPayment: methodPayment,
                status: status,
                currency: currency,
            };
            const totalCountQuery = getCountQuery(conditions);
            const totalResultQuery = getSelectQuery(conditions);
            const totalCountValues = [id];
            const resultValues = [id];
            if (searchItem) {
                totalCountValues.push(`%${searchItem}%`, `%${searchItem}%`);
                resultValues.push(`%${searchItem}%`, `%${searchItem}%`);
            }
            else {
                if (date)
                    totalCountValues.push(date);
                if (from && to)
                    totalCountValues.push(from, to);
                if (methodPayment)
                    totalCountValues.push(methodPayment.split(','));
                if (status)
                    totalCountValues.push(status.split(','));
                if (currency)
                    totalCountValues.push(currency.split(','));
                if (date)
                    resultValues.push(date);
                if (from && to)
                    resultValues.push(from, to);
                if (methodPayment)
                    resultValues.push(methodPayment.split(','));
                if (status)
                    resultValues.push(status.split(','));
                if (currency)
                    resultValues.push(currency.split(','));
            }
            const totalCountResult = yield (0, db_connection_1.default)(totalCountQuery, totalCountValues);
            const total = ((_b = totalCountResult[0]) === null || _b === void 0 ? void 0 : _b.Total) || 0;
            const page = req.body.page ? Number(req.body.page) : 1;
            const paginationInfo = pagination(total, page);
            const result = yield (0, db_connection_1.default)(totalResultQuery, [...resultValues, paginationInfo.start, paginationInfo.limit]);
            const startRange = paginationInfo.start + 1;
            const endRange = paginationInfo.start + result.length;
            res.status(200).json({
                data: {
                    message: result.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
                    currentPage: page,
                    totalPages: paginationInfo.numOfPages > 0 ? paginationInfo.numOfPages : 1,
                    deposits: result,
                },
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server Error' });
        }
    })
};
exports.default = TestSandbox;

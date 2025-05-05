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
const dashboardCount = {
    card_data: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        // const user = req.user;
        const user = req.user;
        const { id } = req.body;
        try {
            const merchantIdArray = id ? id.split(',') : [user.id.toString()];
            const isMultiple = id !== undefined;
            const sql = `
            SELECT 1 AS tbl, status, ammount_type AS currency, SUM(ammount) AS amount, SUM(gst_charges) + SUM(payin_charges) AS commission, SUM(rolling_reverse_amount) AS rr FROM tbl_merchant_transaction WHERE user_id IN (?) AND status IN (1, 4, 5) AND ammount_type IS NOT NULL
            GROUP BY status, ammount_type 
            UNION ALL 
            SELECT 2 AS tbl, status, currency, SUM(amount) AS amount, SUM(akonto_charge) + SUM(gst_amount) AS commission, 0 AS rr FROM tbl_icici_payout_transaction_response_details WHERE users_id IN (?) AND status = 'SUCCESS' AND currency IS NOT NULL GROUP BY status, currency
            UNION ALL
            SELECT 3 AS tbl, status, fromCurrency AS currency, SUM(requestedAmount) AS amount, SUM(charges) AS commission, SUM(net_amount_for_settlement) AS rr FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2 AND status = 1
            GROUP BY status, fromCurrency;
          `;
            const sqlInternational = `
            SELECT 3 AS tbl, status, fromCurrency AS currency, SUM(requestedAmount) AS amount, SUM(charges) AS commission, SUM(net_amount_for_settlement) AS rr FROM tbl_settlement WHERE settlement_mode = 1 AND user_id IN (?) AND status = 1
            GROUP BY status, fromCurrency;
          `;
            const sqlRate = `SELECT * FROM tbl_user_settled_currency WHERE settled_currency = ?`;
            const sqlSymbol = `SELECT symbol FROM countries WHERE sortname = ?`;
            const [result, resultInternational, resultRates, resultSymbol, merchantData] = yield Promise.all([
                (0, db_connection_1.default)(sql, [merchantIdArray, merchantIdArray, merchantIdArray]),
                (0, db_connection_1.default)(sqlInternational, [merchantIdArray]),
                (0, db_connection_1.default)(sqlRate, [user.settle_currency]),
                (0, db_connection_1.default)(sqlSymbol, [user.settle_currency === 'USDT' ? 'USD' : user.settle_currency]),
                isMultiple ? (0, db_connection_1.default)(`SELECT * FROM tbl_user WHERE id IN (?)`, [merchantIdArray]) : Promise.resolve([user])
            ]);
            const symbol = ((_a = resultSymbol[0]) === null || _a === void 0 ? void 0 : _a.symbol) || '';
            const rates = resultRates;
            const allResults = [...result, ...resultInternational];
            const merchant = merchantData[0];
            const convert = (amount, currency) => {
                var _a;
                const rate = ((_a = rates.find(item => item.deposit_currency === currency)) === null || _a === void 0 ? void 0 : _a.rate) || 1;
                return amount / rate;
            };
            const format = (value) => value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            const sumBy = (filterFn, valueFn) => allResults.filter(filterFn).reduce((total, curr) => total + valueFn(curr), 0);
            const data = {
                id: id || user.id,
                name: isMultiple
                    ? merchantData.map(m => m.name).join(', ')
                    : user.name,
                available_balance: `${symbol} ${format(merchant.wallet)}`,
                deposit: `${symbol} ${format(sumBy(item => item.tbl === 1 && item.status === 1 && !!item.currency, item => convert(Number(item.amount) + Number(item.commission), item.currency)))}`,
                commission: `${symbol} ${format(sumBy(item => !!item.currency, item => convert(Number(item.commission), item.currency)))}`,
                rolling_reverse: `${symbol} ${format(sumBy(item => item.tbl === 1 && [1, 4, 5].includes(Number(item.status)) && !!item.currency, item => convert(Number(item.rr || 0), item.currency)))}`,
                refund_nd_chargeback: `${symbol} ${format(sumBy(item => item.tbl === 1 && [4, 5].includes(Number(item.status)) && !!item.currency, item => convert(Number(item.amount) - Number(item.commission), item.currency)))}`,
                local_settlement: `${symbol} ${format(sumBy(item => item.tbl === 3 && Number(item.status) === 1 && !!item.currency, item => convert(Number(item.amount) - Number(item.commission), item.currency)))}`,
                international_settlement: `${symbol} ${format(sumBy(item => item.tbl === 3 && Number(item.status) === 1 && !!item.currency, item => convert(Number(item.amount) - Number(item.commission), item.currency)))}`,
                payout: `${symbol} ${format(sumBy(item => item.status === 'SUCCESS' && !!item.currency, item => convert(Number(item.amount) + Number(item.commission), item.currency)))}`
            };
            res.status(200).json({
                status: true,
                message: "User card data - ",
                data
            });
        }
        catch (error) {
            console.error("Card data error:", error);
            res.status(500).json({
                status: false,
                message: "Internal server error"
            });
        }
    }),
    success_rate: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user; // adjust based on your `req.user` type
        const { id } = req.body;
        try {
            let result;
            if (id) {
                const merchantIdArray = id.split(',').map((i) => Number(i));
                const sql = "SELECT status FROM tbl_merchant_transaction WHERE user_id IN (?)";
                result = yield (0, db_connection_1.default)(sql, [merchantIdArray]);
            }
            else {
                const sql = "SELECT status FROM tbl_merchant_transaction WHERE user_id = ?";
                result = yield (0, db_connection_1.default)(sql, [user.id]);
                console.log(result);
            }
            const total = result.length;
            if (total < 1) {
                res.status(200).json({
                    status: true,
                    message: "Data sent successfully",
                    data: 0,
                });
                return;
            }
            const successCount = result.filter(item => item.status === 1).length;
            const successPercent = Math.round((successCount / total) * 100);
            res.status(200).json({
                status: true,
                message: "Data sent successfully",
                data: successPercent,
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                status: false,
                message: "Error to complete task.",
                error,
            });
        }
    }),
    top_transaction_today: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { id, val } = req.body;
        try {
            let sql;
            let result;
            if (id) {
                const merchantIdArray = id.split(',');
                if (val === 'month') {
                    sql = `
          SELECT invoice_id as id, user_id, DATE(NOW()) - INTERVAL 0 DAY as txn_date,
            IF(order_no, order_no, txn_id) as order_no, ammount as amount,
            IF(invoice_id, '1', '1') as transaction_type, ammount_type as currency,
            status, payment_type as payment_method, i_flname as customer_name,
            DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on
          FROM tbl_merchant_transaction
          WHERE user_id IN (?) AND created_on >= DATE(NOW()) - INTERVAL 30 DAY
          
          UNION
          
          SELECT id, uniqueid as order_no, users_id as user_id, DATE(NOW()) - INTERVAL 0 DAY as txn_date,
            amount, IF(id, '2', '2') as transaction_type, currency, status,
            trx_type as payment_method, customer_name,
            DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on
          FROM tbl_icici_payout_transaction_response_details
          WHERE users_id IN (?) AND created_on >= DATE(NOW()) - INTERVAL 30 DAY
          ORDER BY created_on DESC
          LIMIT 0, 10
        `;
                }
                else if (val === 'week') {
                    sql = `
          SELECT invoice_id as id, user_id, DATE(NOW()) - INTERVAL 0 DAY as txn_date,
            IF(order_no, order_no, txn_id) as order_no, ammount as amount,
            IF(invoice_id, '1', '1') as transaction_type, ammount_type as currency,
            status, payment_type as payment_method, i_flname as customer_name,
            DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on
          FROM tbl_merchant_transaction
          WHERE user_id IN (?) AND created_on >= DATE(NOW()) - INTERVAL 6 DAY
          
          UNION
          
          SELECT id, uniqueid as order_no, users_id as user_id, DATE(NOW()) - INTERVAL 0 DAY as txn_date,
            amount, IF(id, '2', '2') as transaction_type, currency, status,
            trx_type as payment_method, customer_name,
            DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on
          FROM tbl_icici_payout_transaction_response_details
          WHERE users_id IN (?) AND created_on >= DATE(NOW()) - INTERVAL 6 DAY
          ORDER BY created_on DESC
          LIMIT 0, 10
        `;
                }
                else {
                    sql = `
          SELECT invoice_id as id, user_id, DATE(NOW()) - INTERVAL 0 DAY as txn_date,
            IF(order_no, order_no, txn_id) as order_no, ammount as amount,
            IF(invoice_id, '1', '1') as transaction_type, ammount_type as currency,
            status, payment_type as payment_method, i_flname as customer_name,
            DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on
          FROM tbl_merchant_transaction
          WHERE user_id IN (?) AND created_on >= DATE(NOW()) - INTERVAL 0 DAY

          UNION

          SELECT id, uniqueid as order_no, users_id as user_id, DATE(NOW()) - INTERVAL 0 DAY as txn_date,
            amount, IF(id, '2', '2') as transaction_type, currency, status,
            trx_type as payment_method, customer_name,
            DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on
          FROM tbl_icici_payout_transaction_response_details
          WHERE users_id IN (?) AND created_on >= DATE(NOW()) - INTERVAL 0 DAY
          ORDER BY created_on DESC
          LIMIT 0, 10
        `;
                }
                result = yield (0, db_connection_1.default)(sql, [merchantIdArray, merchantIdArray]);
            }
            else {
                if (val === 'month') {
                    sql = `
          SELECT invoice_id as id, user_id, DATE(NOW()) - INTERVAL 0 DAY as txn_date,
            IF(order_no, order_no, txn_id) as order_no, ammount as amount,
            IF(invoice_id, '1', '1') as transaction_type, ammount_type as currency,
            status, payment_type as payment_method, i_flname as customer_name,
            DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on
          FROM tbl_merchant_transaction
          WHERE user_id = ? AND created_on >= DATE(NOW()) - INTERVAL 30 DAY
          
          UNION

          SELECT id, uniqueid as order_no, users_id as user_id, DATE(NOW()) - INTERVAL 0 DAY as txn_date,
            amount, IF(id, '2', '2') as transaction_type, currency, status,
            trx_type as payment_method, customer_name,
            DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on
          FROM tbl_icici_payout_transaction_response_details
          WHERE users_id = ? AND created_on >= DATE(NOW()) - INTERVAL 30 DAY
          ORDER BY created_on DESC
          LIMIT 0, 10
        `;
                }
                else if (val === 'week') {
                    sql = `
          SELECT invoice_id as id, user_id, DATE(NOW()) - INTERVAL 0 DAY as txn_date,
            IF(order_no, order_no, txn_id) as order_no, ammount as amount,
            IF(invoice_id, '1', '1') as transaction_type, ammount_type as currency,
            status, payment_type as payment_method, i_flname as customer_name,
            DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on
          FROM tbl_merchant_transaction
          WHERE user_id = ? AND created_on >= DATE(NOW()) - INTERVAL 6 DAY

          UNION

          SELECT id, uniqueid as order_no, users_id as user_id, DATE(NOW()) - INTERVAL 0 DAY as txn_date,
            amount, IF(id, '2', '2') as transaction_type, currency, status,
            trx_type as payment_method, customer_name,
            DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on
          FROM tbl_icici_payout_transaction_response_details
          WHERE users_id = ? AND created_on >= DATE(NOW()) - INTERVAL 6 DAY
          ORDER BY created_on DESC
          LIMIT 0, 10
        `;
                }
                else {
                    sql = `
          SELECT invoice_id as id, user_id, DATE(NOW()) - INTERVAL 0 DAY as txn_date,
            IF(order_no, order_no, txn_id) as order_no, ammount as amount,
            IF(invoice_id, '1', '1') as transaction_type, ammount_type as currency,
            status, payment_type as payment_method, i_flname as customer_name,
            DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on
          FROM tbl_merchant_transaction
          WHERE user_id = ? AND created_on >= DATE(NOW()) - INTERVAL 0 DAY

          UNION

          SELECT id, uniqueid as order_no, users_id as user_id, DATE(NOW()) - INTERVAL 0 DAY as txn_date,
            amount, IF(id, '2', '2') as transaction_type, currency, status,
            trx_type as payment_method, customer_name,
            DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on
          FROM tbl_icici_payout_transaction_response_details
          WHERE users_id = ? AND created_on >= DATE(NOW()) - INTERVAL 0 DAY
          ORDER BY created_on DESC
          LIMIT 0, 10
        `;
                }
                result = yield (0, db_connection_1.default)(sql, [user.id, user.id]);
            }
            res.status(200).json({ data: result });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                status: false,
                message: 'Error to complete task.',
                error,
            });
        }
    }),
    payout_icon: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        let user = req.user;
        let { id } = req.body;
        // Declare shared variables outside if-else to avoid TS errors
        const deposit_data = new Array(6).fill(0).map(() => ({ count: 0, amount: 0 }));
        const payout_data = new Array(6).fill(0).map(() => ({ count: 0, amount: 0 }));
        // Helper function to calculate data block-wise
        const calculateData = (data, table, rates) => {
            return new Array(6).fill(0).map((_, index) => {
                const label = `${index * 4}-${(index + 1) * 4}`;
                return data
                    .filter(item => item.hr === label && item.tbl === table)
                    .reduce((acc, curr) => {
                    var _a;
                    const rate = ((_a = rates.find(r => r.deposit_currency === curr.currency)) === null || _a === void 0 ? void 0 : _a.rate) || 1;
                    acc.count += curr.count;
                    acc.amount += curr.amount / rate;
                    return acc;
                }, { count: 0, amount: 0 });
            });
        };
        try {
            let result2 = [];
            let result1 = [];
            let deposit_data = [];
            let payout_data = [];
            if (id) {
                const merchantIdArray = id.split(',');
                const sql = `...`; // your big UNION SQL for multiple user_ids
                const sql1 = "SELECT * FROM tbl_user_settled_currency WHERE settled_currency = ?";
                const sql2 = "SELECT symbol FROM countries WHERE sortname = ?";
                const result = yield (0, db_connection_1.default)(sql, [merchantIdArray, merchantIdArray]);
                result1 = yield (0, db_connection_1.default)(sql1, [user.settle_currency]);
                result2 = yield (0, db_connection_1.default)(sql2, [user.settle_currency === 'USDT' ? 'USD' : user.settle_currency]);
                const depositResult = calculateData(result, 1, result1);
                const payoutResult = calculateData(result, 2, result1);
                depositResult.forEach((val, i) => deposit_data[i] = val);
                payoutResult.forEach((val, i) => payout_data[i] = val);
            }
            else {
                const sql = `...`; // your big UNION SQL for a single user_id
                const sql1 = "SELECT * FROM tbl_user_settled_currency WHERE settled_currency = ?";
                const sql2 = "SELECT symbol FROM countries WHERE sortname = ?";
                const result = yield (0, db_connection_1.default)(sql, [user.id, user.id]);
                result1 = yield (0, db_connection_1.default)(sql1, [user.settle_currency]);
                result2 = yield (0, db_connection_1.default)(sql2, [user.settle_currency === 'USDT' ? 'USD' : user.settle_currency]);
                const depositResult = calculateData(result, 1, result1);
                const payoutResult = calculateData(result, 2, result1);
                depositResult.forEach((val, i) => deposit_data[i] = val);
                payoutResult.forEach((val, i) => payout_data[i] = val);
            }
            const dep_count = deposit_data.map(item => item.count);
            const dep_total_val = deposit_data.reduce((total, curr) => total + curr.amount, 0);
            const pay_count = payout_data.map(item => item.count);
            const pay_total_val = payout_data.reduce((total, curr) => total + curr.amount, 0);
            const dep_total = `${dep_total_val > 0 && result2.length ? result2[0].symbol : ''} ${dep_total_val.toFixed(2)}`;
            const pay_total = `${pay_total_val > 0 && result2.length ? result2[0].symbol : ''} ${pay_total_val.toFixed(2)}`;
            res.status(200).json({
                status: true,
                message: "Deposit & Payout icon data - ",
                data: {
                    dep_total,
                    dep_count,
                    pay_total,
                    pay_count
                }
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                status: false,
                message: "Error fetching data",
                error: error.message
            });
        }
    }),
    daily_sale_count_icon: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { id } = req.body;
        try {
            const dayMap = {
                0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed',
                4: 'Thu', 5: 'Fri', 6: 'Sat'
            };
            const getLast7Days = () => {
                return [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return (('0' + d.getDate()).slice(-2) +
                        '-' +
                        ('0' + (d.getMonth() + 1)).slice(-2) +
                        ' ' +
                        dayMap[d.getDay()]);
                }).reverse(); // To list from oldest to newest
            };
            let transactionQuery = '';
            let transactionParams = [];
            const currencyQuery = `
        SELECT deposit_currency, rate FROM tbl_user_settled_currency WHERE settled_currency = ?`;
            let currencyResult = [];
            if (id) {
                const idArray = id.split(',').map((val) => parseInt(val, 10));
                transactionQuery = `
          SELECT DATE_FORMAT(created_on, '%d-%m') AS day, SUM(ammount) AS total, ammount_type AS currency FROM tbl_merchant_transaction WHERE user_id IN (?) AND status = 1 AND DATE(created_on) >= DATE(NOW()) - INTERVAL 6 DAY GROUP BY DATE_FORMAT(created_on, '%d-%m'), currency, ammount_type ORDER BY MIN(created_on) ASC`;
                transactionParams = [idArray];
                currencyResult = yield (0, db_connection_1.default)(currencyQuery, [user.settle_currency]);
            }
            else {
                transactionQuery = `
        SELECT DATE_FORMAT(created_on, '%d-%m') AS day, SUM(ammount) AS total, ammount_type AS currency FROM tbl_merchant_transaction WHERE user_id = ? AND status = 1 AND DATE(created_on) >= DATE(NOW()) - INTERVAL 6 DAY GROUP BY DATE_FORMAT(created_on, '%d-%m'), currency, ammount_type ORDER BY MIN(created_on) ASC`;
                transactionParams = [user.id];
                currencyResult = yield (0, db_connection_1.default)(currencyQuery, [user.settle_currency]);
            }
            const transactionResult = yield (0, db_connection_1.default)(transactionQuery, transactionParams);
            const dates = getLast7Days();
            const data = {};
            for (const dateWithDay of dates) {
                const shortDate = dateWithDay.split(' ')[0];
                const filtered = transactionResult.filter(row => row.day === shortDate);
                data[dateWithDay] = filtered.reduce((sum, row) => {
                    const rateObj = currencyResult.find(r => r.deposit_currency === row.currency);
                    const exchangeRate = (rateObj === null || rateObj === void 0 ? void 0 : rateObj.rate) || 1;
                    return sum + parseFloat((row.total / exchangeRate).toFixed(2));
                }, 0);
            }
            res.status(200).json({
                status: true,
                message: "Daily Sales count - ",
                data,
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                status: false,
                message: 'Error to complete task.',
                error
            });
        }
    }),
    monthly_transaction: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { id } = req.body;
        try {
            let deposit = new Array(12).fill(0);
            let payout = new Array(12).fill(0);
            let result = [];
            if (id) {
                const merchantIdArray = id.split(',');
                const sql = `
            SELECT IF(created_on, 1, 1) as tbl, MONTH(created_on) as month, SUM(ammount) as amount 
            FROM tbl_merchant_transaction 
            WHERE user_id IN (?) AND status = 1 
              AND YEAR(created_on) = YEAR(NOW()) 
              AND MONTH(created_on) >= 1 
            GROUP BY tbl, MONTH(created_on)
            
            UNION 
            
            SELECT IF(created_on, 2, 2) as tbl, MONTH(created_on) as month, SUM(amount) as amount 
            FROM tbl_icici_payout_transaction_response_details 
            WHERE users_id IN (?) AND status = 'SUCCESS' 
              AND YEAR(created_on) = YEAR(NOW()) 
              AND MONTH(created_on) >= 1  
            GROUP BY tbl, MONTH(created_on);
          `;
                result = yield (0, db_connection_1.default)(sql, [merchantIdArray, merchantIdArray]);
            }
            else {
                const sql = `
            SELECT IF(created_on, 1, 1) as tbl, MONTH(created_on) as month, SUM(ammount) as amount 
            FROM tbl_merchant_transaction 
            WHERE user_id = ? AND status = 1 
              AND YEAR(created_on) = YEAR(NOW()) 
              AND MONTH(created_on) >= 1 
            GROUP BY tbl, MONTH(created_on)
            
            UNION 
            
            SELECT IF(created_on, 2, 2) as tbl, MONTH(created_on) as month, SUM(amount) as amount 
            FROM tbl_icici_payout_transaction_response_details 
            WHERE users_id = ? AND status = 'SUCCESS' 
              AND YEAR(created_on) = YEAR(NOW()) 
              AND MONTH(created_on) >= 1  
            GROUP BY tbl, MONTH(created_on);
          `;
                result = yield (0, db_connection_1.default)(sql, [user.id, user.id]);
            }
            // Fill deposit and payout arrays
            for (const row of result) {
                if (row.tbl === 1) {
                    deposit[row.month - 1] = Number(row.amount);
                }
                else {
                    payout[row.month - 1] = Number(row.amount);
                }
            }
            res.status(200).json({
                status: true,
                message: "Last 12 months Transactions of deposit & payout",
                data: {
                    deposit,
                    payout,
                },
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ status: false, message: 'Error to complete task.', error });
        }
        finally {
            console.log("Execution completed.");
        }
    }),
    weekly_transaction: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { id } = req.body;
        try {
            let deposit = new Array(7).fill(0);
            let payout = new Array(7).fill(0);
            let result = [];
            if (id) {
                const merchantIdArray = id.split(',');
                let sql = "SELECT IF(created_on, 1, 1) as tbl, WEEKDAY(created_on) as day, SUM(ammount) as amount FROM tbl_merchant_transaction WHERE user_id IN (?) AND status = 1 AND created_on >= NOW() - INTERVAL WEEKDAY(NOW()) DAY GROUP BY tbl, WEEKDAY(created_on) UNION SELECT IF(created_on, 2, 2) as tbl, WEEKDAY(created_on) as day, SUM(amount) as amount FROM tbl_icici_payout_transaction_response_details WHERE users_id IN (?) AND status = 'SUCCESS' AND created_on >= NOW() - INTERVAL WEEKDAY(NOW()) DAY GROUP BY tbl, WEEKDAY(created_on)";
                let result = (yield (0, db_connection_1.default)(sql, [merchantIdArray, merchantIdArray]));
            }
            else {
                let sql = "SELECT IF(created_on, 1, 1) as tbl, WEEKDAY(created_on) as day, SUM(ammount) as amount FROM tbl_merchant_transaction WHERE user_id = ? AND status = 1 AND created_on >= NOW() - INTERVAL WEEKDAY(NOW()) DAY GROUP BY tbl, WEEKDAY(created_on) UNION SELECT IF(created_on, 2, 2) as tbl, WEEKDAY(created_on) as day, SUM(amount) as amount FROM tbl_icici_payout_transaction_response_details WHERE users_id = ? AND status = 'SUCCESS' AND created_on >= NOW() - INTERVAL WEEKDAY(NOW()) DAY GROUP BY tbl, WEEKDAY(created_on)";
                let result = (yield (0, db_connection_1.default)(sql, [user.id, user.id]));
            }
            for (const row of result) {
                if (row.tbl === 1) {
                    deposit[row.week - 1] = Number(row.amount);
                }
                else {
                    payout[row.week - 1] = Number(row.amount);
                }
            }
            res.status(200).json({
                status: true,
                message: "Last week Transections of deposit & payout",
                data: {
                    deposit,
                    payout,
                },
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ status: false, message: 'Error to complete task.', error });
        }
    }),
    payment_type: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { id } = req.body;
        try {
            let sql;
            let result = [];
            let upi_amt = 0;
            let wallet_amt = 0;
            let card_amt = 0;
            let netbanking_amt = 0;
            let upi_count = 0;
            let wallet_count = 0;
            let card_count = 0;
            let netbanking_count = 0;
            if (id) {
                const merchantIdArray = id.split(',').map((item) => item.trim());
                sql = "SELECT payment_type, ammount FROM tbl_merchant_transaction WHERE user_id IN (?)";
                result = yield (0, db_connection_1.default)(sql, [merchantIdArray]);
            }
            else {
                sql = "SELECT payment_type, ammount FROM tbl_merchant_transaction WHERE user_id = ?";
                result = yield (0, db_connection_1.default)(sql, [user.id]);
            }
            const total_count = result.length;
            for (const item of result) {
                let amount = parseFloat(item.ammount);
                if (isNaN(amount)) {
                    amount = 0;
                }
                switch (item.payment_type) {
                    case 'Card':
                        card_count += 1;
                        card_amt += amount;
                        break;
                    case 'UPI':
                        upi_count += 1;
                        upi_amt += amount;
                        break;
                    case 'NetBanking':
                        netbanking_count += 1;
                        netbanking_amt += amount;
                        break;
                    default:
                        wallet_count += 1;
                        wallet_amt += amount;
                        break;
                }
            }
            const upi_percent = total_count > 0 ? Math.round((upi_count / total_count) * 100) : 0;
            const wallet_percent = total_count > 0 ? Math.round((wallet_count / total_count) * 100) : 0;
            const card_percent = total_count > 0 ? Math.round((card_count / total_count) * 100) : 0;
            const netbanking_percent = total_count > 0 ? Math.round((netbanking_count / total_count) * 100) : 0;
            const data = {
                upi: { total: parseFloat(upi_amt.toFixed(2)), percent: upi_percent },
                card: { total: parseFloat(card_amt.toFixed(2)), percent: card_percent },
                wallet: { total: parseFloat(wallet_amt.toFixed(2)), percent: wallet_percent },
                netbanking: { total: parseFloat(netbanking_amt.toFixed(2)), percent: netbanking_percent },
            };
            res.status(200).json({ status: true, message: "Data sent successfully", data });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ status: false, message: 'Error to complete task.', error });
        }
    }),
    dbycurrency: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { id, today, week, month } = req.body;
        let sql;
        const output = [];
        try {
            if (id) {
                const testQuery = "SELECT solution_apply_for_country FROM tbl_user WHERE id IN (?)";
                const testResult = yield (0, db_connection_1.default)(testQuery, [id]);
                const results = [];
                if (testResult.length > 0 && testResult[0].solution_apply_for_country !== null) {
                    const countryList = testResult[0].solution_apply_for_country.split(',');
                    for (const country of countryList) {
                        const test1Query = "SELECT sortname FROM countries WHERE id = ? ORDER BY name";
                        const test1Result = yield (0, db_connection_1.default)(test1Query, [country]);
                        if (test1Result.length > 0 && test1Result[0].sortname) {
                            results.push(test1Result[0].sortname);
                        }
                    }
                }
                if (today || week || month) {
                    const dateCondition = today
                        ? "DATE(created_on) = DATE(NOW())"
                        : week
                            ? "DATE(created_on) >= DATE_SUB(DATE(NOW()), INTERVAL 6 DAY)"
                            : "DATE(created_on) >= DATE_SUB(DATE(NOW()), INTERVAL 30 DAY)";
                    for (const currency of results) {
                        sql = `SELECT (SELECT COALESCE(SUM(ammount), 0) FROM tbl_merchant_transaction WHERE user_id = ? AND ammount_type = ? AND ${dateCondition}) AS depositSum,(SELECT COALESCE(SUM(amount), 0) FROM tbl_icici_payout_transaction_response_details WHERE users_id = ? AND currency = ? AND ${dateCondition}) AS payoutSum,(SELECT COALESCE(SUM(settlementAmount), 0) FROM tbl_settlement WHERE user_id = ? AND fromCurrency = ? AND ${dateCondition}) AS settlementSum`;
                        const result = yield (0, db_connection_1.default)(sql, [id, currency, id, currency, id, currency]);
                        if (result.length !== 0) {
                            output.push({
                                currency,
                                depositSum: Number(result[0].depositSum),
                                payoutSum: Number(result[0].payoutSum),
                                settlementSum: Number(result[0].settlementSum),
                                net: Number(result[0].depositSum) + Number(result[0].settlementSum) - Number(result[0].payoutSum),
                            });
                        }
                    }
                    res.status(200).json({
                        message: today ? "Today data" : week ? "Weekly data" : "Monthly data",
                        data: output,
                    });
                }
            }
            else {
                const testQuery = "SELECT solution_apply_for_country FROM tbl_user WHERE id = ?";
                const testResult = yield (0, db_connection_1.default)(testQuery, [user.id]);
                const results = [];
                if (testResult.length > 0 && testResult[0].solution_apply_for_country !== null) {
                    const countryList = testResult[0].solution_apply_for_country.split(',');
                    for (const country of countryList) {
                        const test1Query = "SELECT sortname FROM countries WHERE id = ? ORDER BY name";
                        const test1Result = yield (0, db_connection_1.default)(test1Query, [country]);
                        if (test1Result.length > 0 && test1Result[0].sortname) {
                            results.push(test1Result[0].sortname);
                        }
                    }
                }
                if (today || week || month) {
                    const dateCondition = today
                        ? "DATE(created_on) = DATE(NOW())"
                        : week
                            ? "DATE(created_on) >= DATE_SUB(DATE(NOW()), INTERVAL 6 DAY)"
                            : "DATE(created_on) >= DATE_SUB(DATE(NOW()), INTERVAL 30 DAY)";
                    for (const currency of results) {
                        sql = `SELECT (SELECT COALESCE(SUM(ammount), 0) FROM tbl_merchant_transaction WHERE user_id = ? AND status = 1 AND ammount_type = ? AND ${dateCondition}) AS depositSum,(SELECT COALESCE(SUM(amount), 0) FROM tbl_icici_payout_transaction_response_details WHERE users_id = ? AND status = 'SUCCESS' AND currency = ? AND ${dateCondition}) AS payoutSum, (SELECT COALESCE(SUM(settlementAmount), 0) FROM tbl_settlement WHERE user_id = ? AND status = 1 AND fromCurrency = ? AND ${dateCondition}) AS settlementSum`;
                        const result = yield (0, db_connection_1.default)(sql, [user.id, currency, user.id, currency, user.id, currency]);
                        if (result.length !== 0) {
                            output.push({
                                currency,
                                depositSum: Number(result[0].depositSum),
                                payoutSum: Number(result[0].payoutSum),
                                settlementSum: Number(result[0].settlementSum),
                                net: Number(result[0].depositSum) + Number(result[0].settlementSum) - Number(result[0].payoutSum),
                            });
                        }
                    }
                    res.status(200).json({
                        message: today ? "Today data" : week ? "Weekly data" : "Monthly data",
                        data: output,
                    });
                }
            }
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ status: false, message: "Error to complete task.", error });
        }
    })
};
exports.default = dashboardCount;

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
const MerchantReports = {
    accountSummary: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        const { id, from, to, From, To } = req.body;
        try {
            const merchantIdArray = id ? id.split(",") : [ID.toString()];
            const params = [...merchantIdArray];
            const dateDepoConditions = [];
            const datePayConditions = [];
            const dateSettConditions = [];
            const buildDateConditions = (tableName, conditionsArray) => {
                if (from && to) {
                    conditionsArray.push(`DATE(${tableName}.created_on) >= ? AND DATE(${tableName}.created_on) <= ?`);
                    params.push(from, to);
                }
                if (From && To) {
                    conditionsArray.push(`DATE(${tableName}.updated_on) >= ? AND DATE(${tableName}.updated_on) <= ?`);
                    params.push(From, To);
                }
            };
            buildDateConditions("tbl_merchant_transaction", dateDepoConditions);
            buildDateConditions("tbl_icici_payout_transaction_response_details", datePayConditions);
            buildDateConditions("tbl_settlement", dateSettConditions);
            const dateDepoWhereClause = dateDepoConditions.length ? ` AND ${dateDepoConditions.join(" AND ")}` : "";
            const datePayWhereClause = datePayConditions.length ? ` AND ${datePayConditions.join(" AND ")}` : "";
            const dateSettWhereClause = dateSettConditions.length ? ` AND ${dateSettConditions.join(" AND ")}` : "";
            const formattedDepositDateFields = `DATE_FORMAT(tbl_merchant_transaction.created_on, '%Y-%m-%d %H:%i:%s') AS created_on,
            DATE_FORMAT(tbl_merchant_transaction.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on`;
            const formattedPayoutDateFields = `DATE_FORMAT(tbl_icici_payout_transaction_response_details.created_on, '%Y-%m-%d %H:%i:%s') AS created_on,
            DATE_FORMAT(tbl_icici_payout_transaction_response_details.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on`;
            const formattedSettlementDateFields = `DATE_FORMAT(tbl_settlement.created_on, '%Y-%m-%d %H:%i:%s') AS created_on,
            DATE_FORMAT(tbl_settlement.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on`;
            const sqlQueries = {
                deposit: `SELECT tbl_user.name, tbl_merchant_transaction.*, ${formattedDepositDateFields} FROM tbl_merchant_transaction LEFT JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id WHERE tbl_merchant_transaction.user_id IN (${merchantIdArray.map(() => "?").join(",")}) AND tbl_merchant_transaction.status IN (1) ${dateDepoWhereClause}`,
                payout: `SELECT tbl_user.name, tbl_icici_payout_transaction_response_details.*, ${formattedPayoutDateFields} FROM tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id IN (${merchantIdArray.map(() => "?").join(", ")}) AND tbl_icici_payout_transaction_response_details.status = 'SUCCESS' ${datePayWhereClause}`,
                localSettlement: `SELECT tbl_user.name, tbl_settlement.*, ${formattedSettlementDateFields} FROM tbl_settlement LEFT JOIN tbl_user ON tbl_user.id = tbl_settlement.user_id WHERE tbl_settlement.user_id IN (${merchantIdArray.map(() => "?").join(", ")}) AND settlement_mode = 2 AND tbl_settlement.status = 1 ${dateSettWhereClause}`,
                internationalSettlement: `SELECT tbl_user.name, tbl_settlement.*, ${formattedSettlementDateFields} FROM tbl_settlement LEFT JOIN tbl_user ON tbl_user.id = tbl_settlement.user_id WHERE tbl_settlement.user_id IN (${merchantIdArray.map(() => "?").join(", ")})  AND settlement_mode = 1 AND tbl_settlement.status = 1 ${dateSettWhereClause}`,
            };
            const [merchantTxns, payoutTxns, localSettlementTxns, internationalSettlementTxns,] = yield Promise.all([
                (0, db_connection_1.default)(sqlQueries.deposit, params),
                (0, db_connection_1.default)(sqlQueries.payout, params),
                (0, db_connection_1.default)(sqlQueries.localSettlement, params),
                (0, db_connection_1.default)(sqlQueries.internationalSettlement, params),
            ]);
            const workbook = new exceljs_1.default.Workbook();
            const autoSize = (ws) => {
                var _a;
                (_a = ws.columns) === null || _a === void 0 ? void 0 : _a.forEach((col) => {
                    var _a;
                    if (!col)
                        return;
                    let max = 0;
                    (_a = col.eachCell) === null || _a === void 0 ? void 0 : _a.call(col, { includeEmpty: true }, (cell) => {
                        const val = cell.value ? cell.value.toString().length : 0;
                        if (val > max)
                            max = val;
                    });
                    col.width = max + 5;
                });
            };
            const addBorderToCell = (sheet, cellAddress) => {
                const cell = sheet.getCell(cellAddress);
                cell.border = {
                    top: { style: "thick", color: { argb: "FF0000FF" } },
                    left: { style: "thick", color: { argb: "FF0000FF" } },
                    bottom: { style: "thick", color: { argb: "FF0000FF" } },
                    right: { style: "thick", color: { argb: "FF0000FF" } },
                };
            };
            // --- Deposits Sheet
            const depositSheet = workbook.addWorksheet("Deposits");
            depositSheet.mergeCells("A1:K1");
            depositSheet.getCell("A1").value = "SUCCESSFUL DEPOSITS";
            depositSheet.getCell("A1").font = { size: 16, bold: true };
            depositSheet.getRow(1).alignment = { horizontal: "center" };
            depositSheet.addRow([]);
            depositSheet.addRow([
                "Sr. No",
                "Merchant",
                "Order No",
                "Currency",
                "Payment Method",
                "Status",
                "Requested Deposit Amount",
                "Charges",
                "Net Deposit Amount",
                "Created On",
                "Updated On",
            ]).font = { bold: true };
            merchantTxns.forEach((row, i) => {
                var _a, _b, _c, _d;
                const charges = parseFloat(((_a = row.payin_charges) === null || _a === void 0 ? void 0 : _a.toString()) || "0") + parseFloat(((_b = row.gst_charges) === null || _b === void 0 ? void 0 : _b.toString()) || "0");
                const net = parseFloat(((_c = row.ammount) === null || _c === void 0 ? void 0 : _c.toString()) || "0") - charges;
                depositSheet.addRow([
                    i + 1,
                    `${row.user_id} - ${row.name}`,
                    row.txn_id,
                    row.ammount_type,
                    row.payment_type,
                    "SUCCESS",
                    parseFloat(((_d = row.ammount) === null || _d === void 0 ? void 0 : _d.toString()) || "0"),
                    charges,
                    net,
                    row.created_on,
                    row.updated_on,
                ]);
            });
            const depositCurrencyTotals = {};
            merchantTxns.forEach((row) => {
                var _a, _b, _c;
                const currency = row.ammount_type || "UNKNOWN";
                const amount = parseFloat(((_a = row.ammount) === null || _a === void 0 ? void 0 : _a.toString()) || "0");
                const charges = parseFloat(((_b = row.payin_charges) === null || _b === void 0 ? void 0 : _b.toString()) || "0") + parseFloat(((_c = row.gst_charges) === null || _c === void 0 ? void 0 : _c.toString()) || "0");
                const net = amount - charges;
                if (!depositCurrencyTotals[currency]) {
                    depositCurrencyTotals[currency] = { amount: 0, charges: 0, net: 0 };
                }
                depositCurrencyTotals[currency].amount += amount;
                depositCurrencyTotals[currency].charges += charges;
                depositCurrencyTotals[currency].net += net;
            });
            depositSheet.addRow([]);
            depositSheet.addRow([]);
            const rowDIndex = depositSheet.rowCount;
            depositSheet.mergeCells(`D${rowDIndex}:H${rowDIndex}`);
            depositSheet.getCell(`E${rowDIndex}`).value = "CURRENCY-WISE TOTALS";
            depositSheet.getCell(`E${rowDIndex}`).font = { size: 16, bold: true };
            depositSheet.getCell(`E${rowDIndex}`).alignment = {
                horizontal: "center",
            };
            addBorderToCell(depositSheet, `E${rowDIndex}`);
            depositSheet.addRow([]);
            depositSheet.addRow(["", "", "", "CURRENCY", "AMOUNT", "CHARGES", "NET DEPOSIT"]).font = { bold: true };
            Object.entries(depositCurrencyTotals).forEach(([currency, totals]) => { depositSheet.addRow(["", "", "", currency, totals.amount, totals.charges, totals.net,]).font = { bold: true }; });
            autoSize(depositSheet);
            // Payout sheet
            const payoutSheet = workbook.addWorksheet("Payouts");
            payoutSheet.mergeCells("A1:P1");
            const titleCell = payoutSheet.getCell("A1");
            titleCell.value = "SUCCESSFUL PAYOUTS";
            titleCell.font = { size: 16, bold: true };
            payoutSheet.getRow(1).alignment = { horizontal: "center" };
            payoutSheet.addRow([]);
            payoutSheet.addRow([
                "Sr. No",
                "Merchant",
                "Payout ID",
                "UTR Number",
                "Transaction Type",
                "Payee Name",
                "Credit Account",
                "Bank Name",
                "IFSC",
                "Currency",
                "Status",
                "Request Payout Amount",
                "Charges",
                "Net Payout Amount",
                "Created On",
                "Updated On",
            ]).font = { bold: true };
            payoutTxns.forEach((row, i) => {
                const akonto = parseFloat(row.akonto_charge || "0");
                const gst = parseFloat(row.gst_amount || "0");
                const bank = parseFloat(row.bank_charges || "0");
                const charges = parseFloat((akonto + gst + bank).toFixed(2));
                const netPayout = parseFloat((Number(row.amount) + charges).toFixed(2));
                payoutSheet.addRow([
                    i + 1,
                    `${row.users_id} - ${row.name}`,
                    row.uniqueid,
                    row.utrnumber,
                    row.trx_type,
                    row.payee_name,
                    row.creditacc,
                    row.bank_name,
                    row.ifsc,
                    row.currency,
                    row.status,
                    Number(row.amount),
                    charges,
                    netPayout,
                    row.created_on,
                    row.updated_on,
                ]);
            });
            autoSize(payoutSheet);
            // Local Sheet
            const localSettlementSheet = workbook.addWorksheet("Local Settlements");
            localSettlementSheet.mergeCells("A1:M1");
            localSettlementSheet.getCell("A1").value = "SUCCESSFUL LOCAL SETTLEMENTS";
            localSettlementSheet.getCell("A1").font = { size: 16, bold: true };
            localSettlementSheet.getRow(1).alignment = { horizontal: "center" };
            localSettlementSheet.addRow([]);
            localSettlementSheet.addRow([
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
            ]).font = { bold: true };
            localSettlementTxns.forEach((row, i) => {
                const charges = row.totalCharges ? parseFloat(row.totalCharges) : 0;
                const requestedAmount = parseFloat(row.requestedAmount);
                const netSettlement = parseFloat((requestedAmount - charges).toFixed(2));
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
                localSettlementSheet.addRow([
                    i + 1,
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
            });
            const localCurrencyTotals = {};
            localSettlementTxns.forEach((row) => {
                const currency = row.fromCurrency || "UNKNOWN";
                const amount = parseFloat(row.requestedAmount || "0");
                const charges = parseFloat(row.totalCharges || "0");
                const net = amount - charges;
                if (!localCurrencyTotals[currency]) {
                    localCurrencyTotals[currency] = { amount: 0, charges: 0, net: 0 };
                }
                localCurrencyTotals[currency].amount += amount;
                localCurrencyTotals[currency].charges += charges;
                localCurrencyTotals[currency].net += net;
            });
            localSettlementSheet.addRow([]);
            localSettlementSheet.addRow([]);
            const rowSIndex = localSettlementSheet.rowCount + 1;
            localSettlementSheet.mergeCells(`D${rowSIndex}:H${rowSIndex}`);
            localSettlementSheet.addRow([
                "",
                "",
                "",
                "CURRENCY",
                "AMOUNT",
                "CHARGES",
                "NET SETTLEMENT",
            ]).font = { bold: true };
            localSettlementSheet.getCell(`E${rowSIndex}`).value = "CURRENCY-WISE TOTALS";
            localSettlementSheet.getCell(`E${rowSIndex}`).font = { size: 16, bold: true };
            localSettlementSheet.getCell(`E${rowSIndex}`).alignment = { horizontal: "center" };
            addBorderToCell(localSettlementSheet, `E${rowSIndex}`);
            localSettlementSheet.addRow([]);
            localSettlementSheet.addRow([]);
            Object.entries(localCurrencyTotals).forEach(([currency, totals]) => {
                localSettlementSheet.addRow([
                    "",
                    "",
                    "",
                    currency,
                    totals.amount,
                    totals.charges,
                    totals.net,
                ]).font = { bold: true };
            });
            localSettlementSheet.addRow([]);
            autoSize(localSettlementSheet);
            // International Sheet
            const sheet = workbook.addWorksheet("International Settlements");
            sheet.mergeCells("A1:T1");
            sheet.getCell("A1").value = "SUCCESSFUL INTERNATIONAL SETTLEMENTS";
            sheet.getCell("A1").font = { size: 16, bold: true };
            sheet.getRow(1).alignment = { horizontal: "center" };
            sheet.addRow([]);
            sheet.addRow([
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
            ]).font = { bold: true };
            internationalSettlementTxns.forEach((row, i) => {
                const charges = row.totalCharges ? parseFloat(row.totalCharges) : 0;
                const requestedAmount = parseFloat(row.requestedAmount);
                const exchangeRate = row.exchangeRate ? parseFloat(row.exchangeRate) : 1;
                const netSettlement = (((requestedAmount - charges) / exchangeRate) || 0).toFixed(2);
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
                    default:
                        statusLabel = "UNKNOWN";
                }
                sheet.addRow([
                    i + 1,
                    `${row.user_id} - ${row.name}`,
                    row.settlementId,
                    row.fromCurrency,
                    row.toCurrency || "",
                    statusLabel,
                    row.accountNumber ? parseFloat(row.accountNumber) : "",
                    row.bankName,
                    row.branchName,
                    row.city || "",
                    row.country || "",
                    row.zipCode || "",
                    row.swiftCode || "",
                    requestedAmount,
                    exchangeRate,
                    charges,
                    parseFloat(netSettlement),
                    row.settlementTime || "",
                    row.created_on,
                    row.updated_on,
                ]);
            });
            const internationalCurrencyTotals = {};
            internationalSettlementTxns.forEach((row) => {
                const currency = row.fromCurrency || "UNKNOWN";
                const amount = parseFloat(row.requestedAmount || "0");
                const charges = parseFloat(row.totalCharges || "0");
                const net = amount - charges;
                if (!internationalCurrencyTotals[currency]) {
                    internationalCurrencyTotals[currency] = { amount: 0, charges: 0, net: 0 };
                }
                internationalCurrencyTotals[currency].amount += amount;
                internationalCurrencyTotals[currency].charges += charges;
                internationalCurrencyTotals[currency].net += net;
            });
            sheet.addRow([]);
            sheet.addRow([]);
            const rowIndex = sheet.rowCount + 1;
            sheet.mergeCells(`D${rowIndex}:H${rowIndex}`);
            sheet.addRow([
                "",
                "",
                "",
                "CURRENCY",
                "AMOUNT",
                "CHARGES",
                "NET SETTLEMENT",
            ]).font = { bold: true };
            sheet.getCell(`E${rowIndex}`).value = "CURRENCY-WISE TOTALS";
            sheet.getCell(`E${rowIndex}`).font = { size: 16, bold: true };
            sheet.getCell(`E${rowIndex}`).alignment = { horizontal: "center" };
            addBorderToCell(sheet, `E${rowIndex}`);
            sheet.addRow([]);
            sheet.addRow([]);
            Object.entries(internationalCurrencyTotals).forEach(([currency, totals]) => {
                sheet.addRow([
                    "",
                    "",
                    "",
                    currency,
                    totals.amount,
                    totals.charges,
                    totals.net,
                ]).font = { bold: true };
            });
            autoSize(sheet);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Merchant_Summary.xlsx");
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }),
    depositTypeReport: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        const { id, from, to, From, To } = req.body;
        try {
            const merchantIds = id ? id.split(",") : [ID.toString()];
            const params = [...merchantIds];
            const dateConditions = [];
            if (from && to) {
                dateConditions.push(`DATE(tbl_merchant_transaction.created_on) >= ? AND DATE(tbl_merchant_transaction.created_on) <= ?`);
                params.push(from, to);
            }
            if (From && To) {
                dateConditions.push(`DATE(tbl_merchant_transaction.updated_on) >= ? AND DATE(tbl_merchant_transaction.updated_on) <= ?`);
                params.push(From, To);
            }
            const whereClause = `WHERE tbl_merchant_transaction.user_id IN (${merchantIds.map(() => "?").join(", ")}) AND tbl_merchant_transaction.status = 1 ${dateConditions.length ? `AND ${dateConditions.join(" AND ")}` : ""}`;
            const query = `SELECT tbl_user.name,tbl_merchant_transaction.*, DATE_FORMAT(tbl_merchant_transaction.created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_merchant_transaction.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_merchant_transaction LEFT JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id ${whereClause} ORDER BY tbl_merchant_transaction.created_on DESC`;
            const resultData = yield (0, db_connection_1.default)(query, params);
            const workbook = new exceljs_1.default.Workbook();
            const worksheet = workbook.addWorksheet("Deposits");
            const autoSize = (ws) => {
                var _a;
                (_a = ws.columns) === null || _a === void 0 ? void 0 : _a.forEach((col) => {
                    let max = 0;
                    if (col.eachCell) {
                        col.eachCell({ includeEmpty: true }, (cell) => {
                            const val = cell.value ? cell.value.toString() : "";
                            max = Math.max(max, val.length);
                        });
                    }
                    col.width = max + 5;
                });
            };
            const setBlueBorder = (ws, cellAddress) => {
                const cell = ws.getCell(cellAddress);
                cell.border = {
                    top: { style: 'thick', color: { argb: 'FF0000FF' } },
                    left: { style: 'thick', color: { argb: 'FF0000FF' } },
                    bottom: { style: 'thick', color: { argb: 'FF0000FF' } },
                    right: { style: 'thick', color: { argb: 'FF0000FF' } },
                };
            };
            worksheet.mergeCells("A1:K1");
            worksheet.getCell("A1").value = "DEPOSITS";
            worksheet.getCell("A1").font = { size: 16, bold: true };
            worksheet.getRow(1).alignment = { horizontal: "center" };
            worksheet.addRow([]);
            worksheet.addRow([
                "Sr. No", "Merchant", "Order No", "Currency", "Payment Method", "Status",
                "Requested Deposit Amount", "Charges", "Net Deposit Amount", "Created On", "Updated On"
            ]);
            worksheet.getRow(3).font = { bold: true };
            resultData.forEach((row, index) => {
                const payinCharges = parseFloat(row.payin_charges || "0");
                const gstCharges = parseFloat(row.gst_charges || "0");
                const charges = +(payinCharges + gstCharges).toFixed(2);
                const netDeposit = +(parseFloat(row.ammount) - charges).toFixed(2);
                worksheet.addRow([
                    index + 1,
                    `${row.user_id} - ${row.name}`,
                    row.txn_id,
                    row.ammount_type,
                    row.payment_type,
                    "SUCCESS",
                    parseFloat(row.ammount),
                    charges,
                    netDeposit,
                    row.created_on,
                    row.updated_on,
                ]);
            });
            const totals = {};
            for (const row of resultData) {
                const type = row.payment_type || "UNKNOWN";
                const amount = parseFloat(row.ammount || "0");
                const charge = parseFloat(row.payin_charges || "0") + parseFloat(row.gst_charges || "0");
                const net = amount - charge;
                if (!totals[type]) {
                    totals[type] = { amount: 0, charges: 0, net: 0 };
                }
                totals[type].amount += amount;
                totals[type].charges += charge;
                totals[type].net += net;
            }
            worksheet.addRow([]);
            worksheet.addRow([]);
            const totalTitleRow = worksheet.rowCount + 1;
            worksheet.mergeCells(`D${totalTitleRow}:H${totalTitleRow}`);
            worksheet.getCell(`E${totalTitleRow}`).value = "PAYMENT TYPE-WISE TOTALS";
            worksheet.getCell(`E${totalTitleRow}`).font = { size: 16, bold: true };
            worksheet.getCell(`E${totalTitleRow}`).alignment = { horizontal: "center" };
            setBlueBorder(worksheet, `E${totalTitleRow}`);
            worksheet.addRow([]);
            worksheet.addRow([]);
            Object.entries(totals).forEach(([type, t]) => {
                worksheet.addRow([
                    "", "", "", type,
                    parseFloat(t.amount.toFixed(2)),
                    parseFloat(t.charges.toFixed(2)),
                    parseFloat(t.net.toFixed(2))
                ]).font = { bold: true };
            });
            autoSize(worksheet);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Deposits.xlsx");
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            console.error("Error in depositTypeReport:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }),
    payoutTypeReport: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const user = req.user;
        const ID = user.account_type === 3 ? (_a = user.parent_id) !== null && _a !== void 0 ? _a : user.id : user.id;
        const { id, from, to, From, To } = req.body;
        try {
            const merchantIds = id ? id.split(",") : [ID.toString()];
            const params = [...merchantIds];
            const dateConditions = [];
            if (from && to) {
                dateConditions.push(`DATE(tbl_icici_payout_transaction_response_details.created_on) >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?`);
                params.push(from, to);
            }
            if (From && To) {
                dateConditions.push(`DATE(tbl_icici_payout_transaction_response_details.updated_on) >= ? AND DATE(tbl_icici_payout_transaction_response_details.updated_on) <= ?`);
                params.push(From, To);
            }
            const whereClause = `WHERE tbl_icici_payout_transaction_response_details.users_id IN (${merchantIds.map(() => "?").join(", ")}) AND tbl_icici_payout_transaction_response_details.status = 'SUCCESS' ${dateConditions.length ? `AND ${dateConditions.join(" AND ")}` : ""}`;
            const query = `SELECT tbl_user.name, tbl_icici_payout_transaction_response_details.*, DATE_FORMAT(tbl_icici_payout_transaction_response_details.created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_icici_payout_transaction_response_details.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id ${whereClause} ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC`;
            const resultData = yield (0, db_connection_1.default)(query, params);
            const workbook = new exceljs_1.default.Workbook();
            const worksheet = workbook.addWorksheet("Deposits");
            const autoSize = (ws) => {
                var _a;
                (_a = ws.columns) === null || _a === void 0 ? void 0 : _a.forEach((col) => {
                    let max = 0;
                    if (col.eachCell) {
                        col.eachCell({ includeEmpty: true }, (cell) => {
                            const val = cell.value ? cell.value.toString() : "";
                            max = Math.max(max, val.length);
                        });
                    }
                    col.width = max + 5;
                });
            };
            const setBlueBorder = (ws, cellAddress) => {
                const cell = ws.getCell(cellAddress);
                cell.border = {
                    top: { style: "thick", color: { argb: "FF0000FF" } },
                    left: { style: "thick", color: { argb: "FF0000FF" } },
                    bottom: { style: "thick", color: { argb: "FF0000FF" } },
                    right: { style: "thick", color: { argb: "FF0000FF" } },
                };
            };
            worksheet.mergeCells("A1:K1");
            worksheet.getCell("A1").value = "DEPOSITS";
            worksheet.getCell("A1").font = { size: 16, bold: true };
            worksheet.getRow(1).alignment = { horizontal: "center" };
            worksheet.addRow([]);
            worksheet.addRow([
                "Sr. No", "Merchant", "Payout ID", "UTR Number", "Transaction Type", "Payee Name",
                "Credit Account", "Bank Name", "IFSC", "Currency", "Status", "Request Payout Amount",
                "Charges", "Net Payout Amount", "Created On", "Updated On"
            ]);
            worksheet.getRow(3).font = { bold: true };
            resultData.forEach((row, index) => {
                var _a, _b, _c, _d;
                const akonto = parseFloat(((_a = row.akonto_charge) === null || _a === void 0 ? void 0 : _a.toString()) || "0");
                const gst = parseFloat(((_b = row.gst_amount) === null || _b === void 0 ? void 0 : _b.toString()) || "0");
                const bank = parseFloat(((_c = row.bank_charges) === null || _c === void 0 ? void 0 : _c.toString()) || "0");
                const amount = parseFloat(((_d = row.amount) === null || _d === void 0 ? void 0 : _d.toString()) || "0");
                const charges = parseFloat((akonto + gst + bank).toFixed(2));
                const netPayout = parseFloat((amount + charges).toFixed(2));
                worksheet.addRow([
                    index + 1,
                    `${row.users_id} - ${row.name}`,
                    row.uniqueid,
                    row.utrnumber,
                    row.trx_type,
                    row.payee_name,
                    row.creditacc,
                    row.bank_name,
                    row.ifsc,
                    row.currency,
                    "SUCCESS",
                    amount,
                    charges,
                    netPayout,
                    row.created_on,
                    row.updated_on,
                ]);
            });
            const totals = {};
            for (const row of resultData) {
                const type = row.trx_type || "UNKNOWN";
                const amount = parseFloat(((_b = row.amount) === null || _b === void 0 ? void 0 : _b.toString()) || "0");
                const charge = parseFloat(((_c = row.akonto_charge) === null || _c === void 0 ? void 0 : _c.toString()) || "0") + parseFloat(((_d = row.gst_amount) === null || _d === void 0 ? void 0 : _d.toString()) || "0") + parseFloat(((_e = row.bank_charges) === null || _e === void 0 ? void 0 : _e.toString()) || "0");
                const net = amount - charge;
                if (!totals[type])
                    totals[type] = { amount: 0, charges: 0, net: 0 };
                totals[type].amount += amount;
                totals[type].charges += charge;
                totals[type].net += net;
            }
            worksheet.addRow([]);
            worksheet.addRow([]);
            const totalTitleRow = worksheet.rowCount + 1;
            worksheet.mergeCells(`D${totalTitleRow}:H${totalTitleRow}`);
            worksheet.getCell(`E${totalTitleRow}`).value = "PAYOUT TYPE-WISE TOTALS";
            worksheet.getCell(`E${totalTitleRow}`).font = { size: 16, bold: true };
            worksheet.getCell(`E${totalTitleRow}`).alignment = { horizontal: "center" };
            setBlueBorder(worksheet, `E${totalTitleRow}`);
            worksheet.addRow([]);
            worksheet.addRow([]);
            Object.entries(totals).forEach(([type, t]) => {
                worksheet.addRow(["", "", "", type, parseFloat(t.amount.toFixed(2)), parseFloat(t.charges.toFixed(2)), parseFloat(t.net.toFixed(2))]).font = { bold: true };
            });
            autoSize(worksheet);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Deposits.xlsx");
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            console.error("Error in downloadDepositReport:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }),
    settlementTypeReport: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const user = req.user;
        const ID = user.account_type === 3 ? (_a = user.parent_id) !== null && _a !== void 0 ? _a : user.id : user.id;
        const { id, from, to, From, To } = req.body;
        try {
            const merchantIds = id ? id.split(",") : [ID.toString()];
            const params = [...merchantIds];
            const dateConditions = [];
            if (from && to) {
                dateConditions.push("DATE(tbl_settlement.created_on) >= ? AND DATE(tbl_settlement.created_on) <= ?");
                params.push(from, to);
            }
            if (From && To) {
                dateConditions.push("DATE(tbl_settlement.updated_on) >= ? AND DATE(tbl_settlement.updated_on) <= ?");
                params.push(From, To);
            }
            const whereClause = `WHERE tbl_settlement.user_id IN (${merchantIds.map(() => "?").join(", ")}) AND tbl_settlement.status = 1
            ${dateConditions.length ? `AND ${dateConditions.join(" AND ")}` : ""}`;
            const query = `SELECT tbl_user.name,tbl_settlement.*, DATE_FORMAT(tbl_settlement.created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_settlement.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_settlement LEFT JOIN tbl_user ON tbl_user.id = tbl_settlement.user_id ${whereClause} ORDER BY tbl_settlement.created_on DESC `;
            const resultData = yield (0, db_connection_1.default)(query, params);
            const localSettlements = resultData.filter((r) => r.settlement_mode === 2);
            const internationalSettlements = resultData.filter((r) => r.settlement_mode === 1);
            const workbook = new exceljs_1.default.Workbook();
            const worksheet = workbook.addWorksheet("Settlements");
            const autoSize = (ws) => {
                ws.columns.forEach((col) => {
                    let max = 0;
                    if (col.eachCell) {
                        col.eachCell({ includeEmpty: true }, (cell) => {
                            const val = cell.value ? cell.value.toString() : "";
                            max = Math.max(max, val.length);
                        });
                    }
                    col.width = max + 5;
                });
            };
            const setBlueBorder = (ws, cellAddress) => {
                const cell = ws.getCell(cellAddress);
                cell.border = {
                    top: { style: "thick", color: { argb: "FF0000FF" } },
                    left: { style: "thick", color: { argb: "FF0000FF" } },
                    bottom: { style: "thick", color: { argb: "FF0000FF" } },
                    right: { style: "thick", color: { argb: "FF0000FF" } },
                };
            };
            const globalTotals = {};
            const writeSection = (title, data, isLocal) => {
                worksheet.addRow([]);
                const titleRow = worksheet.rowCount + 1;
                worksheet.mergeCells(`A${titleRow}:K${titleRow}`);
                worksheet.getCell(`A${titleRow}`).value = title;
                worksheet.getCell(`A${titleRow}`).font = { size: 14, bold: true };
                worksheet.getRow(titleRow).alignment = { horizontal: "center" };
                worksheet.addRow([]);
                worksheet.addRow(isLocal ? [
                    "Sr. No",
                    "Merchant",
                    "Settlement ID",
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
                ] :
                    [
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
                worksheet.getRow(worksheet.rowCount).font = { bold: true };
                data.forEach((row, index) => {
                    const charges = parseFloat((row.totalCharges || 0).toString());
                    const amount = parseFloat((row.requestedAmount || 0).toString());
                    const exchangeRate = parseFloat((row.exchangeRate || 1).toString());
                    const netSettlement = isLocal ? parseFloat((amount - charges).toFixed(2)) : parseFloat(((amount - charges) / exchangeRate).toFixed(2));
                    const statusLabel = row.status === 0 ? "FAILED" : row.status === 1 ? "SUCCESS" : "PENDING";
                    if (!globalTotals[row.settlementType]) {
                        globalTotals[row.settlementType] = { amount: 0, charges: 0, net: 0 };
                    }
                    globalTotals[row.settlementType].amount += amount;
                    globalTotals[row.settlementType].charges += charges;
                    globalTotals[row.settlementType].net += netSettlement;
                    worksheet.addRow(isLocal ? [
                        index + 1,
                        `${row.user_id} - ${row.name}`,
                        row.settlementId,
                        row.fromCurrency,
                        statusLabel,
                        row.accountNumber || "",
                        row.bankName || "",
                        row.branchName || "",
                        amount,
                        charges,
                        netSettlement,
                        row.created_on,
                        row.updated_on,
                    ] :
                        [
                            index + 1,
                            `${row.user_id} - ${row.name}`,
                            row.settlementId,
                            row.fromCurrency,
                            row.toCurrency,
                            statusLabel,
                            row.accountNumber || "",
                            row.bankName || "",
                            row.branchName || "",
                            row.city || "",
                            row.country || "",
                            row.zip_code || "",
                            row.swiftCode || "",
                            amount,
                            exchangeRate,
                            charges,
                            netSettlement,
                            row.settlement_time || "",
                            row.created_on,
                            row.updated_on,
                        ]);
                });
            };
            writeSection("LOCAL SETTLEMENTS", localSettlements, true);
            writeSection("INTERNATIONAL SETTLEMENTS", internationalSettlements, false);
            worksheet.addRow([]);
            worksheet.addRow([]);
            const finalTitleRow = worksheet.rowCount + 1;
            worksheet.mergeCells(`D${finalTitleRow}:H${finalTitleRow}`);
            worksheet.getCell(`E${finalTitleRow}`).value = `TRANSACTION TYPE-WISE TOTALS`;
            worksheet.getCell(`E${finalTitleRow}`).font = { size: 14, bold: true };
            worksheet.getCell(`E${finalTitleRow}`).alignment = { horizontal: "center" };
            setBlueBorder(worksheet, `E${finalTitleRow}`);
            worksheet.addRow([]);
            worksheet.addRow([]);
            Object.entries(globalTotals).forEach(([type, t]) => {
                worksheet.addRow([
                    "",
                    "",
                    "",
                    type,
                    parseFloat(t.amount.toFixed(2)),
                    parseFloat(t.charges.toFixed(2)),
                    parseFloat(t.net.toFixed(2)),
                ]).font = { bold: true };
            });
            autoSize(worksheet);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Settlements.xlsx");
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            console.error("Error in settlementTypeReport:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }),
    chargebackTypeReport: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const user = req.user;
        const ID = user.account_type === 3 ? (_a = user.parent_id) !== null && _a !== void 0 ? _a : user.id : user.id;
        const { id, from, to, From, To } = req.body;
        try {
            const merchantIds = id ? id.split(",") : [ID.toString()];
            const params = [...merchantIds];
            const dateConditions = [];
            if (from && to) {
                dateConditions.push("DATE(tbl_merchant_transaction_chargeback_refund.created_on) >= ? AND DATE(tbl_merchant_transaction_chargeback_refund.created_on) <= ?");
                params.push(from, to);
            }
            if (From && To) {
                dateConditions.push("DATE(tbl_merchant_transaction_chargeback_refund.updated_on) >= ? AND DATE(tbl_merchant_transaction_chargeback_refund.updated_on) <= ?");
                params.push(From, To);
            }
            const whereClause = `WHERE tbl_merchant_transaction_chargeback_refund.user_id IN (${merchantIds.map(() => "?").join(", ")}) AND tbl_merchant_transaction_chargeback_refund.status = 5 ${dateConditions.length ? `AND ${dateConditions.join(" AND ")}` : ""}`;
            const query = `SELECT tbl_user.name,tbl_merchant_transaction_chargeback_refund.*, DATE_FORMAT(tbl_merchant_transaction_chargeback_refund.created_on, '%Y-%m-%d %H:%i:%s') AS created_on,DATE_FORMAT(tbl_merchant_transaction_chargeback_refund.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_merchant_transaction_chargeback_refund LEFT JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction_chargeback_refund.user_id ${whereClause} ORDER BY tbl_merchant_transaction_chargeback_refund.created_on DESC`;
            const resultData = yield (0, db_connection_1.default)(query, params);
            const workbook = new exceljs_1.default.Workbook();
            const worksheet = workbook.addWorksheet("Deposits");
            const autoSize = (ws) => {
                var _a;
                (_a = ws.columns) === null || _a === void 0 ? void 0 : _a.forEach((col) => {
                    let max = 0;
                    if (col.eachCell) {
                        col.eachCell({ includeEmpty: true }, (cell) => {
                            const val = cell.value ? cell.value.toString() : "";
                            max = Math.max(max, val.length);
                        });
                    }
                    col.width = max + 5;
                });
            };
            const setBlueBorder = (ws, cellAddress) => {
                const cell = ws.getCell(cellAddress);
                cell.border = {
                    top: { style: "thick", color: { argb: "FF0000FF" } },
                    left: { style: "thick", color: { argb: "FF0000FF" } },
                    bottom: { style: "thick", color: { argb: "FF0000FF" } },
                    right: { style: "thick", color: { argb: "FF0000FF" } },
                };
            };
            worksheet.mergeCells("A1:K1");
            worksheet.getCell("A1").value = "CHARGEBACKS";
            worksheet.getCell("A1").font = { size: 16, bold: true };
            worksheet.getRow(1).alignment = { horizontal: "center" };
            worksheet.addRow([]);
            worksheet.addRow([
                "Sr. No",
                "Merchant",
                "Order No",
                "Currency",
                "Payment Method",
                "Status",
                "Requested Deposit Amount",
                "Charges",
                "Net Deposit Amount",
                "Created On",
                "Updated On",
            ]);
            worksheet.getRow(3).font = { bold: true };
            resultData.forEach((row, index) => {
                const charges = +(parseFloat(row.payin_charges || "0") + parseFloat(row.gst_charges || "0")).toFixed(2);
                const netDeposit = +(parseFloat(row.ammount) - charges).toFixed(2);
                const statusMap = {
                    5: "CHARGEBACK",
                };
                const statusLabel = statusMap[row.status] || "UNKNOWN";
                worksheet.addRow([
                    index + 1,
                    `${row.user_id} - ${row.name}`,
                    row.txn_id,
                    row.ammount_type,
                    row.payment_type,
                    statusLabel,
                    parseFloat(row.ammount),
                    charges,
                    netDeposit,
                    row.created_on,
                    row.updated_on,
                ]);
            });
            const depositCurrencyTotals = {};
            resultData.forEach((row) => {
                const currency = row.ammount_type || "UNKNOWN";
                const amount = parseFloat(row.ammount || "0");
                const charges = parseFloat(row.payin_charges || "0") + parseFloat(row.gst_charges || "0");
                const net = amount - charges;
                if (!depositCurrencyTotals[currency]) {
                    depositCurrencyTotals[currency] = { amount: 0, charges: 0, net: 0 };
                }
                depositCurrencyTotals[currency].amount += amount;
                depositCurrencyTotals[currency].charges += charges;
                depositCurrencyTotals[currency].net += net;
            });
            worksheet.addRow([]);
            worksheet.addRow([]);
            const rowDIndex = worksheet.rowCount + 1;
            worksheet.mergeCells(`D${rowDIndex}:H${rowDIndex}`);
            worksheet.addRow([
                "",
                "",
                "",
                "CURRENCY",
                "AMOUNT",
                "CHARGES",
                "NET DEPOSIT",
            ]).font = { bold: true };
            worksheet.getCell(`E${rowDIndex}`).value = "CURRENCY-WISE TOTALS";
            worksheet.getCell(`E${rowDIndex}`).font = { size: 16, bold: true };
            worksheet.getCell(`E${rowDIndex}`).alignment = { horizontal: "center", };
            setBlueBorder(worksheet, `E${rowDIndex}`);
            worksheet.addRow([]);
            worksheet.addRow([]);
            Object.entries(depositCurrencyTotals).forEach(([currency, totals]) => {
                worksheet.addRow([
                    "",
                    "",
                    "",
                    currency,
                    totals.amount,
                    totals.charges,
                    totals.net,
                ]).font = { bold: true };
            });
            autoSize(worksheet);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Deposits.xlsx");
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            console.error("Error in chargebackTypeReport:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }),
    refundTypeReport: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const user = req.user;
        const ID = user.account_type === 3 ? (_a = user.parent_id) !== null && _a !== void 0 ? _a : user.id : user.id;
        const { id, from, to, From, To } = req.body;
        try {
            const merchantIds = id ? id.split(",") : [ID.toString()];
            const params = [...merchantIds];
            const dateConditions = [];
            if (from && to) {
                dateConditions.push("DATE(tbl_merchant_transaction_chargeback_refund.created_on) >= ? AND DATE(tbl_merchant_transaction_chargeback_refund.created_on) <= ?");
                params.push(from, to);
            }
            if (From && To) {
                dateConditions.push("DATE(tbl_merchant_transaction_chargeback_refund.updated_on) >= ? AND DATE(tbl_merchant_transaction_chargeback_refund.updated_on) <= ?");
                params.push(From, To);
            }
            const whereClause = `WHERE tbl_merchant_transaction_chargeback_refund.user_id IN (${merchantIds.map(() => "?").join(", ")}) AND tbl_merchant_transaction_chargeback_refund.status = 4 ${dateConditions.length ? `AND ${dateConditions.join(" AND ")}` : ""}`;
            const query = `SELECT tbl_user.name, tbl_merchant_transaction_chargeback_refund.*, DATE_FORMAT(tbl_merchant_transaction_chargeback_refund.created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_merchant_transaction_chargeback_refund.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_onFROM tbl_merchant_transaction_chargeback_refund LEFT JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction_chargeback_refund.user_id ${whereClause} ORDER BY tbl_merchant_transaction_chargeback_refund.created_on DESC`;
            const resultData = yield (0, db_connection_1.default)(query, params);
            const workbook = new exceljs_1.default.Workbook();
            const worksheet = workbook.addWorksheet("Deposits");
            const autoSize = (ws) => {
                ws.columns.forEach((col) => {
                    let max = 0;
                    if (col.eachCell) {
                        col.eachCell({ includeEmpty: true }, (cell) => {
                            const val = cell.value ? cell.value.toString() : "";
                            max = Math.max(max, val.length);
                        });
                    }
                    col.width = max + 5;
                });
            };
            const setBlueBorder = (ws, cellAddress) => {
                const cell = ws.getCell(cellAddress);
                cell.border = {
                    top: { style: 'thick', color: { argb: 'FF0000FF' } },
                    left: { style: 'thick', color: { argb: 'FF0000FF' } },
                    bottom: { style: 'thick', color: { argb: 'FF0000FF' } },
                    right: { style: 'thick', color: { argb: 'FF0000FF' } },
                };
            };
            worksheet.mergeCells("A1:K1");
            worksheet.getCell("A1").value = "REFUNDS";
            worksheet.getCell("A1").font = { size: 16, bold: true };
            worksheet.getRow(1).alignment = { horizontal: "center" };
            worksheet.addRow([]);
            worksheet.addRow(["Sr. No", "Merchant", "Order No", "Currency", "Payment Method", "Status",
                "Requested Deposit Amount", "Charges", "Net Deposit Amount", "Created On", "Updated On"]);
            worksheet.getRow(3).font = { bold: true };
            resultData.forEach((row, index) => {
                const charges = +(parseFloat(row.payin_charges || "0") + parseFloat(row.gst_charges || "0")).toFixed(2);
                const netDeposit = +(parseFloat(row.ammount || "0") - charges).toFixed(2);
                const statusMap = { 5: "REFUND" };
                const statusLabel = statusMap[row.status] || "UNKNOWN";
                worksheet.addRow([
                    index + 1,
                    `${row.user_id} - ${row.name}`,
                    row.txn_id,
                    row.ammount_type,
                    row.payment_type,
                    statusLabel,
                    parseFloat(row.ammount),
                    charges,
                    netDeposit,
                    row.created_on,
                    row.updated_on
                ]);
            });
            const depositCurrencyTotals = {};
            resultData.forEach((row) => {
                const currency = row.ammount_type || "UNKNOWN";
                const amount = parseFloat(row.ammount || "0");
                const charges = parseFloat(row.payin_charges || "0") + parseFloat(row.gst_charges || "0");
                const net = amount - charges;
                if (!depositCurrencyTotals[currency]) {
                    depositCurrencyTotals[currency] = { amount: 0, charges: 0, net: 0 };
                }
                depositCurrencyTotals[currency].amount += amount;
                depositCurrencyTotals[currency].charges += charges;
                depositCurrencyTotals[currency].net += net;
            });
            worksheet.addRow([]);
            worksheet.addRow([]);
            const rowDIndex = worksheet.rowCount + 1;
            worksheet.mergeCells(`D${rowDIndex}:H${rowDIndex}`);
            worksheet.addRow([
                "", "", "", "CURRENCY", "AMOUNT", "CHARGES", "NET DEPOSIT"
            ]).font = { bold: true };
            worksheet.getCell(`E${rowDIndex}`).value = "CURRENCY-WISE TOTALS";
            worksheet.getCell(`E${rowDIndex}`).font = { size: 16, bold: true };
            worksheet.getCell(`E${rowDIndex}`).alignment = { horizontal: "center" };
            setBlueBorder(worksheet, `E${rowDIndex}`);
            worksheet.addRow([]);
            worksheet.addRow([]);
            Object.entries(depositCurrencyTotals).forEach(([currency, totals]) => {
                worksheet.addRow([
                    "", "", "", currency,
                    totals.amount,
                    totals.charges,
                    totals.net
                ]).font = { bold: true };
            });
            autoSize(worksheet);
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Deposits.xlsx");
            yield workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            console.error("Error in refundTypeReport:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    })
};
exports.default = MerchantReports;

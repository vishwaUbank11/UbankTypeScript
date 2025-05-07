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
const TransactionStatement = {
    statement: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        let user = req.user;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        let { id, month, year } = req.body;
        const sqlSolutionApply = "SELECT solution_apply_for_country AS userCountry FROM `tbl_user` WHERE id = ?";
        const resultSolutionApply = yield (0, db_connection_1.default)(sqlSolutionApply, [ID]);
        let usersCountry = [];
        for (let i = 0; i < resultSolutionApply.length; i++) {
            let usersCountryData = resultSolutionApply[i].userCountry;
            let dataArray = usersCountryData.split(",").map((item) => item.trim());
            usersCountry = usersCountry.concat(dataArray);
        }
        const sqlCurrency = "SELECT sortname AS currency FROM `countries` WHERE id IN(?) AND status = 1";
        const resultCurrency = yield (0, db_connection_1.default)(sqlCurrency, [usersCountry]);
        const curr = resultCurrency.map((item) => item.currency);
        const sqlCurrencyRate = "SELECT rate AS Rate, deposit_currency AS depositCurrency FROM `tbl_settled_currency` WHERE deposit_currency IN (?)";
        const resultCurrencyRate = yield (0, db_connection_1.default)(sqlCurrencyRate, [curr]);
        let rate = [];
        for (let i = 0; i < curr.length; i++) {
            for (let j = 0; j < resultCurrencyRate.length; j++) {
                if (resultCurrencyRate[j].depositCurrency === curr[i]) {
                    rate.push(resultCurrencyRate[j].Rate);
                    break;
                }
            }
        }
        let now = new Date();
        function set_time(year, month) {
            now.setUTCFullYear(year);
            now.setUTCMonth(month - 1);
            now.setDate(1);
            now.setUTCHours(0);
            now.setUTCMinutes(0);
            now.setUTCSeconds(1);
            return now;
        }
        try {
            const now_time = set_time(year, month);
            let months = '';
            const monthsMap = { 1: "JANUARY", 2: "FEBRUARY", 3: "MARCH", 4: "APRIL", 5: "MAY", 6: "JUNE", 7: "JULY", 8: "AUGUST", 9: "SEPTEMBER", 10: "OCTOBER", 11: "NOVEMBER", 12: "DECEMBER" };
            months = monthsMap[month];
            if (id) {
                const sqlDetails = "SELECT name, email, id FROM tbl_user WHERE id IN(?)";
                const resultDetails = yield (0, db_connection_1.default)(sqlDetails, [id]);
                const sqlDeposit = "SELECT SUM(ammount) as deposit FROM tbl_merchant_transaction WHERE status=1 AND created_on <= ?";
                const resultDeposite = yield (0, db_connection_1.default)(sqlDeposit, [now_time]);
                const sqlPayout = "SELECT SUM(amount) as payout FROM tbl_icici_payout_transaction_response_details WHERE status='SUCCESS' AND created_on <= ?";
                const resultPayout = yield (0, db_connection_1.default)(sqlPayout, [now_time]);
                const sqlSettlement = "SELECT SUM(requestedAmount) as settlement FROM tbl_settlement WHERE status=1 AND created_on <= ?";
                const resultSettlement = yield (0, db_connection_1.default)(sqlSettlement, [now_time]);
                const sqlDepositsPayoutSettlement = "SELECT (SELECT COALESCE(SUM(ammount),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as depositSum, (SELECT COALESCE(SUM(ammount),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND status = 4 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as refundsAmount, (SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+ COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND status = 4 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as refundFees, (SELECT COALESCE(SUM(ammount),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND status = 5 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as chargebackAmount, (SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+ COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND status = 5 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as chargebackFees, 0 as accountFees, (SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+ COALESCE(SUM(rolling_reverse_amount),0)+ COALESCE(SUM(our_bank_charge_gst),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as depositCommissions, 0 as anyotherCharges, (SELECT COALESCE(SUM(amount),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as payouts, (SELECT COALESCE(SUM(gst_amount),0)+ COALESCE(SUM(akonto_charge),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as payoutCommissions, (SELECT COALESCE(SUM(akonto_charge),0)+ COALESCE(SUM(bank_charges),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as bankaccountCharges,  (SELECT COALESCE(SUM(requestedAmount),0) FROM tbl_settlement WHERE user_id IN(?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as settlements, (SELECT COALESCE(SUM(totalCharges),0) FROM tbl_settlement WHERE user_id IN(?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as settlementCharges, (SELECT COALESCE(SUM(settlementAmount),0) FROM tbl_settlement WHERE user_id IN(?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as netSettlement,0 as anyotherCharges";
                const result1 = yield (0, db_connection_1.default)(sqlDepositsPayoutSettlement, [
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                ]);
                const sqlCommissionCharges = "SELECT x.depositCharge+x.chargebackFee+x.refundFee+x.payoutCharge+x.settlementCharge as commissions ,x.ubankconnectDepositsCharges,x.ubankconnectRefundCharges,x.ubankconnectChargebackCharges,x.ubankconnectPayoutCharges,x.ubankconnectOtherCharges,x.bankCharges,x.tax FROM (SELECT (SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id IN(?)  AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as depositCharge, (SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id IN(?)  AND status = 5 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as chargebackFee,(SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND status = 4 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as refundFee,(SELECT COALESCE(SUM(bank_charges),0)+COALESCE(SUM(akonto_charge),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as payoutCharge,(SELECT COALESCE(SUM(charges),0) FROM tbl_settlement WHERE user_id IN(?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as settlementCharge,(SELECT COALESCE(SUM(our_bank_charge),0) FROM tbl_merchant_transaction WHERE user_id IN(?)  AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as ubankconnectDepositsCharges, (SELECT COALESCE(SUM(our_bank_charge),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND status = 4 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as ubankconnectRefundCharges, (SELECT COALESCE(SUM(our_bank_charge),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND status = 5 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as ubankconnectChargebackCharges, (SELECT COALESCE(SUM(bank_charges),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as ubankconnectPayoutCharges, 0 as ubankconnectOtherCharges, 0 as bankCharges, 0 as tax) as x";
                const result4 = yield (0, db_connection_1.default)(sqlCommissionCharges, [
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                    id,
                    month,
                    year,
                ]);
                const beginningBalance = resultDeposite[0].deposit - (resultPayout[0].payout + resultSettlement[0].settlement);
                const add1 = result1[0].payouts + result1[0].settlements + result4[0].commissions - result1[0].depositSum;
                const dbc = [];
                const rbc = [];
                const cbc = [];
                const pbc = [];
                const sbc = [];
                const ccc = [];
                for (let i = 0; i < curr.length; i++) {
                    const paramsCommon = [curr[i], rate[i], id, curr[i], month, year];
                    const sqlDepositCurrency = "SELECT ? as currency, x.Amount, x.charges, x.Amount - x.charges as NetAmount, (x.Amount - x.charges)/(SELECT ? as rate) AS Settlement_Amount FROM ( SELECT (SELECT COALESCE(SUM(ammount), 0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND ammount_type = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as Amount, (SELECT COALESCE(SUM(tax_amt), 0) + COALESCE(SUM(payin_charges), 0) + COALESCE(SUM(rolling_reverse_amount), 0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND ammount_type = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as charges ) as x";
                    const sqlRefundCurrency = "SELECT ? as currency,x.Amount,x.charges,x.Amount-x.charges as NetAmount, (x.Amount - x.charges) /(SELECT ? as rate) as Settlement_Amount FROM (SELECT (SELECT COALESCE(SUM(ammount),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND ammount_type = ? AND status = 4 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as Amount,(SELECT COALESCE(SUM(tax_amt),0)+ COALESCE(SUM(payin_charges),0)+ COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND ammount_type = ? AND status = 4 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as charges) as x";
                    const sqlChargebackCurrency = "SELECT ? as currency,x.Amount,x.charges,x.Amount-x.charges as NetAmount, (x.Amount - x.charges) /(SELECT ? as rate) as Settlement_Amount FROM (SELECT (SELECT COALESCE(SUM(ammount),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND ammount_type = ? AND status = 5 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as Amount,(SELECT COALESCE(SUM(tax_amt),0)+ COALESCE(SUM(payin_charges),0)+ COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND ammount_type = ? AND status = 5 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as charges) as x";
                    const sqlPayoutCurrency = "SELECT ? as currency,x.Amount, x.charges,x.Amount-x.charges as NetAmount, (x.Amount-x.charges)/(SELECT ? as rate) as Settlement_Amount FROM (SELECT (SELECT COALESCE(SUM(amount),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND currency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as Amount,(SELECT COALESCE(SUM(bank_charges),0)+ COALESCE(SUM(akonto_charge),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND currency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as charges) as x";
                    const sqlSettlementCurrency = "SELECT ? as currency,x.Amount,x.charges,x.Amount-x.charges as NetAmount,(x.Amount-x.charges)/(SELECT ? as rate) as Settlement_Amount FROM (SELECT (SELECT COALESCE(SUM(requestedAmount),0) FROM tbl_settlement WHERE user_id IN(?) AND fromCurrency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as Amount, (SELECT COALESCE(SUM(charges),0) FROM tbl_settlement WHERE user_id IN(?) AND fromCurrency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as charges) as x";
                    const sqlCommissionChargesCurrency = "SELECT ? as currency,x.DepositAmount,x.DepositCharges,x.PayoutAmount,x.PayoutCharges,x.SettlementAmount,x.SettlementCharges,x.OtherCharges, ((x.DepositAmount-x.DepositCharges)-((x.PayoutAmount-x.PayoutCharges)+(x.SettlementAmount-x.SettlementCharges)))/(SELECT ? as rate) as TotalAmount FROM (SELECT (SELECT COALESCE(SUM(ammount),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND ammount_type = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as DepositAmount, (SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+ COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id IN(?) AND ammount_type = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as DepositCharges, (SELECT COALESCE(SUM(amount),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND currency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as PayoutAmount, (SELECT COALESCE(SUM(bank_charges),0)+COALESCE(SUM(akonto_charge),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND currency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as PayoutCharges, (SELECT COALESCE(SUM(requestedAmount),0) FROM tbl_settlement WHERE user_id IN(?) AND fromCurrency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as SettlementAmount, (SELECT COALESCE(SUM(charges),0) FROM tbl_settlement WHERE user_id IN(?) AND fromCurrency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as SettlementCharges, 0 as OtherCharges) as x";
                    const resultDepositCurrency = yield (0, db_connection_1.default)(sqlDepositCurrency, [...paramsCommon, id, curr[i], month, year,]);
                    const resultRefundCurrency = yield (0, db_connection_1.default)(sqlRefundCurrency, [...paramsCommon, id, curr[i], month, year, id, curr[i], month, year,]);
                    const resultChargebackCurrency = yield (0, db_connection_1.default)(sqlChargebackCurrency, [...paramsCommon, id, curr[i], month, year, id, curr[i], month, year,]);
                    const resultPayoutCurrency = yield (0, db_connection_1.default)(sqlPayoutCurrency, [curr[i], rate[i], id, curr[i], month, year, id, curr[i], month, year,]);
                    const resultSettlementCurrency = yield (0, db_connection_1.default)(sqlSettlementCurrency, [curr[i], rate[i], id, curr[i], month, year, id, curr[i], month, year,]);
                    const resultCommissionChargesCurrency = yield (0, db_connection_1.default)(sqlCommissionChargesCurrency, [curr[i], rate[i], id, curr[i], month, year, id, curr[i], month, year, id, curr[i], month, year, id, curr[i], month, year, id, curr[i], month, year, id, curr[i], month, year,]);
                    dbc.push(resultDepositCurrency[0]);
                    rbc.push(resultRefundCurrency[0]);
                    cbc.push(resultChargebackCurrency[0]);
                    pbc.push(resultPayoutCurrency[0]);
                    sbc.push(resultSettlementCurrency[0]);
                    ccc.push(resultCommissionChargesCurrency[0]);
                }
                const addAmount = add1 + dbc.reduce((acc, v) => acc + v.Settlement_Amount, 0) + rbc.reduce((acc, v) => acc + v.Settlement_Amount, 0) + cbc.reduce((acc, v) => acc + v.Settlement_Amount, 0) + pbc.reduce((acc, v) => acc + v.Settlement_Amount, 0) + sbc.reduce((acc, v) => acc + v.Settlement_Amount, 0) + ccc.reduce((acc, v) => acc + v.TotalAmount, 0);
                const EndingBalance = beginningBalance - addAmount;
                res.status(200).json({
                    data: {
                        details: resultDetails,
                        message: `FINANCIAL STATEMENT FOR ${months} - ${year}`,
                        BeginningBalance: beginningBalance,
                        EndingBalance,
                        deposits: result1,
                        cac: result4,
                        dbc,
                        rbc,
                        cbc,
                        pbc,
                        sbc,
                        ccc,
                    },
                });
            }
            else {
                const sqlDetails = "SELECT name, email, id FROM tbl_user WHERE id = (?)";
                const resultDetails = yield (0, db_connection_1.default)(sqlDetails, [ID]);
                const sqlDeposit = "SELECT SUM(ammount) as deposit FROM tbl_merchant_transaction WHERE status=1 AND created_on <= ?";
                const resultDeposite = yield (0, db_connection_1.default)(sqlDeposit, [now_time]);
                const sqlPayout = "SELECT SUM(amount) as payout FROM tbl_icici_payout_transaction_response_details WHERE status='SUCCESS' AND created_on <= ?";
                const resultPayout = yield (0, db_connection_1.default)(sqlPayout, [now_time]);
                const sqlSettlement = "SELECT SUM(requestedAmount) as settlement FROM tbl_settlement WHERE status=1 AND created_on <= ?";
                const resultSettlement = yield (0, db_connection_1.default)(sqlSettlement, [now_time]);
                const sqlDepositsPayoutSettlement = "SELECT (SELECT COALESCE(SUM(ammount),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as depositSum, (SELECT COALESCE(SUM(ammount),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND status = 4 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as refundsAmount, (SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+ COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND status = 4 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as refundFees, (SELECT COALESCE(SUM(ammount),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND status = 5 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as chargebackAmount, (SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+ COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND status = 5 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as chargebackFees, 0 as accountFees, (SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+ COALESCE(SUM(rolling_reverse_amount),0)+ COALESCE(SUM(our_bank_charge_gst),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as depositCommissions, 0 as anyotherCharges, (SELECT COALESCE(SUM(amount),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as payouts, (SELECT COALESCE(SUM(gst_amount),0)+ COALESCE(SUM(akonto_charge),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id = (?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as payoutCommissions, (SELECT COALESCE(SUM(akonto_charge),0)+ COALESCE(SUM(bank_charges),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id = (?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as bankaccountCharges,  (SELECT COALESCE(SUM(requestedAmount),0) FROM tbl_settlement WHERE user_id = (?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as settlements, (SELECT COALESCE(SUM(totalCharges),0) FROM tbl_settlement WHERE user_id = (?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as settlementCharges, (SELECT COALESCE(SUM(settlementAmount),0) FROM tbl_settlement WHERE user_id = (?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as netSettlement,0 as anyotherCharges";
                const result1 = yield (0, db_connection_1.default)(sqlDepositsPayoutSettlement, [
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                ]);
                const sqlCommissionCharges = "SELECT x.depositCharge+x.chargebackFee+x.refundFee+x.payoutCharge+x.settlementCharge as commissions ,x.ubankconnectDepositsCharges,x.ubankconnectRefundCharges,x.ubankconnectChargebackCharges,x.ubankconnectPayoutCharges,x.ubankconnectOtherCharges,x.bankCharges,x.tax FROM (SELECT (SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id = (?)  AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as depositCharge, (SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id = (?)  AND status = 5 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as chargebackFee,(SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND status = 4 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as refundFee,(SELECT COALESCE(SUM(bank_charges),0)+COALESCE(SUM(akonto_charge),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as payoutCharge,(SELECT COALESCE(SUM(charges),0) FROM tbl_settlement WHERE user_id = (?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as settlementCharge,(SELECT COALESCE(SUM(our_bank_charge),0) FROM tbl_merchant_transaction WHERE user_id = (?)  AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as ubankconnectDepositsCharges, (SELECT COALESCE(SUM(our_bank_charge),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND status = 4 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as ubankconnectRefundCharges, (SELECT COALESCE(SUM(our_bank_charge),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND status = 5 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as ubankconnectChargebackCharges, (SELECT COALESCE(SUM(bank_charges),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as ubankconnectPayoutCharges, 0 as ubankconnectOtherCharges, 0 as bankCharges, 0 as tax) as x";
                const result4 = yield (0, db_connection_1.default)(sqlCommissionCharges, [
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                    ID,
                    month,
                    year,
                ]);
                const beginningBalance = resultDeposite[0].deposit - (resultPayout[0].payout + resultSettlement[0].settlement);
                const add1 = result1[0].payouts + result1[0].settlements + result4[0].commissions - result1[0].depositSum;
                const dbc = [];
                const rbc = [];
                const cbc = [];
                const pbc = [];
                const sbc = [];
                const ccc = [];
                for (let i = 0; i < curr.length; i++) {
                    const paramsCommon = [curr[i], rate[i], id, curr[i], month, year];
                    const sqlDepositCurrency = "SELECT ? as currency, x.Amount, x.charges, x.Amount - x.charges as NetAmount, (x.Amount - x.charges)/(SELECT ? as rate) AS Settlement_Amount FROM ( SELECT (SELECT COALESCE(SUM(ammount), 0) FROM tbl_merchant_transaction WHERE user_id = (?) AND ammount_type = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as Amount, (SELECT COALESCE(SUM(tax_amt), 0) + COALESCE(SUM(payin_charges), 0) + COALESCE(SUM(rolling_reverse_amount), 0) FROM tbl_merchant_transaction WHERE user_id = (?) AND ammount_type = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as charges ) as x";
                    const sqlRefundCurrency = "SELECT ? as currency,x.Amount,x.charges,x.Amount-x.charges as NetAmount, (x.Amount - x.charges) /(SELECT ? as rate) as Settlement_Amount FROM (SELECT (SELECT COALESCE(SUM(ammount),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND ammount_type = ? AND status = 4 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as Amount,(SELECT COALESCE(SUM(tax_amt),0)+ COALESCE(SUM(payin_charges),0)+ COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND ammount_type = ? AND status = 4 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as charges) as x";
                    const sqlChargebackCurrency = "SELECT ? as currency,x.Amount,x.charges,x.Amount-x.charges as NetAmount, (x.Amount - x.charges) /(SELECT ? as rate) as Settlement_Amount FROM (SELECT (SELECT COALESCE(SUM(ammount),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND ammount_type = ? AND status = 5 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as Amount,(SELECT COALESCE(SUM(tax_amt),0)+ COALESCE(SUM(payin_charges),0)+ COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND ammount_type = ? AND status = 5 AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as charges) as x";
                    const sqlPayoutCurrency = "SELECT ? as currency,x.Amount, x.charges,x.Amount-x.charges as NetAmount, (x.Amount-x.charges)/(SELECT ? as rate) as Settlement_Amount FROM (SELECT (SELECT COALESCE(SUM(amount),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND currency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as Amount,(SELECT COALESCE(SUM(bank_charges),0)+ COALESCE(SUM(akonto_charge),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND currency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as charges) as x";
                    const sqlSettlementCurrency = "SELECT ? as currency,x.Amount,x.charges,x.Amount-x.charges as NetAmount,(x.Amount-x.charges)/(SELECT ? as rate) as Settlement_Amount FROM (SELECT (SELECT COALESCE(SUM(requestedAmount),0) FROM tbl_settlement WHERE user_id = (?) AND fromCurrency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as Amount, (SELECT COALESCE(SUM(charges),0) FROM tbl_settlement WHERE user_id = (?) AND fromCurrency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as charges) as x";
                    const sqlCommissionChargesCurrency = "SELECT ? as currency,x.DepositAmount,x.DepositCharges,x.PayoutAmount,x.PayoutCharges,x.SettlementAmount,x.SettlementCharges,x.OtherCharges, ((x.DepositAmount-x.DepositCharges)-((x.PayoutAmount-x.PayoutCharges)+(x.SettlementAmount-x.SettlementCharges)))/(SELECT ? as rate) as TotalAmount FROM (SELECT (SELECT COALESCE(SUM(ammount),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND ammount_type = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as DepositAmount, (SELECT COALESCE(SUM(tax_amt),0)+COALESCE(SUM(payin_charges),0)+COALESCE(SUM(our_bank_charge),0)+ COALESCE(SUM(rolling_reverse_amount),0) FROM tbl_merchant_transaction WHERE user_id = (?) AND ammount_type = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as DepositCharges, (SELECT COALESCE(SUM(amount),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND currency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as PayoutAmount, (SELECT COALESCE(SUM(bank_charges),0)+COALESCE(SUM(akonto_charge),0) FROM tbl_icici_payout_transaction_response_details WHERE users_id IN(?) AND currency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as PayoutCharges, (SELECT COALESCE(SUM(requestedAmount),0) FROM tbl_settlement WHERE user_id = (?) AND fromCurrency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as SettlementAmount, (SELECT COALESCE(SUM(charges),0) FROM tbl_settlement WHERE user_id = (?) AND fromCurrency = ? AND MONTH(created_on) = ? AND YEAR(created_on) = ?) as SettlementCharges, 0 as OtherCharges) as x";
                    const resultDepositCurrency = yield (0, db_connection_1.default)(sqlDepositCurrency, [...paramsCommon, ID, curr[i], month, year,]);
                    const resultRefundCurrency = yield (0, db_connection_1.default)(sqlRefundCurrency, [...paramsCommon, ID, curr[i], month, year, ID, curr[i], month, year,]);
                    const resultChargebackCurrency = yield (0, db_connection_1.default)(sqlChargebackCurrency, [...paramsCommon, ID, curr[i], month, year, ID, curr[i], month, year,]);
                    const resultPayoutCurrency = yield (0, db_connection_1.default)(sqlPayoutCurrency, [curr[i], rate[i], ID, curr[i], month, year, ID, curr[i], month, year,]);
                    const resultSettlementCurrency = yield (0, db_connection_1.default)(sqlSettlementCurrency, [curr[i], rate[i], ID, curr[i], month, year, ID, curr[i], month, year,]);
                    const resultCommissionChargesCurrency = yield (0, db_connection_1.default)(sqlCommissionChargesCurrency, [curr[i], rate[i], ID, curr[i], month, year, ID, curr[i], month, year, ID, curr[i], month, year, ID, curr[i], month, year, ID, curr[i], month, year, id, curr[i], month, year,]);
                    dbc.push(resultDepositCurrency[0]);
                    rbc.push(resultRefundCurrency[0]);
                    cbc.push(resultChargebackCurrency[0]);
                    pbc.push(resultPayoutCurrency[0]);
                    sbc.push(resultSettlementCurrency[0]);
                    ccc.push(resultCommissionChargesCurrency[0]);
                }
                const addAmount = add1 + dbc.reduce((acc, v) => acc + v.Settlement_Amount, 0) + rbc.reduce((acc, v) => acc + v.Settlement_Amount, 0) + cbc.reduce((acc, v) => acc + v.Settlement_Amount, 0) + pbc.reduce((acc, v) => acc + v.Settlement_Amount, 0) + sbc.reduce((acc, v) => acc + v.Settlement_Amount, 0) + ccc.reduce((acc, v) => acc + v.TotalAmount, 0);
                const EndingBalance = beginningBalance - addAmount;
                res.status(200).json({
                    data: {
                        details: resultDetails,
                        message: `FINANCIAL STATEMENT FOR ${months} - ${year}`,
                        BeginningBalance: beginningBalance,
                        EndingBalance,
                        deposits: result1,
                        cac: result4,
                        dbc,
                        rbc,
                        cbc,
                        pbc,
                        sbc,
                        ccc,
                    },
                });
            }
        }
        catch (err) {
            console.log(err);
            res.status(500).json({ message: 'Error generating statement', error: err });
        }
    }),
    merchantStatement: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { id, to, from } = req.body;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        const merchantIdArray = id ? id.split(",") : [ID];
        try {
            const userDataRaw = yield (0, db_connection_1.default)("SELECT countries.name as country, countries.sortname as currency, tbl_user.name, tbl_user.email, tbl_user.id FROM tbl_user LEFT JOIN countries ON countries.id = tbl_user.busines_Country WHERE tbl_user.id = ?", [ID]);
            const resultDetails = userDataRaw[0];
            const merchantChargesRaw = yield (0, db_connection_1.default)("SELECT * FROM tbl_merchant_charges WHERE user_id = ?", [ID]);
            const chargeData = merchantChargesRaw[0];
            const response = {
                charges: {
                    UPI: chargeData.payin_upi,
                    CARD: chargeData.payin_card,
                    NETBANKING: chargeData.payin_netbanking,
                    WALLET: chargeData.payin_wallet,
                    QR: chargeData.payin_qr,
                    VAOFFLINE: chargeData.vaoffline,
                    PAYOUT: chargeData.payout_amount,
                    GST: chargeData.gst_amount,
                    REFUND: 400,
                    CHARGEBACK: 400,
                },
            };
            const queryValues = [...merchantIdArray];
            const mtconditions = [`mt.user_id IN (${merchantIdArray.map(() => '?').join(", ")})`];
            const cbrconditions = [`mt.user_id IN (${merchantIdArray.map(() => '?').join(", ")})`];
            const payoutConditions = [`mp.users_id IN (${merchantIdArray.map(() => '?').join(", ")})`];
            const settlementConditions = [`st.user_id IN (${merchantIdArray.map(() => '?').join(", ")})`];
            if (from && to) {
                mtconditions.push("DATE(mt.updated_on) BETWEEN ? AND ?");
                cbrconditions.push("DATE(cbr.updated_on) BETWEEN ? AND ?");
                payoutConditions.push("DATE(mp.updated_on) BETWEEN ? AND ?");
                settlementConditions.push("DATE(st.updated_on) BETWEEN ? AND ?");
                queryValues.push(from, to, from, to, from, to, from, to);
            }
            const successfulTxnsData = (yield (0, db_connection_1.default)(`SELECT payment_type, COUNT(CASE WHEN status = 1 THEN 1 ELSE NULL END) AS successful_txns, SUM(CASE WHEN status = 1 THEN ammount ELSE 0 END) AS successful_amount, SUM(CASE WHEN status = 1 THEN payin_charges ELSE 0 END) AS successful_payin_charges, SUM(CASE WHEN status = 1 THEN gst_charges ELSE 0 END) AS successful_gst_charges
            FROM tbl_merchant_transaction mt WHERE mt.status = 1 AND ${mtconditions.join(" AND ")} GROUP BY payment_type`, queryValues)).map((row) => (Object.assign({}, row)));
            const chargebackRefundData = (yield (0, db_connection_1.default)(`SELECT mt.payment_type, COUNT(CASE WHEN cbr.status = 5 THEN 1 ELSE NULL END) AS chargeback_txns, SUM(CASE WHEN cbr.status = 5 THEN mt.ammount ELSE 0 END) AS chargeback_amount, SUM(CASE WHEN cbr.status = 5 THEN mt.payin_charges ELSE 0 END) AS chargeback_payin_charges, SUM(CASE WHEN cbr.status = 5 THEN mt.gst_charges ELSE 0 END) AS chargeback_gst_charges, COUNT(CASE WHEN cbr.status = 4 THEN 1 ELSE NULL END) AS refund_txns, SUM(CASE WHEN cbr.status = 4 THEN mt.ammount ELSE 0 END) AS refund_amount, SUM(CASE WHEN cbr.status = 4 THEN mt.payin_charges ELSE 0 END) AS refund_payin_charges,
            SUM(CASE WHEN cbr.status = 4 THEN mt.gst_charges ELSE 0 END) AS refund_gst_charges FROM tbl_merchant_transaction mt
            LEFT JOIN tbl_merchant_transaction_chargeback_refund cbr ON mt.txn_id = cbr.txn_id WHERE cbr.status IN (4,5) AND ${cbrconditions.join(" AND ")} GROUP BY mt.payment_type`, queryValues)).map((row) => (Object.assign({}, row)));
            const payoutData = (yield (0, db_connection_1.default)(`SELECT trx_type, COUNT(CASE WHEN status = 'SUCCESS' THEN 1 ELSE NULL END) AS successful_txns, SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END) AS successful_amount, SUM(CASE WHEN status = 'SUCCESS' THEN akonto_charge ELSE 0 END) AS successful_akonto_charge, SUM(CASE WHEN status = 'SUCCESS' THEN gst_amount ELSE 0 END) AS successful_gst_amount, SUM(CASE WHEN status = 'SUCCESS' THEN bank_charges ELSE 0 END) AS successful_bank_charges FROM tbl_icici_payout_transaction_response_details mp  WHERE mp.status = 'SUCCESS' AND ${payoutConditions.join(" AND ")} GROUP BY trx_type`, queryValues)).map((row) => (Object.assign({}, row)));
            const settlementData = (yield (0, db_connection_1.default)(`SELECT settlementType, COUNT(CASE WHEN status = 1 THEN 1 ELSE NULL END) AS successful_txns, SUM(CASE WHEN status = 1 THEN requestedAmount ELSE 0 END) AS successful_amount, SUM(CASE WHEN status = 1 THEN totalCharges ELSE 0 END) AS successful_charges FROM tbl_settlement st WHERE st.status = 1 AND ${settlementConditions.join(" AND ")}GROUP BY settlementType`, queryValues)).map((row) => (Object.assign({}, row)));
            const combinedData = successfulTxnsData.map((successTxn) => {
                const chargebackRefund = chargebackRefundData.find(cbr => cbr.payment_type === successTxn.payment_type);
                return Object.assign(Object.assign({}, successTxn), { chargeback_txns: (chargebackRefund === null || chargebackRefund === void 0 ? void 0 : chargebackRefund.chargeback_txns) || 0, chargeback_amount: (chargebackRefund === null || chargebackRefund === void 0 ? void 0 : chargebackRefund.chargeback_amount) || 0, chargeback_payin_charges: (chargebackRefund === null || chargebackRefund === void 0 ? void 0 : chargebackRefund.chargeback_payin_charges) || 0, chargeback_gst_charges: (chargebackRefund === null || chargebackRefund === void 0 ? void 0 : chargebackRefund.chargeback_gst_charges) || 0, refund_txns: (chargebackRefund === null || chargebackRefund === void 0 ? void 0 : chargebackRefund.refund_txns) || 0, refund_amount: (chargebackRefund === null || chargebackRefund === void 0 ? void 0 : chargebackRefund.refund_amount) || 0, refund_payin_charges: (chargebackRefund === null || chargebackRefund === void 0 ? void 0 : chargebackRefund.refund_payin_charges) || 0, refund_gst_charges: (chargebackRefund === null || chargebackRefund === void 0 ? void 0 : chargebackRefund.refund_gst_charges) || 0 });
            });
            res.json({
                success: true,
                userData: resultDetails,
                payin_summary: combinedData,
                payout_summary: payoutData,
                settlement_summary: settlementData,
                charges: response.charges
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Error occurred",
                error: error.toString(),
            });
        }
    })
};
exports.default = TransactionStatement;

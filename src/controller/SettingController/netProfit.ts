import { Request, Response } from "express";
import mysqlcon from '../../config/db_connection';
let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;

interface CurrencyTotals {
  Currency: string;
  Payout: string;
  Settle: string;
  Deposite: string;
  Chargeback: string;
  Refund: string;
  DepositCharge: string;
  PayCharge: string;
  SettleCharge: string;
  AvailableBalance: string;
  Charges: string;
}

class Profit{

// async defaultProfit(req: Request, res: Response): Promise<void> {
//   try {
//     console.log("**********************************");
    
//     const { date, from, to } = req.body;
//     let dateFilter = '';
//     let params: any[] = [];

//     if (date) {
//       dateFilter = "DATE({alias}.created_on) = ?";
//       params.push(date);
//     } else if (from && to) {
//       dateFilter = "DATE({alias}.created_on) >= ? AND DATE({alias}.created_on) <= ?";
//       params.push(from, to);
//     } else {
//        res.status(400).json({ message: "Invalid date parameters." });
//     }

//     const sql = `
//       SELECT
//         c.sortname AS Currency,

//         -- Deposits & Charges
//         COALESCE(SUM(CASE WHEN mt.status = 1 THEN mt.ammount ELSE 0 END), 0) AS Deposite,
//         COALESCE(SUM(CASE WHEN mt.status = 4 THEN mt.ammount ELSE 0 END), 0) AS Refund,
//         COALESCE(SUM(CASE WHEN mt.status = 5 THEN mt.ammount ELSE 0 END), 0) AS Chargeback,
//         COALESCE(SUM(CASE WHEN mt.status IN (1, 4, 5) THEN (mt.payin_charges + mt.gst_charges) ELSE 0 END), 0) AS DepositCharge,

//         -- Payouts & Charges
//         COALESCE(SUM(pr.amount), 0) AS Payout,
//         COALESCE(SUM(pr.gst_amount + pr.akonto_charge), 0) AS PayCharge,

//         -- Settlements & Charges
//         COALESCE(SUM(st.requestedAmount), 0) AS Settle,
//         COALESCE(SUM(st.charges), 0) AS SettleCharge

//       FROM countries c

//       LEFT JOIN tbl_merchant_transaction mt 
//         ON mt.ammount_type = c.sortname AND ${dateFilter.replace(/{alias}/g, "mt")}
        
//       LEFT JOIN tbl_icici_payout_transaction_response_details pr 
//         ON pr.currency = c.sortname AND pr.status = 'SUCCESS' AND ${dateFilter.replace(/{alias}/g, "pr")}
        
//       LEFT JOIN tbl_settlement st 
//         ON st.fromCurrency = c.sortname AND st.status = 1 AND ${dateFilter.replace(/{alias}/g, "st")}

//       WHERE c.status = 1
//       GROUP BY c.sortname
//     `;

//     const result = await mysqlcon(sql, [...params, ...params, ...params]);

//     const formatted: CurrencyStats[] = result.map((row: any) => {
//       const {
//         Currency, Payout, Settle, Deposite, Chargeback, Refund,
//         DepositCharge, PayCharge, SettleCharge
//       } = row;

//       const AvailableBalance = (parseFloat(Deposite) - (parseFloat(Payout) + parseFloat(Settle))).toFixed(2);
//       const Charges = (parseFloat(DepositCharge) + parseFloat(PayCharge) + parseFloat(SettleCharge)).toFixed(2);

//       return {
//         Currency,
//         Payout: parseFloat(Payout).toFixed(2),
//         Settle: parseFloat(Settle).toFixed(2),
//         Deposite: parseFloat(Deposite).toFixed(2),
//         Chargeback: parseFloat(Chargeback).toFixed(2),
//         Refund: parseFloat(Refund).toFixed(2),
//         DepositCharge: parseFloat(DepositCharge).toFixed(2),
//         PayCharge: parseFloat(PayCharge).toFixed(2),
//         SettleCharge: parseFloat(SettleCharge).toFixed(2),
//         AvailableBalance,
//         Charges
//       };
//     });

//     res.status(200).json({ Currencieswise: formatted });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }

// }

async defaultProfit (req: Request, res: Response) : Promise<void> {
  try {
    const { date, from, to } = req.body;
    const getCurrenciesQuery = "SELECT sortname FROM countries WHERE status = 1";
    const currenciesResult = await mysqlcon(getCurrenciesQuery);
    const Currencies: string[] = currenciesResult.map((row: any) => row.sortname);

    let queryParams: any[] = [];
    let dateFilter = "";
    if (from && to) {
      dateFilter = "WHERE DATE(created_on) >= ? AND DATE(created_on) <= ?";
      queryParams = [from, to];
    } else if (date) {
      dateFilter = "WHERE DATE(created_on) = ?";
      queryParams = [date];
    }

    // Build all queries with date filter
    const queries = {
      payout: `SELECT SUM(amount) AS PayoutCharge, currency AS PayoutCurrency, SUM(gst_amount + akonto_charge) AS charge2 FROM tbl_icici_payout_transaction_response_details ${dateFilter} ${dateFilter ? "AND" : "WHERE"} status = 'SUCCESS' GROUP BY currency`,
      settlement: `SELECT SUM(requestedAmount) AS SettleCharge, fromCurrency AS SettleCurrency, SUM(charges) AS charge3 FROM tbl_settlement ${dateFilter} ${dateFilter ? "AND" : "WHERE"} status = 1 GROUP BY fromCurrency`,
      deposit: `SELECT SUM(ammount) AS DepositCharge, ammount_type AS DepositCurrency FROM tbl_merchant_transaction ${dateFilter} ${dateFilter ? "AND" : "WHERE"} status = 1 GROUP BY ammount_type`,
      chargeback: `SELECT SUM(ammount) AS ChargebackCharge, ammount_type AS ChargebackCurrency FROM tbl_merchant_transaction ${dateFilter} ${dateFilter ? "AND" : "WHERE"} status = 5 GROUP BY ammount_type`,
      refund: `SELECT SUM(ammount) AS RefundCharge, ammount_type AS RefundCurrency FROM tbl_merchant_transaction ${dateFilter} ${dateFilter ? "AND" : "WHERE"} status = 4 GROUP BY ammount_type`,
      charges: `SELECT SUM(payin_charges + gst_charges) AS charge1, ammount_type AS Currency FROM tbl_merchant_transaction ${dateFilter} ${dateFilter ? "AND" : "WHERE"} status IN (1, 4, 5) GROUP BY ammount_type`,
    };

    const [resultPayout, resultSettlement, resultDeposit, resultChargeback, resultRefund, resultCharges] = await Promise.all([
      mysqlcon(queries.payout, queryParams),
      mysqlcon(queries.settlement, queryParams),
      mysqlcon(queries.deposit, queryParams),
      mysqlcon(queries.chargeback, queryParams),
      mysqlcon(queries.refund, queryParams),
      mysqlcon(queries.charges, queryParams),
    ]);

    const Total: CurrencyTotals[] = Currencies.map((currency) => {
      const getSum = (arr: any[], key: string, field: string) => {
        return arr
          .filter((item) => item[key] === currency)
          .reduce((acc, item) => acc + parseFloat(item[field] || 0), 0)
          .toFixed(2);
      };

      const payout = getSum(resultPayout, 'PayoutCurrency', 'PayoutCharge');
      const settle = getSum(resultSettlement, 'SettleCurrency', 'SettleCharge');
      const deposit = getSum(resultDeposit, 'DepositCurrency', 'DepositCharge');
      const chargeback = getSum(resultChargeback, 'ChargebackCurrency', 'ChargebackCharge');
      const refund = getSum(resultRefund, 'RefundCurrency', 'RefundCharge');
      const depositCharge = getSum(resultCharges, 'Currency', 'charge1');
      const payCharge = getSum(resultPayout, 'PayoutCurrency', 'charge2');
      const settleCharge = getSum(resultSettlement, 'SettleCurrency', 'charge3');

      const availableBalance = (parseFloat(deposit) - (parseFloat(payout) + parseFloat(settle))).toFixed(2);
      const totalCharges = (parseFloat(depositCharge) + parseFloat(payCharge) + parseFloat(settleCharge)).toFixed(2);

      return {
        Currency: currency,
        Payout: payout,
        Settle: settle,
        Deposite: deposit,
        Chargeback: chargeback,
        Refund: refund,
        DepositCharge: depositCharge,
        PayCharge: payCharge,
        SettleCharge: settleCharge,
        AvailableBalance: availableBalance,
        Charges: totalCharges,
      };
    });

     res.status(200).json({ Currencieswise: Total });

  } catch (error) {
    console.error("Error in defaultProfit:", error);
     res.status(500).json({ message: "error occurred" });
  }
};

  
}
export default new Profit
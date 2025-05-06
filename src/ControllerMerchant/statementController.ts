import { Request, Response } from 'express';
import mysqlcon from "../config/db_connection";
import { AuthenticatedRequest } from './userInterface';

interface UserData {
    country: string;
    currency: string;
    name: string;
    email: string;
    id: number;
}
  
interface Charges {
    UPI: number;
    CARD: number;
    NETBANKING: number;
    WALLET: number;
    QR: number;
    VAOFFLINE: number;
    PAYOUT: number;
    GST: number;
    REFUND: number;
    CHARGEBACK: number;
}
  
interface TransactionSummary {
    payment_type: string;
    successful_txns: number;
    successful_amount: number;
    successful_payin_charges: number;
    successful_gst_charges: number;
    chargeback_txns: number;
    chargeback_amount: number;
    chargeback_payin_charges: number;
    chargeback_gst_charges: number;
    refund_txns: number;
    refund_amount: number;
    refund_payin_charges: number;
    refund_gst_charges: number;
}
  
interface PayoutSummary {
    trx_type: string;
    successful_txns: number;
    successful_amount: number;
    successful_akonto_charge: number;
    successful_gst_amount: number;
    successful_bank_charges: number;
}
  
interface SettlementSummary {
    settlementType: string;
    successful_txns: number;
    successful_amount: number;
    successful_charges: number;
}


const TransactionStatement = {
    statement: async(req: AuthenticatedRequest, res: Response):Promise<void> =>{

    },

    merchantStatement: async(req: AuthenticatedRequest, res: Response):Promise<void> => {
        const user: any = req.user;
        const { id, to, from } = req.body;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        const merchantIdArray: string[] = id ? id.split(",") : [ID];
        try {
            const userDataRaw = await mysqlcon("SELECT countries.name as country, countries.sortname as currency, tbl_user.name, tbl_user.email, tbl_user.id FROM tbl_user LEFT JOIN countries ON countries.id = tbl_user.busines_Country WHERE tbl_user.id = ?",[ID]);
            const resultDetails: UserData = userDataRaw[0];
            const merchantChargesRaw = await mysqlcon("SELECT * FROM tbl_merchant_charges WHERE user_id = ?",[ID]);
            const chargeData = merchantChargesRaw[0];
            const response: { charges: Charges } = {
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
            const queryValues: any[] = [...merchantIdArray];
            const mtconditions: string[] = [`mt.user_id IN (${merchantIdArray.map(() => '?').join(", ")})`];
            const cbrconditions: string[] = [`mt.user_id IN (${merchantIdArray.map(() => '?').join(", ")})`];
            const payoutConditions: string[] = [`mp.users_id IN (${merchantIdArray.map(() => '?').join(", ")})`];
            const settlementConditions: string[] = [`st.user_id IN (${merchantIdArray.map(() => '?').join(", ")})`];
            if (from && to) {
              mtconditions.push("DATE(mt.updated_on) BETWEEN ? AND ?");
              cbrconditions.push("DATE(cbr.updated_on) BETWEEN ? AND ?");
              payoutConditions.push("DATE(mp.updated_on) BETWEEN ? AND ?");
              settlementConditions.push("DATE(st.updated_on) BETWEEN ? AND ?");
              queryValues.push(from, to, from, to, from, to, from, to);
            }
            const successfulTxnsData: TransactionSummary[] = (await mysqlcon(`SELECT payment_type, COUNT(CASE WHEN status = 1 THEN 1 ELSE NULL END) AS successful_txns, SUM(CASE WHEN status = 1 THEN ammount ELSE 0 END) AS successful_amount, SUM(CASE WHEN status = 1 THEN payin_charges ELSE 0 END) AS successful_payin_charges, SUM(CASE WHEN status = 1 THEN gst_charges ELSE 0 END) AS successful_gst_charges
            FROM tbl_merchant_transaction mt WHERE mt.status = 1 AND ${mtconditions.join(" AND ")} GROUP BY payment_type`,queryValues)
            ).map((row: any) => ({ ...row }));
            const chargebackRefundData: any[] = (await mysqlcon(`SELECT mt.payment_type, COUNT(CASE WHEN cbr.status = 5 THEN 1 ELSE NULL END) AS chargeback_txns, SUM(CASE WHEN cbr.status = 5 THEN mt.ammount ELSE 0 END) AS chargeback_amount, SUM(CASE WHEN cbr.status = 5 THEN mt.payin_charges ELSE 0 END) AS chargeback_payin_charges, SUM(CASE WHEN cbr.status = 5 THEN mt.gst_charges ELSE 0 END) AS chargeback_gst_charges, COUNT(CASE WHEN cbr.status = 4 THEN 1 ELSE NULL END) AS refund_txns, SUM(CASE WHEN cbr.status = 4 THEN mt.ammount ELSE 0 END) AS refund_amount, SUM(CASE WHEN cbr.status = 4 THEN mt.payin_charges ELSE 0 END) AS refund_payin_charges,
            SUM(CASE WHEN cbr.status = 4 THEN mt.gst_charges ELSE 0 END) AS refund_gst_charges FROM tbl_merchant_transaction mt
            LEFT JOIN tbl_merchant_transaction_chargeback_refund cbr ON mt.txn_id = cbr.txn_id WHERE cbr.status IN (4,5) AND ${cbrconditions.join(" AND ")} GROUP BY mt.payment_type`, queryValues )
            ).map((row: any) => ({ ...row }));
            const payoutData: PayoutSummary[] = (await mysqlcon(`SELECT trx_type, COUNT(CASE WHEN status = 'SUCCESS' THEN 1 ELSE NULL END) AS successful_txns, SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END) AS successful_amount, SUM(CASE WHEN status = 'SUCCESS' THEN akonto_charge ELSE 0 END) AS successful_akonto_charge, SUM(CASE WHEN status = 'SUCCESS' THEN gst_amount ELSE 0 END) AS successful_gst_amount, SUM(CASE WHEN status = 'SUCCESS' THEN bank_charges ELSE 0 END) AS successful_bank_charges FROM tbl_icici_payout_transaction_response_details mp  WHERE mp.status = 'SUCCESS' AND ${payoutConditions.join(" AND ")} GROUP BY trx_type`, queryValues)
            ).map((row: any) => ({ ...row }));
            const settlementData: SettlementSummary[] = (await mysqlcon(`SELECT settlementType, COUNT(CASE WHEN status = 1 THEN 1 ELSE NULL END) AS successful_txns, SUM(CASE WHEN status = 1 THEN requestedAmount ELSE 0 END) AS successful_amount, SUM(CASE WHEN status = 1 THEN totalCharges ELSE 0 END) AS successful_charges FROM tbl_settlement st WHERE st.status = 1 AND ${settlementConditions.join(" AND ")}GROUP BY settlementType`,queryValues)
            ).map((row: any) => ({ ...row }));
            const combinedData: TransactionSummary[] = successfulTxnsData.map((successTxn) => {
                const chargebackRefund = chargebackRefundData.find(cbr => cbr.payment_type === successTxn.payment_type);
                return {
                    ...successTxn,
                    chargeback_txns: chargebackRefund?.chargeback_txns || 0,
                    chargeback_amount: chargebackRefund?.chargeback_amount || 0,
                    chargeback_payin_charges: chargebackRefund?.chargeback_payin_charges || 0,
                    chargeback_gst_charges: chargebackRefund?.chargeback_gst_charges || 0,
                    refund_txns: chargebackRefund?.refund_txns || 0,
                    refund_amount: chargebackRefund?.refund_amount || 0,
                    refund_payin_charges: chargebackRefund?.refund_payin_charges || 0,
                    refund_gst_charges: chargebackRefund?.refund_gst_charges || 0
                };
            });
            res.json({
              success: true,
              userData: resultDetails,
              payin_summary: combinedData,
              payout_summary: payoutData,
              settlement_summary: settlementData,
              charges: response.charges
            });
        
        } catch (error: any) {
            res.status(500).json({
              message: "Error occurred",
              error: error.toString(),
            });
        }
    }
}
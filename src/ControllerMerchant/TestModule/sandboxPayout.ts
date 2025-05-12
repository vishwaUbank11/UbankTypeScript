import { Request, Response } from 'express';
import mysqlcon from "../../config/db_connection";
import { AuthenticatedRequest } from '../userInterface';

interface PayoutRecord {
  id: number;
  uniqueid: string;
  users_id: number;
  amount: string;
  status: string;
  created_on: string;
  updated_on: string;
  // Add other fields if needed
}


const TestsandboxPayout = {
    sandboxPayoutsDefault : async (req: AuthenticatedRequest, res: Response):Promise<void> =>{
        const user = req.user!;
        const {id,uniqueid,Date: inputDate,from,to,filterType = 1,page = 1}: 
        {
            id?: string;
            uniqueid?: string;
            Date?: string;
            from?: string;
            to?: string;
            filterType?: number;
            page?: number;
        } = req.body;
        const limit = 10;
        const start = (page - 1) * limit;
        const merchantIdArray = id ? id.split(',') : [user?.id?.toString()];
        const filter = Number(filterType);
        const innerJoin = `INNER JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_sandbox_response_details.users_id`;
        let sqlCount = '';
        let sqlData = '';
        let arrCount: any[] = [];
        let arrData: any[] = [];
        try {
            switch (filter) {
                case 1:sqlCount = `SELECT COUNT(*) AS Total FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE users_id IN (?)`;
                arrCount = [merchantIdArray];
                sqlData = `SELECT *, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE users_id IN (?) ORDER BY created_on DESC LIMIT ?, ?`;
                arrData = [merchantIdArray, start, limit];
                break;
                case 2:sqlCount = `SELECT COUNT(*) AS Total FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE users_id IN (?) AND uniqueid LIKE ?`;
                arrCount = [merchantIdArray, uniqueid + '%'];
                sqlData = `SELECT *, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE users_id IN (?) AND uniqueid LIKE ? ORDER BY created_on DESC`;
                arrData = [merchantIdArray, uniqueid + '%'];
                break;
                case 3:sqlCount = `SELECT COUNT(*) AS Total FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE DATE(created_on) = ? AND users_id IN (?)`;
                arrCount = [inputDate, merchantIdArray];
                sqlData = `SELECT *, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_icici_payout_transaction_sandbox_response_details  ${innerJoin}  WHERE DATE(created_on) = ? AND users_id IN (?) ORDER BY created_on DESC LIMIT ?, ?`;
                arrData = [inputDate, merchantIdArray, start, limit];
                break;
                case 4:sqlCount = `SELECT COUNT(*) AS Total FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE DATE(created_on) BETWEEN ? AND ? AND users_id IN (?)`;
                arrCount = [from, to, merchantIdArray];
                sqlData = `SELECT *, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_icici_payout_transaction_sandbox_response_details ${innerJoin} WHERE DATE(created_on) BETWEEN ? AND ? AND users_id IN (?) ORDER BY created_on DESC LIMIT ?, ?`;
                arrData = [from, to, merchantIdArray, start, limit];
                break;
                default:
                res.status(400).json({ message: 'Invalid filter type.' });
            }
            const countResult: any[] = await mysqlcon(sqlCount, arrCount);
            const total = countResult[0]?.Total || 0;
            const totalPage = Math.ceil(total / limit);
            const dataResult: PayoutRecord[] = await mysqlcon(sqlData, arrData);
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
        } catch (error: any) {
            console.error('Error in sandboxPayoutsDefault:', error);
            res.status(500).json({
                Status: 'failed',
                message: 'Internal server error',
                error: error.message,
            });
        }
    },

    sandboxPayoutheader: async (req: AuthenticatedRequest, res: Response):Promise<void> =>{
        const { id } = req.body;
        const user = req.user!;
        if (!user) {
            res.status(401).json({ status: false, message: "Unauthorized user" });
        }
        try {
            const userId = id || user.id;
            const sql = `SELECT SUM(amount) AS amount FROM tbl_icici_payout_transaction_sandbox_response_details WHERE users_id = ? AND status = ?`;
            const [successData, declinedData, pendingData]: any[][] = await Promise.all([mysqlcon(sql, [userId, "SUCCESS"]),mysqlcon(sql, [userId, "FAILURE"]),mysqlcon(sql, [userId, "PENDING"])]);
            const success = successData[0]?.amount || 0;
            const failure = declinedData[0]?.amount || 0;
            const pending = pendingData[0]?.amount || 0;
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

        } catch (error: any) {
            console.error("Error in sandboxPayoutheader:", error);
            res.status(500).json({ status: false, message: "Some error occurred", error: error.message });
        }
    },

    downloadSandboxPayoutReport: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        const user = req.user!;
        const { uniqueid, from, to, id } = req.body;
        if (!user) {
            res.status(401).json({ status: false, message: "Unauthorized user", data: [] });
            return;
        }
        try {
            const userId = id || user.id;
            let sql: string = '';
            let params: any[] = [];
            if (uniqueid !== undefined) {
            sql = `SELECT * FROM tbl_icici_payout_transaction_sandbox_response_details WHERE uniqueid IN (?) AND users_id = ?`;
            params = [uniqueid, userId];
            } else if (from && to) {
            sql = `SELECT * FROM tbl_icici_payout_transaction_sandbox_response_details WHERE users_id = ? AND DATE(created_on) >= ? AND DATE(created_on) <= ?`;
            params = [userId, from, to];
            } else {
            sql = `SELECT * FROM tbl_icici_payout_transaction_sandbox_response_details WHERE users_id = ?`;
            params = [userId];
            }
            const result: any[] = await mysqlcon(sql, params);
            res.send(result);
        } catch (error: any) {
            console.error("Error in downloadSandboxPayoutReport:", error);
            res.status(500).json({ status: false, message: "Some error occurred", data: [] });
        }
    }

}
export default TestsandboxPayout;
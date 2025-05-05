import { Request, Response } from 'express';
import mysqlcon from "../config/db_connection";
import { AuthenticatedRequest } from './userInterface';
import ExcelJS from "exceljs";
import { Column, Cell } from "exceljs"

export interface SettlementRequestBody {
    id?: string;
    from?: string;
    to?: string;
    date?: string;
    page?: number;
    settlementId?: string;
}
  
export interface SettlementRow {
    settlementId: string;
    user_id: number;
    requested_time: string;
    created_on: string;
    [key: string]: any;
}

interface RequestBody {
    settlementId: string;
    settlementType: string;
    fromCurrency: string;
    toCurrency: string;
    walletAddress?: string;
    accountNumber: string;
    bankName: string;
    branchName: string;
    city: string;
    zip_code: string;
    country: string;
    swiftCode: string;
    available_balance: number;
    requestedAmount: number;
    net_amount_for_settlement: number;
    exchangeRate: number;
}

interface CustomRequest {
    id?: number;
    from?: string;
    to?: string;
    date?: string;
}


const pagination = (total: number, page: number) => {
    const limit = 10;
    const numOfPages = Math.ceil(total / limit);
    const start = page * limit - limit;
    return { limit, start, numOfPages };
};

const SettlementTransaction = {

    //➡️ International Settlement

    settlemetnt_Trans : async(req: AuthenticatedRequest, res: Response ): Promise<void> =>{
        const user = req.user!;
        const { id, from, to, date, settlementId, page: pageNum } = req.body as SettlementRequestBody;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        try {
        const Page = pageNum ? Number(pageNum) : 1;
        let total = 0;
        let data: SettlementRow[] = [];
        if (id) {
                const merchantIdArray = id.split(',').map(Number);
                let countQuery = "SELECT COUNT(*) as count FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 1";
                const countResult: any = await mysqlcon(countQuery, [merchantIdArray]);
                if (settlementId) {
                const countSql = "SELECT COUNT(*) as Total FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 1 AND settlementId LIKE ?";
                const result = await mysqlcon(countSql, [merchantIdArray, `${settlementId}%`]);
                total = result[0]?.Total || 0;
                } else if (date) {
                const countSql = "SELECT COUNT(*) as Total FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2 AND DATE(created_on) >= ?";
                const result = await mysqlcon(countSql, [merchantIdArray, date]);
                total = result[0]?.Total || 0;
                } else if (from && to) {
                const countSql = "SELECT COUNT(*) as Total FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2 AND DATE(created_on) BETWEEN ? AND ?";
                const result = await mysqlcon(countSql, [merchantIdArray, from, to]);
                total = result[0]?.Total || 0;
                } else {
                total = countResult[0]?.count || 0;
                }
                const page = pagination(total, Page);
                let query = "SELECT *, DATE_FORMAT(requested_time, '%Y-%m-%d %H:%i:%s') AS requested_time, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 1";
                let params: any[] = [merchantIdArray];
                if (settlementId) {
                query += " AND settlementId LIKE ? ORDER BY created_on DESC LIMIT ?,?";
                params.push(`${settlementId}%`, page.start, page.limit);
                } else if (date) {
                query += " AND DATE(created_on) = ? ORDER BY created_on DESC LIMIT ?,?";
                params.push(date, page.start, page.limit);
                } else if (from && to) {
                query += " AND DATE(created_on) BETWEEN ? AND ? ORDER BY created_on DESC LIMIT ?,?";
                params.push(from, to, page.start, page.limit);
                } else {
                query += " ORDER BY created_on DESC LIMIT ?,?";
                params.push(page.start, page.limit);
                }
                data = await mysqlcon(query, params);
                res.status(200).json({
                message: `Showing ${data.length > 0 ? ((Page - 1) * page.limit + 1) : 0} to ${((Page - 1) * page.limit + data.length)} data from ${total}`,
                currentPage: Page,
                totalPage: page.numOfPages || 1,
                data,
                });

            } else {
                let countQuery = "SELECT COUNT(*) as count FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 1";
                const countResult: any = await mysqlcon(countQuery, [ID]);
                if (settlementId) {
                    const result = await mysqlcon("SELECT COUNT(*) as Total FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 1 AND settlementId LIKE ?", [ID, `${settlementId}%`]);
                    total = result[0]?.Total || 0;
                } else if (date) {
                    const result = await mysqlcon("SELECT COUNT(*) as Total FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 2 AND DATE(created_on) >= ?", [ID, date]);
                    total = result[0]?.Total || 0;
                } else if (from && to) {
                    const result = await mysqlcon("SELECT COUNT(*) as Total FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 2 AND DATE(created_on) BETWEEN ? AND ?", [ID, from, to]);
                    total = result[0]?.Total || 0;
                } else {
                total = countResult[0]?.count || 0;
                }
                const page = pagination(total, Page);
                let query = "SELECT *, DATE_FORMAT(requested_time, '%Y-%m-%d %H:%i:%s') AS requested_time, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 1";
                let params: any[] = [ID];
                if (settlementId) {
                    query += " AND settlementId LIKE ? ORDER BY created_on DESC LIMIT ?,?";
                    params.push(`${settlementId}%`, page.start, page.limit);
                } else if (date) {
                    query += " AND DATE(created_on) = ? ORDER BY created_on DESC LIMIT ?,?";
                    params.push(date, page.start, page.limit);
                } else if (from && to) {
                    query += " AND DATE(created_on) BETWEEN ? AND ? ORDER BY created_on DESC LIMIT ?,?";
                    params.push(from, to, page.start, page.limit);
                } else {
                    query += " ORDER BY created_on DESC LIMIT ?,?";
                    params.push(page.start, page.limit);
                }
                data = await mysqlcon(query, params);
                res.status(200).json({
                    message: `Showing ${data.length > 0 ? ((Page - 1) * page.limit + 1) : 0} to ${((Page - 1) * page.limit + data.length)} data from ${total}`,
                    currentPage: Page,
                    totalPage: page.numOfPages || 1,
                    data,
                });
            }
        } catch (error: any) {
        console.error(error);
        res.status(500).json({
            message: "Error occurred",
            error: error.message,
        });
        }

    },

    requestSettlement : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        try {
            const user = req.user!;
            const ID = user.account_type === 3 ? user.parent_id! : user.id;
            const {
              settlementId,
              settlementType,
              fromCurrency,
              toCurrency,
              walletAddress,
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
              exchangeRate
            } = req.body as RequestBody;

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
            const Settlement = settlementType === 'CRYPTO' ? { ...commonFields, walletAddress } : commonFields;
            const remainingBalance = requestedAmount ? available_balance - requestedAmount : available_balance;
            const insertQuery = 'INSERT INTO tbl_settlement SET ?, requested_time = NOW(), created_on = NOW()';
            const result = await mysqlcon(insertQuery, Settlement);
            const updateWalletQuery = 'UPDATE tbl_user SET wallet = ? WHERE id = ?';
            await mysqlcon(updateWalletQuery, [remainingBalance, ID]);
            if (result.affectedRows > 0) {
              res.status(200).json({
                message: 'Request settlement transaction successful',
                data: result
              });
            } else {
              res.status(201).json({
                message: 'Error while creating settlement',
                data: result
              });
            }
          } catch (error: any) {
            console.error('Settlement Error:', error);
            res.status(500).json({
              message: 'An error occurred during settlement request',
              error: error.message || error
            });
          }

    },

    cardDetails : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        const user = req.user!;
        const ID = user.account_type === 3 ? user.parent_id! : user.id;
        const { id } = req.body as CustomRequest;
        try {
            const targetId = id ?? ID;
            const condition = id ? "WHERE user_id = ? AND settlement_mode = 1" : "WHERE user_id = ?";
            const countSql = `SELECT COUNT(*) as count FROM tbl_settlement ${condition}`;
            const [countResult] = await mysqlcon(countSql, [targetId]);
            const totalCount: number = countResult.count;
            const sumSqls = {
                requestedAmount: `SELECT SUM(requestedAmount) as request FROM tbl_settlement ${condition}`,
                charges: `SELECT SUM(charges) as charges FROM tbl_settlement ${condition}`,
                sentAmount: `SELECT SUM(settlementAmount) as amount FROM tbl_settlement ${condition}`,
                receivedAmount: `SELECT SUM(settlementAmount) as amount FROM tbl_settlement ${condition}`
            };
            const [statusResult0] = await mysqlcon(sumSqls.requestedAmount, [targetId]);
            const [statusResult1] = await mysqlcon(sumSqls.charges, [targetId]);
            const [statusResult4] = await mysqlcon(sumSqls.sentAmount, [targetId]);
            const [statusResult5] = await mysqlcon(sumSqls.receivedAmount, [targetId]);
            const data = [
            {
                name: "Total Settlement Request",
                amount: statusResult0?.request || 0
            },
            {
                name: "Total Fees/Charges",
                amount: statusResult1?.charges || 0
            },
            {
                name: "Total Amount Sent",
                amount: statusResult4?.amount || 0
            },
            {
                name: "Total Amount Received",
                amount: statusResult5?.amount || 0
            }
            ];
            res.status(totalCount === 0 ? 201 : 200).json({ data });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({
            message: "Error occurred",
            error: error.message || error
            });
        }

    },

    downloadReportsc : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        const  user  = req.user!;
        const { from, to, id, date } = req.body;
        const userId = id ?? (user.account_type === 3 ? user.parent_id! : user.id);
        const baseSelectQuery = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 1`;
        let sql = baseSelectQuery;
        let values: any[] = [userId];
        if (from && to) {
            sql += ` AND DATE(created_on) >= ? AND DATE(created_on) <= ?`;
            values = [userId, from, to];
        } else if (date) {
            sql += ` AND DATE(created_on) = ?`;
            values = [userId, date];
        }
        try {
            const result = await mysqlcon(sql, values);
            res.send(result);
        } catch (error: any) {
          console.error(error);
          res.status(500).json({ status: false, message: "Some error occurred", error: error.message || error });
        }
    },


    //➡️ Local Settlement

    settlement_Trans : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{

    },

    localrequestSettlement : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{

    },

    localcardDetails: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{

    },

    localdownloadReportsc : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{

    },

    //➡️ Common API

    exchangeRate : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{

    },

    userWallet : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{

    }




}

export default SettlementTransaction
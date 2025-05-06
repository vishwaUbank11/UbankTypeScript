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


interface SettlementRecord {
    user_id: string;
    settlementId: string;
    settlementType: string;
    fromCurrency: string;
    toCurrency: string;
    created_on: string;
    walletAddress: string;
    accountNumber: string;
    bankName: string;
    branchName: string;
    city: string;
    country: string;
    swiftCode: string;
    requestedAmount: number;
    charges: number;
    exchangeRate: number;
    totalCharges: number;
    settlementAmount: number;
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

interface settlement_TransRequestBody {
    id?: string;
    searchText?: string;
    to?: string;
    from?: string;
    To?: string;
    From?: string;
    status?: string[];
    currency?: string[];
    settlementMode: number;
    page?: number;
    limit?: number;
}

interface LocalSettlementRequestBody {
    settlementId: string;
    settlementType?: string;
    fromCurrency: string;
    toCurrency?: string;
    walletAddress?: string;
    accountNumber: string;
    bankName: string;
    branchName: string;
    city?: string;
    country?: string;
    zip_code?: string;
    requestedAmount: number;
    account_name: string;
    swiftCode?: string;
    settlementMode: number;
    remainingBalance: number;
    previousBalance: number;
}

interface LocalCardDetailsRequestBody {
    id?: string;      
    from?: string;  
    to?: string;   
    date?: string;   
    searchItem?: string; 
}

interface SettlementSummary {
    request: number;
    charges: number;
    total_amount_received: number;
    total_amount_sent: number;
}

interface DownloadReportRequestBody {
    id?: string;
    searchText?: string;
    to?: string;
    from?: string;
    status?: string[];
    currency?: string[];
    From?: string;
    To?: string;
    settlementMode: number;
    date?: string;
}

interface ExchangeRateRequestBody {
    currency: string;
    toCurrency: string;
}
  
interface ExchangeRateResult {
    rate: number;
}

interface WalletResult {
    wallet: string;
}
  
interface Country {
    value: string;
    label: string;
}
  
interface UserWalletRequest {
    id?: number;
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
        const user = req.user!;
        const ID = user.account_type === 3 ? user.parent_id! : user.id;
        const { from, to, id, date }: DownloadReportRequestBody = req.body;
        try {
            if (id) {
                if (from && to) {
                    const sql = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE DATE(created_on) >= ? AND DATE(created_on) <= ? AND user_id = ? AND settlement_mode = 1`;
                    const result: SettlementRecord[] = await mysqlcon(sql, [from, to, id]);
                    res.send(result.length === 0 ? result : result);
                } else if (date) {
                    const sql = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE DATE(created_on) = ? AND user_id = ? AND settlement_mode = 1`;
                    const result: SettlementRecord[] = await mysqlcon(sql, [date, id]);
                    res.send(result.length === 0 ? result : result);
                } else {
                    const sql = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 1`;
                    const result: SettlementRecord[] = await mysqlcon(sql, [id]);
                    res.send(result.length === 0 ? result : result);
                }
            } else {
                if (from && to) {
                    const sql = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE DATE(created_on) >= ? AND DATE(created_on) <= ? AND user_id = ? AND settlement_mode = 1`;
                    const result: SettlementRecord[] = await mysqlcon(sql, [from, to, ID]);
                    res.send(result.length === 0 ? result : result);
                } else if (date) {
                    const sql = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE DATE(created_on) = ? AND user_id = ? AND settlement_mode = 1`;
                    const result: SettlementRecord[] = await mysqlcon(sql, [date, ID]);
                    res.send(result.length === 0 ? result : result);
                } else {
                    const sql = `SELECT user_id, settlementId, settlementType, fromCurrency, toCurrency, created_on, walletAddress, accountNumber, bankName, branchName, city, country, swiftCode, requestedAmount, charges, exchangeRate, totalCharges, settlementAmount FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 1`;
                    const result: SettlementRecord[] = await mysqlcon(sql, [ID]);
                    res.send(result.length === 0 ? result : result);
                }
            }
        } catch (error) {
            res.status(500).json({ status: false, message: "Some error occurred" });
        }
    },


    //➡️ Local Settlement

    settlement_Trans : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        const user = req.user!;
        const { id,searchText, to, from, status, currency, From, To, settlementMode, page = 1, limit = 10, } = req.body as settlement_TransRequestBody;
        const ID = user.account_type === 3 ? user.parent_id! : user.id;
        const merchantIdArray = id ? id.split(",") : [ID.toString()];
        const pagination = (total: number, page: number, limit: number) => {
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
        let queryValues: any[] = [...merchantIdArray, settlementMode];
        let conditions: string[] = [];
        if (status?.length) {
            conditions.push(`tbl_settlement.status IN (${status.map(() => "?").join(", ")})`);
            queryValues.push(...status);
        }
        if (currency?.length) {
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
            const countResult = await mysqlcon(countQuery, queryValues);
            const total = countResult[0].Total;
            const { start, numOfPages } = pagination(total, page, limit);
            baseQuery += ` ORDER BY tbl_settlement.created_on DESC LIMIT ?, ?`;
            const finalQueryValues = [...queryValues, start, limit];
            const resultData = await mysqlcon(baseQuery, finalQueryValues);
            const startRange = start + 1;
            const endRange = Math.min(start + limit, total);
            res.json({
                message: resultData.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
                currentPage: page,
                totalPages: numOfPages || 1,
                pageLimit: limit,
                data: resultData,
            });
            
        }catch(error){
            console.error(error);
            const errMsg = error instanceof Error ? error.message : "Unknown error";
            res.status(500).json({
                message: "Error occurred",
                error: errMsg,
            });
        }  
    },

    localrequestSettlement : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
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
                country,
                zip_code,
                requestedAmount,
                account_name,
                swiftCode,
                settlementMode,
                remainingBalance,
                previousBalance,
            } = req.body as LocalSettlementRequestBody;
            let settlementData: Record<string, any>;
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
            } else {
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
            const insertSql ="INSERT INTO tbl_settlement SET ?, settlement_time = NOW(), requested_time = NOW(), created_on = NOW(), updated_on = NOW()";
            const result = await mysqlcon(insertSql, settlementData);
            const updateSql = "UPDATE tbl_user SET wallet = ? WHERE id = ?";
            await mysqlcon(updateSql, [remainingBalance, ID]);
            if (result.affectedRows > 0) {
                res.status(200).json({
                    message: "Settlement request submitted successfully.",
                    data: result,
                });
            } else {
                res.status(400).json({
                    message: "Failed to create settlement request.",
                    data: result,
                });
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("Settlement request error:", error);
            res.status(500).json({
                message: "An error occurred while processing the request.",
                error: errorMessage,
            });
        }
    },

    localcardDetails: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        const user = req.user !;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        let { id, from, to, date, searchItem } = req.body as LocalCardDetailsRequestBody;
        try {
            let sql: string;
            let params: any[];
            if (id) {
                const idList = id.split(",");
                if (from && to) {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges, COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent
                    FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2 AND DATE(created_on) BETWEEN ? AND ?`;
                    params = [idList, from, to];
                } else if (date) {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges,COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2 AND DATE(created_on) = ?`;
                    params = [idList, date];
                } else if (searchItem) {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges, COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent
                    FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2 AND settlementId LIKE ?`;
                    params = [idList, `%${searchItem}%`];
                } else {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges, COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent
                    FROM tbl_settlement WHERE user_id IN (?) AND settlement_mode = 2`;
                    params = [idList];
                }
            } else {
                if (from && to) {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges,COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent
                    FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 2 AND DATE(created_on) BETWEEN ? AND ?`;
                    params = [ID, from, to];
                } else if (date) {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges,COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent
                    FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 2 AND DATE(created_on) = ?`;
                    params = [ID, date];
                } else if (searchItem) {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request,COALESCE(SUM(charges), 0) as charges,COALESCE(SUM(settlementAmount), 0) as total_amount_received,COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 2 AND settlementId LIKE ?`;
                    params = [ID, `%${searchItem}%`];
                } else {
                    sql = `SELECT COALESCE(SUM(requestedAmount), 0) as request, COALESCE(SUM(charges), 0) as charges,COALESCE(SUM(settlementAmount), 0) as total_amount_received, COALESCE(SUM(net_amount_for_settlement), 0) as total_amount_sent FROM tbl_settlement WHERE user_id = ? AND settlement_mode = 2`;
                    params = [ID];
                }
            }
            const [result] = await mysqlcon(sql, params) as [SettlementSummary];
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
        } catch (error) {
            console.error("Error in localcardDetails:", error);
            res.status(500).json({ message: "Error occurred", error });
        }
    },

    localdownloadReportsc : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        const user = req.user!;
        const {id,searchText,to,from,status,currency,From,To,settlementMode} = req.body as DownloadReportRequestBody;
        const ID = user.account_type === 3 ? user.parent_id! : user.id;
        try {
            const merchantIdArray = id ? id.split(",") : [ID.toString()];
            const formattedDateFields = [
                "DATE_FORMAT(tbl_settlement.created_on, '%Y-%m-%d %H:%i:%s') AS created_on",
                "DATE_FORMAT(tbl_settlement.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on",
                "DATE_FORMAT(tbl_settlement.settlement_time, '%Y-%m-%d %H:%i:%s') AS settlement_time",
            ].join(", ");

            let baseQuery = `SELECT tbl_user.name, tbl_settlement.*, ${formattedDateFields} FROM tbl_settlement LEFT JOIN tbl_user ON tbl_user.id = tbl_settlement.user_id WHERE tbl_settlement.user_id IN (${merchantIdArray.map(() => "?").join(", ")}) AND tbl_settlement.settlement_mode = ?`;
            const queryValues: any[] = [...merchantIdArray, settlementMode];
            const conditions: string[] = [];
            if (status?.length) {
                conditions.push(`tbl_settlement.status IN (${status.map(() => "?").join(", ")})`);
                queryValues.push(...status);
            }
            if (currency?.length) {
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
            const resultData: any[] = await mysqlcon(baseQuery, queryValues);
            const workbook = new ExcelJS.Workbook();
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
            } else {
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
                let netSettlement: number | string;
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
                } else {
                    netSettlement = row.exchangeRate ? parseFloat(((requestedAmount - charges) / parseFloat(row.exchangeRate)).toFixed(2)): parseFloat((requestedAmount - charges).toFixed(2));
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
                if (column) {
                    let maxLength = 10;
                    column.eachCell?.({ includeEmpty: true }, (cell) => {
                        const length = cell.value ? cell.value.toString().length : 10;
                        if (length > maxLength) maxLength = length;
                    });
                    column.width = maxLength + 5;
                }
            });
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Settlements.xlsx");
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            res.status(500).json({
                message: "Server Error",
                error,
            });
        }
    },

    //➡️ Common API

    exchangeRate : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        try {
            const { currency, toCurrency }: ExchangeRateRequestBody = req.body;
            const sql = `SELECT rate FROM tbl_user_settled_currency WHERE deposit_currency = ? AND settled_currency = ?`;
            const result: ExchangeRateResult[] = await mysqlcon(sql, [currency, toCurrency]);
            if (result.length !== 0) {
              res.status(200).json({
                message: "Data",
                data: result
              });
            } else {
              res.status(201).json({
                message: "No data found",
                data: result
              });
            }
          } catch (error) {
            console.error(error);
            res.status(500).json({
              message: "Error occurred",
              error
            });
          }
    },

    userWallet : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        try {
            const user = req.user!;
            const requestedId = req.body.id;
            const userId = requestedId ?? (user.account_type === 3 ? user.parent_id : user.id);
            const [walletResult, currencyResult]: [WalletResult[], Country[]] = await Promise.all([
              mysqlcon("SELECT wallet FROM tbl_user WHERE id = ?", [userId]),
              mysqlcon("SELECT sortname as value, sortname as label FROM countries WHERE status = 1"),
            ]);
            if (walletResult.length > 0) {
                res.status(200).json({
                    data: walletResult[0].wallet,
                    currencyResult,
                });
            } else {
                res.status(201).json({
                    message: "No data found",
                    data: null,
              });
            }
        } catch (error) {
            res.status(500).json({
              message: "An error occurred",
              error,
            });
        }
    }

}

export default SettlementTransaction
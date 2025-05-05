import { Request, Response } from 'express';
import mysqlcon from "../config/db_connection";
import { AuthenticatedRequest } from './userInterface';
import ExcelJS from "exceljs";
import { Column, Cell } from "exceljs";

interface PayoutRequestBody {
    id?: string;
    searchText?: string;
    to?: string;
    from?: string;
    status?: string[];
    currency?: string[];
    From?: string;
    To?: string;
    page?: number;
    limit?: number;
  }
  
  interface PaginationResult {
    limit: number;
    start: number;
    numOfPages: number;
  }

  interface PayoutHeaderRequest {
      id?: string;
      from?: string;
      to?: string;
      date?: string;
      searchitem?: string;
  }
  
  interface TransactionResult {
    count: number | null;
    amount: number | null;
    charge: number | null;
  }

  interface ViewDetailsRequest {
    uniqueid: string;
    id?: string;
  }

  interface DownloadReportRequest{
      id?: string;
      searchText?: string;
      to?: string;
      from?: string;
      status?: string[];
      currency?: string[];
      From?: string;
  
  }


const PayoutTransaction = {

    filter: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        const user = req.user!;
        const {
            id,
            searchText,
            to,
            from,
            status,
            currency,
            From,
            To,
            page = 1,
            limit = 10,
        } = req.body as PayoutRequestBody;
        console.log(req.body);
        

        const ID = user.account_type === 3 ? user.parent_id! : user.id;
        try {
            const merchantIdArray = id ? id.split(",") : [ID.toString()];
            const pagination = (total: number, page: number, limit: number): PaginationResult => {
                const numOfPages = Math.ceil(total / limit);
                const start = (page - 1) * limit;
                return { limit, start, numOfPages };
            };
            const formattedDateFields = ["DATE_FORMAT(tbl_icici_payout_transaction_response_details.created_on, '%Y-%m-%d %H:%i:%s') AS  created_on",
            "DATE_FORMAT(tbl_icici_payout_transaction_response_details.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on"
            ].join(", ");
            
            let baseQuery = `SELECT tbl_user.name, tbl_icici_payout_transaction_response_details.*, ${formattedDateFields} FROM tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id IN (${merchantIdArray.map(() => "?").join(", ")})`;

            let countQuery = `SELECT COUNT(*) AS Total FROM tbl_icici_payout_transaction_response_details INNER JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id IN (${merchantIdArray.map(() => "?").join(", ")})`;
            const queryValues: (string | number)[] = [...merchantIdArray];
            const conditions: string[] = [];
            const statusArr = Array.isArray(status) ? status : status ? [status] : [];
            if (statusArr && statusArr.length > 0) {
                conditions.push(`tbl_icici_payout_transaction_response_details.status IN (${statusArr.map(() => "?").join(", ")})`);
                queryValues.push(...statusArr);
            }
            const currencyArr = Array.isArray(currency) ? currency : currency ? [currency] : [];
            if (currencyArr && currencyArr.length > 0) {
                conditions.push(`tbl_icici_payout_transaction_response_details.currency IN (${currencyArr.map(() => "?").join(", ")})`);
                queryValues.push(...currencyArr);
            }
            if (to && from) {
                conditions.push("DATE(tbl_icici_payout_transaction_response_details.created_on) BETWEEN ? AND ?");
                queryValues.push(from, to);
            }
            if (From && To) {
            conditions.push("DATE(tbl_icici_payout_transaction_response_details.updated_on) BETWEEN ? AND ?");
            queryValues.push(From, To);
            }
            if (searchText) {
            conditions.push("(tbl_icici_payout_transaction_response_details.uniqueid LIKE ?)");
            queryValues.push(`%${searchText}%`);
            }
            if (conditions.length > 0) {
            const whereClause = " AND " + conditions.join(" AND ");
            baseQuery += whereClause;
            countQuery += whereClause;
            }
            const countResult: any[] = await mysqlcon(countQuery, queryValues);
            const total: number = countResult[0].Total;
            const { start, numOfPages } = pagination(total, page, limit);
            baseQuery += ` ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC LIMIT ?, ?`;
            const finalQueryValues = [...queryValues, start, limit];
            const resultData: any[] = await mysqlcon(baseQuery, finalQueryValues);
            const startRange = start + 1;
            const endRange = Math.min(start + limit, total);
            res.status(200).json({
                message: resultData.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
                currentPage: page,
                totalPages: numOfPages || 1,
                pageLimit: limit,
                data: resultData,
            });
        } catch (error) {
            console.error("Server Error:", error);
            res.status(500).json({
                message: "Server Error",
                error,
            });
        }
    },

    payoutheader: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        try {
            const { id, from, to, date, searchitem } = req.body as PayoutHeaderRequest;
            const user = req.user!;
            const ID = user.account_type === 3 ? user.parent_id : user.id;
            let whereClause: string;
            const parameters: any[] = [];
            const conditions: string[] = [];
            if (id) {
              const merchantIdArray = id.split(",");
              whereClause = "users_id IN (?)";
              parameters.push(merchantIdArray);
            } else {
              whereClause = "users_id = ?";
              parameters.push(ID);
            }
            let baseQuery = `SELECT COUNT(status) AS count,SUM(amount) AS amount,SUM(akonto_charge) AS charge FROM tbl_icici_payout_transaction_response_details WHERE status = ? AND ${whereClause}`;
            if (from && to) {
              conditions.push(`DATE(tbl_icici_payout_transaction_response_details.created_on) >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?`);
              parameters.push(from, to);
            } else if (date) {
              conditions.push(`DATE(created_on) = ?`);
              parameters.push(date);
            } else if (searchitem) {
              conditions.push(`(uniqueid LIKE ? OR creditacc LIKE ?)`);
              parameters.push(`%${searchitem}%`, `%${searchitem}%`);
            }
            const finalQuery = conditions.length > 0 ? `${baseQuery} AND (${conditions.join(" AND ")})`: baseQuery;
            const successData = await mysqlcon(finalQuery, ["SUCCESS", ...parameters]) as TransactionResult[];
            const declinedData = await mysqlcon(finalQuery, ["FAILURE", ...parameters]) as TransactionResult[];
            const pendingData = await mysqlcon(finalQuery, ["PENDING", ...parameters]) as TransactionResult[];
        
            const success = successData[0]?.amount || 0;
            const failure = declinedData[0]?.amount || 0;
            const pending = pendingData[0]?.amount || 0;
            const total = success + failure + pending;
        
            const chargeAmount = successData[0]?.charge !== null && successData[0]?.charge !== undefined
              ? parseFloat(successData[0].charge.toFixed(2))
              : 0;
        
            if (total === 0) {
            res.status(201).json({
                message: "User has no transaction",
                data: [
                  { name: "Success", percentage: 0, amount: 0 },
                  { name: "Declined", percentage: 0, amount: 0 },
                  { name: "Pending", percentage: 0, amount: 0 },
                  { name: "Our Charges", amount: 0 },
                ],
              });
            }
        
            res.status(200).json({
              message: "All Status Data",
              data: [
                { name: "Success", percentage: ((success / total) * 100).toFixed(2), amount: success },
                { name: "Declined", percentage: ((failure / total) * 100).toFixed(2), amount: failure },
                { name: "Pending", percentage: ((pending / total) * 100).toFixed(2), amount: pending },
                { name: "Our Charges", amount: chargeAmount },
              ]
            });
        
          } catch (error) {
            console.error(error);
            res.status(500).json({ status: false, error, message: "Some error occurred" });
          }

    },

    viewDetails: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        const user = req.user!;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        const { uniqueid, id } = req.body as ViewDetailsRequest;
        try {
            const sql = `SELECT * FROM tbl_icici_payout_transaction_response_details WHERE uniqueid = ? AND users_id = ? `;
            const userIdToUse = id ? id : ID;
            const result = await mysqlcon(sql, [uniqueid, userIdToUse]);
            res.status(200).json({
                message: "Transaction details are:",
                data: result,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                status: false,
                message: "Some error occurred",
                data: [],
            });
        }

    },

    downloadReport: async(req: AuthenticatedRequest, res: Response): Promise<void> => {
        const user = req.user!;
        const { id, searchText, to, from, status, currency, From, To } = req.body;
        const ID = user.account_type === 3 ? user.parent_id?? user.id : user.id;
        try {
            const merchantIdArray = id ? id.split(",") : [ID.toString()];
            const formattedDateFields = `DATE_FORMAT(tbl_icici_payout_transaction_response_details.created_on, '%Y-%m-%d %H:%i:%s') AS created_on,
            DATE_FORMAT(tbl_icici_payout_transaction_response_details.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on`;
            let baseQuery = `SELECT tbl_user.name,tbl_icici_payout_transaction_response_details.users_id, tbl_icici_payout_transaction_response_details.uniqueid,tbl_icici_payout_transaction_response_details.utrnumber,tbl_icici_payout_transaction_response_details.trx_type,tbl_icici_payout_transaction_response_details.payee_name,tbl_icici_payout_transaction_response_details.creditacc,tbl_icici_payout_transaction_response_details.bank_name,tbl_icici_payout_transaction_response_details.ifsc,tbl_icici_payout_transaction_response_details.amount,tbl_icici_payout_transaction_response_details.currency,tbl_icici_payout_transaction_response_details.akonto_charge,tbl_icici_payout_transaction_response_details.gst_amount,tbl_icici_payout_transaction_response_details.bank_charges,tbl_icici_payout_transaction_response_details.status,tbl_icici_payout_transaction_response_details.created_on,tbl_icici_payout_transaction_response_details.updated_on, ${formattedDateFields} FROM tbl_icici_payout_transaction_response_detailsLEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id WHERE tbl_icici_payout_transaction_response_details.users_id IN (${merchantIdArray.map(() => "?").join(", ")})`;
            const queryValues: any[] = [...merchantIdArray];
            const conditions: string[] = [];
            if (status && status.length > 0) {
                conditions.push(`tbl_icici_payout_transaction_response_details.status IN (${status.map(() => "?").join(", ")})`);
                queryValues.push(...status);
            }
            if (currency && currency.length > 0) {
                conditions.push(`tbl_icici_payout_transaction_response_details.currency IN (${currency.map(() => "?").join(", ")})`);
                queryValues.push(...currency);
            }
            if (to && from) {
                conditions.push("DATE(tbl_icici_payout_transaction_response_details.created_on) BETWEEN ? AND ?");
                queryValues.push(from, to);
            }
            if (To && From) {
                conditions.push("DATE(tbl_icici_payout_transaction_response_details.updated_on) BETWEEN ? AND ?");
                queryValues.push(From, To);
            }
            if (searchText) {
                conditions.push("(tbl_icici_payout_transaction_response_details.order_no LIKE ? OR tbl_icici_payout_transaction_response_details.txn_id LIKE ?)");
                queryValues.push(`%${searchText}%`, `%${searchText}%`);
            }
            if (conditions.length > 0) {
               baseQuery += " AND " + conditions.join(" AND ");
            }
            baseQuery += " ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC";
            const resultData = await mysqlcon(baseQuery, queryValues);
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Payouts");
            worksheet.mergeCells("A1", "P1");
            worksheet.getCell("A1").value = "PAYOUTS";
            worksheet.getCell("A1").font = { size: 16, bold: true };
            worksheet.getRow(1).alignment = { horizontal: "center" };
            worksheet.addRow([]);
            worksheet.addRow([
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
            ]);
            worksheet.getRow(3).font = { bold: true };
            // Add data rows
            resultData.forEach((row: any, index: number) => {
                const charges = parseFloat(((+row.akonto_charge || 0) + (+row.gst_amount || 0) + (+row.bank_charges || 0)).toFixed(2));
                const netPayout = parseFloat((+row.amount - charges).toFixed(2));
                const statusLabel = row.status?.toUpperCase() || "UNKNOWN";
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
                    statusLabel,
                    parseFloat(row.amount),
                    charges,
                    netPayout,
                    row.created_on,
                    row.updated_on,
                ]);
            });

            // Auto-resize columns
            worksheet.columns.forEach((column) => {
                if (!column) return; // Skip undefined columns
                let maxLength = 0;
                column.eachCell?.({ includeEmpty: true }, (cell) => {
                  const length = cell.value ? cell.value.toString().length : 0;
                  if (length > maxLength) maxLength = length;
                });
                column.width = maxLength + 5;
            });

            // Set response headers
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Payouts.xlsx");
            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
           console.error(error);
            res.status(500).json({
                message: "Server Error",
                error,
            });
        }
    },

    


}

export default PayoutTransaction;
import { Request, Response } from 'express';
import mysqlcon from "../config/db_connection";
import { AuthenticatedRequest } from './userInterface';
import ExcelJS from "exceljs";
import { Column, Cell } from "exceljs";

interface TransactionRow {
    user_id: number;
    name: string;
    txn_id: string;
    ammount_type: string;
    payment_type: string;
    ammount: number;
    payin_charges: number;
    gst_charges: number;
    status: number;
    order_no: string;
    created_on: string;
    updated_on: string;
  }
  
  interface TypedRequest {
      id?: string;
      searchText?: string;
      to?: string;
      from?: string;
      To?: string;
      From?: string;
      status?: string[];
      currency?: string[];
      method?: string[];
  }

  interface StatusRequestBody {
    merchantSelect?: string;
    from?: string;
    to?: string;
    date?: string;
    methodPayment?: string[] | string;
    currency?: string[] | string;
    searchItem?: string;
  }
  
  interface StatusResult {
    count: number;
    amount: number;
    name: string;
  }

  interface SearchDateFilterRequest {
    id?: string;
    searchText?: string;
    to?: string;
    from?: string;
    status?: string[];
    currency?: string[];
    method?: string[];
    From?: string;
    To?: string;
    page?: number;
    limit?: number;
  }

  // 2. tbl_user result interface
interface UserCountryResult {
    solution_apply_for_country: string;
  }
  
  // 3. countries table result interface
  interface Country {
    id: number;
    sortname: string;
    name: string;
  }
  
  // 4. Final response object interface
  interface CountryOption {
    value: string;
    label: string;
  }

  interface Transaction {
    txn_id: string;
    created_on: string;
    payment_status: string;
    ammount: number;
    status: number;
    ammount_type: string;
  }
  
  interface TransactionsGrouped {
    SUCCESS: Transaction[];
    FAILED: Transaction[];
    PENDING: Transaction[];
  }

  interface ChargebackRefund {
    id: number;
    txn_id: string;
    order_no: string;
    user_id: number;
    payment_type: string;
    ammount_type: string;
    status: number;
    created_on: string;
    updated_on: string;
    name: string;
  }
  
  interface PaginationResult {
    start: number;
    limit: number;
    numOfPages: number;
  }

  interface WalletLogQueryParams {
    id?: string;
    searchText?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }

  interface WalletLogRow {
    merchant_id: number;
    name: string;
    order_id: string;
    currency: string;
    objective: string;
    current_wallet: string | number;
    effective_amt: string | number;
    current_action: number;
    update_wallet_tot: string | number;
    created_on: string;
  }
  
  interface WalletLogRequest {
      id?: string;
      searchText?: string;
      from?: string;
      to?: string;
  }
  

const DepositTransaction = {
    downloadapi : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        // const typedReq = req as TypedRequest;
        const user = req.user!;
        const { id, searchText, to, from, status, currency, method, From, To } = req.body as TypedRequest;
        const ID = user.account_type === 3 ? user.parent_id! : user.id;
        try {
            const merchantIdArray = id ? id.split(",") : [ID.toString()];
            const formattedDateFields = ["DATE_FORMAT(tbl_merchant_transaction.created_on, '%Y-%m-%d %H:%i:%s') AS created_on","DATE_FORMAT(tbl_merchant_transaction.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on"].join(", ");
            let baseQuery = `SELECT tbl_user.name, tbl_merchant_transaction.user_id, tbl_merchant_transaction.txn_id, tbl_merchant_transaction.ammount_type, tbl_merchant_transaction.payment_type, tbl_merchant_transaction.ammount, tbl_merchant_transaction.payin_charges, tbl_merchant_transaction.gst_charges, tbl_merchant_transaction.status, tbl_merchant_transaction.order_no, tbl_merchant_transaction.created_on, tbl_merchant_transaction.updated_on,${formattedDateFields} FROM tbl_merchant_transaction LEFT JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id WHERE tbl_merchant_transaction.user_id IN (${merchantIdArray.map(() => "?").join(", ")})`;
            const queryValues: (string | number)[] = [...merchantIdArray];
            const conditions: string[] = [];
            if (status && status.length > 0) {
                conditions.push(`tbl_merchant_transaction.status IN (${status.map(() => "?").join(", ")})`);
                queryValues.push(...status);
            }
            if (method && method.length > 0) {
                conditions.push(`tbl_merchant_transaction.payment_type IN (${method.map(() => "?").join(", ")})`);
                queryValues.push(...method);
            }
            if (currency && currency.length > 0) {
                conditions.push(`tbl_merchant_transaction.ammount_type IN (${currency.map(() => "?").join(", ")})`);
                queryValues.push(...currency);
            }
            if (to && from) {
                conditions.push("DATE(tbl_merchant_transaction.created_on) BETWEEN ? AND ?");
                queryValues.push(from, to);
            }
            if (To && From) {
                conditions.push("DATE(tbl_merchant_transaction.updated_on) BETWEEN ? AND ?");
                queryValues.push(From, To);
            }
            if (searchText) {
                conditions.push("(tbl_merchant_transaction.order_no LIKE ? OR tbl_merchant_transaction.txn_id LIKE ?)");
                queryValues.push(`%${searchText}%`, `%${searchText}%`);
            }
            if (conditions.length > 0) {
              baseQuery += " AND " + conditions.join(" AND ");
            }
            baseQuery += " ORDER BY tbl_merchant_transaction.created_on DESC";
            const resultData = await mysqlcon(baseQuery, queryValues) as TransactionRow[];
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Deposits");
            worksheet.mergeCells("A1", "K1");
            worksheet.getCell("A1").value = "DEPOSITS";
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
                const payinCharges = parseFloat(row.payin_charges?.toString() || '0');
                const gstCharges = parseFloat(row.gst_charges?.toString() || '0');
                const charges = parseFloat((payinCharges + gstCharges).toFixed(2));
                const netDeposit = parseFloat((row.ammount - charges).toFixed(2));
                let statusLabel = "";
                switch (row.status) {
                    case 0:
                    statusLabel = "FAILED";
                    break;
                    case 1:
                    statusLabel = "SUCCESS";
                    break;
                    case 3:
                    statusLabel = "PENDING";
                    break;
                    case 4:
                    statusLabel = "REFUND";
                    break;
                    case 5:
                    statusLabel = "CHARGEBACK";
                    break;
                }
                worksheet.addRow([
                    index + 1,
                    `${row.user_id} - ${row.name}`,
                    row.txn_id,
                    row.ammount_type,
                    row.payment_type,
                    statusLabel,
                    parseFloat(row.ammount.toString()),
                    charges,
                    netDeposit,
                    row.created_on,
                    row.updated_on,
                ]);
            });

            // Auto-fit column widths
            worksheet.columns.forEach((column: Partial<Column>) => {
                let maxLength = 10;
                column.eachCell?.({ includeEmpty: true }, (cell: Cell) => {
                  const length = cell.value ? cell.value.toString().length : 10;
                  if (length > maxLength) maxLength = length;
                });
                column.width = maxLength + 5;
              });

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Deposits.xlsx");
            await workbook.xlsx.write(res);
            res.end();
        } catch (error: any) {
            console.error("Download Error:", error);
            res.status(500).json({
                message: "Server Error",
                error: error.message || error,
            });
        }

    },

    statusResult : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        let {
                merchantSelect,
                from,
                to,
                date,
                methodPayment,
                currency,
                searchItem,
            } = req.body as StatusRequestBody;
        
        const user = req.user!;
        const ID: number = user.account_type === 3 ? user.parent_id! : user.id;
        try {
            const idList: string[] = merchantSelect ? merchantSelect.split(',') : [ID.toString()];
            const methodList: string[] = methodPayment && typeof methodPayment === 'string'? methodPayment.split(','): Array.isArray(methodPayment) ? methodPayment[0]?.split(',') || [] : [];
            const currencyList: string[] = currency && typeof currency === 'string' ? currency.split(',') : Array.isArray(currency)? currency[0]?.split(',') || []: [];
            const baseQuery =
              "SELECT COUNT(status) as count, COALESCE(SUM(ammount),0) as amount FROM tbl_merchant_transaction WHERE user_id IN (?) AND status = ?";
            const statusConditions: Record<string, number> = {
              success: 1,
              declined: 0,
              pending: 2,
              chargeback: 5,
              refund: 4,
            };
            const results: StatusResult[] = await Promise.all(
              Object.entries(statusConditions).map(async ([key, statusCode]) => {
                let query = baseQuery;
                const params: any[] = [idList, statusCode];
                if (from && to) {
                  query += " AND DATE(created_on) BETWEEN ? AND ?";
                  params.push(from, to);
                }
                if (date) {
                  query += " AND DATE(created_on) = ?";
                  params.push(date);
                }
                if (methodList.length > 0) {
                  query += " AND payment_type IN (?)";
                  params.push(methodList);
                }
                if (currencyList.length > 0) {
                  query += " AND ammount_type IN (?)";
                  params.push(currencyList);
                }
                if (searchItem) {
                  const likeSearch = `%${searchItem}%`;
                  query += " AND (txn_id LIKE ? OR i_flname LIKE ?)";
                  params.push(likeSearch, likeSearch);
                }
                const [result] = await mysqlcon(query, params);
                return {
                  count: result.count,
                  amount: result.amount,
                  name: key.charAt(0).toUpperCase() + key.slice(1),
                };
              })
            );
            const totalCount = results.reduce((total, res) => total + res.count, 0);
            if (totalCount === 0) {
              res.status(201).json({
                message: "User has no transaction",
                data: results.map((res) => ({
                  name: res.name,
                  percentage: 0,
                  amount: 0,
                })),
              });
            }
            const dataResponse = results.map((res) => ({
              name: res.name,
              percentage: ((res.count / totalCount) * 100).toFixed(2),
              amount: res.amount || 0,
            }));
        
            res.status(200).json({
              message: "All Status Data",
              data: dataResponse,
            });
          } catch (error) {
            console.error("Error occurred:", error);
            res.status(500).json({
              message: "An error occurred while processing the request",
              error,
            });
          }
    },

    searchDateFilter : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        const user = req.user!;
        const {
            id,
            searchText,
            to,
            from,
            status,
            currency,
            method,
            From,
            To,
            page,
            limit,
        } = req.body as SearchDateFilterRequest;
        const ID = user.account_type === 3 ? user.parent_id! : user.id;
        try {
            const merchantIdArray: string[] = id ? id.split(",") : [ID.toString()];
            if (!merchantIdArray.length) {
            res.status(400).json({ message: "No merchant ID provided." });
            return;
            }
            const pagination = (total: number, page: number, limit: number) => {
            const numOfPages = Math.ceil(total / limit);
            const start = (page - 1) * limit;
            return { limit, start, numOfPages };
            };
            const formattedDateFields = ["DATE_FORMAT(tbl_merchant_transaction.created_on, '%Y-%m-%d %H:%i:%s') AS created_on","DATE_FORMAT(tbl_merchant_transaction.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on",].join(", ");

            let baseQuery = `SELECT tbl_user.name, tbl_merchant_transaction.*, ${formattedDateFields} FROM tbl_merchant_transaction  LEFT JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id WHERE tbl_merchant_transaction.user_id IN (${merchantIdArray.map(() => "?").join(",")})`;

            let countQuery = `SELECT COUNT(*) AS Total FROM tbl_merchant_transaction INNER JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction.user_id WHERE tbl_merchant_transaction.user_id IN (${merchantIdArray.map(() => "?").join(", ")})`;
            let queryValues: any[] = [...merchantIdArray];
            let conditions: string[] = [];
            const statusArr = Array.isArray(status) ? status : status ? [status] : [];
            if (statusArr.length) {
              conditions.push(`tbl_merchant_transaction.status IN (${statusArr.map(() => "?").join(", ")})`);
              queryValues.push(...statusArr);
            }
            const methodArr = Array.isArray(method) ? method : method ? [method] : [];
            if (methodArr.length) {
              conditions.push(`tbl_merchant_transaction.payment_type IN (${methodArr.map(() => "?").join(", ")})`);
              queryValues.push(...methodArr);
            }
            const currencyArr = Array.isArray(currency) ? currency : currency ? [currency] : [];
            if (currencyArr.length) {
              conditions.push(`tbl_merchant_transaction.ammount_type IN (${currencyArr.map(() => "?").join(", ")})`);
               queryValues.push(...currencyArr);
            }
            if (to && from) {
            conditions.push("DATE(tbl_merchant_transaction.created_on) BETWEEN ? AND ?");
            queryValues.push(from, to);
            }

            if (To && From) {
                conditions.push("DATE(tbl_merchant_transaction.updated_on) BETWEEN ? AND ?");
                queryValues.push(From, To);
            }
            if (searchText) {
                conditions.push("(tbl_merchant_transaction.order_no LIKE ? OR tbl_merchant_transaction.txn_id LIKE ?)");
                queryValues.push(`%${searchText}%`, `%${searchText}%`);
            }
            if (conditions.length > 0) {
                const whereClause = " AND " + conditions.join(" AND ");
                baseQuery += whereClause;
                countQuery += whereClause;
            }
            const countResult: any = await mysqlcon(countQuery, queryValues);
            const total: number = countResult[0]?.Total || 0;
            const currentPage = page ? Number(page) : 1;
            const pageLimit = limit ? Number(limit) : 10;
            const { start, numOfPages } = pagination(total, currentPage, pageLimit);
        
            baseQuery += ` ORDER BY tbl_merchant_transaction.created_on DESC LIMIT ?, ?`;
            const finalQueryValues = [...queryValues, start, pageLimit];
            const resultData: any[] = await mysqlcon(baseQuery, finalQueryValues);
            const startRange = start + 1;
            const endRange = Math.min(start + pageLimit, total);
            res.json({
                message:resultData.length > 0? `Showing ${startRange} to ${endRange} data from ${total}`: "NO DATA",
                currentPage,
                totalPages: numOfPages || 1,
                pageLimit,
                data: resultData,
                userRefund: user.refund ?? 0,
            });
        } 
        catch (error) 
        {
            console.error("searchDateFilter error:", error);
            res.status(500).json({
                message: "Server Error",
                error,
            });
        }
    },

    merchantChoosedCurrency : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        try {
            let user = req.user!;
            const ID = user.account_type === 3 ? user.parent_id! : user.id;
            const result = await mysqlcon("SELECT solution_apply_for_country FROM tbl_user WHERE id = ?", [ID]);
            const [testResult] = result as UserCountryResult[];
            if (!testResult || !testResult.solution_apply_for_country) {
            res.status(200).json({ data: [] });
            }
            const countryIds: string[] = testResult.solution_apply_for_country.split(',').map(id => id.trim()).filter(id => id);
            if (countryIds.length === 0) {
            res.status(200).json({ data: [] });
            }
            const placeholders = countryIds.map(() => '?').join(',');
            const test1Query = `SELECT id, sortname, name FROM countries WHERE id IN (${placeholders}) ORDER BY name`;
            const results = await mysqlcon(test1Query, countryIds);
            const test1Result = results as Country[];
            const curr: CountryOption[] = Array.isArray(test1Result) ? test1Result.map(({ sortname }) => ({ value: sortname, label: sortname })): [];
            res.status(200).json({ data: curr });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Something went wrong", error });
        }

    },

    merchantTransaction: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        try{
            const { user_id } = req.body;
            const sql = `~SELECT txn_id,DATE_FORMAT(tbl_merchant_transaction.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, payment_status, ammount, status, ammount_type FROM tbl_merchant_transaction WHERE user_id = ? AND txn_id LIKE 'BIZERA%' ORDER BY created_on ASC;`;
            const result = await mysqlcon(sql, [user_id]) as Transaction[];
            // if (result.length === 0) {
            // res.status(201).json({ message: "Data Not Found" });
            // }
            const transactionsByStatus: TransactionsGrouped = {
                SUCCESS: [],
                FAILED: [],
                PENDING: []
            };
            result.forEach(transaction => {
                if (transaction.status === 1) {
                transactionsByStatus.SUCCESS.push(transaction);
                } else if (transaction.status === 0) {
                transactionsByStatus.FAILED.push(transaction);
                } else if (transaction.status === 3) {
                transactionsByStatus.PENDING.push(transaction);
                }
            });
            res.status(200).json({ data: transactionsByStatus });
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Error occurred", error })
        }

    },

    refundCBRData: async(req: AuthenticatedRequest, res: Response): Promise<void> => {
        let user = req.user!;
        let {
          id,
          searchText,
          to,
          from,
          status,
          currency,
          method,
          From,
          To,
          page,
          limit,
        }: {
          id?: string;
          searchText?: string;
          to?: string;
          from?: string;
          status?: number[];
          currency?: string[];
          method?: string[];
          From?: string;
          To?: string;
          page?: number;
          limit?: number;
        } = req.body;
      
        const ID = user.account_type === 3 ? user.parent_id! : user.id;
        try {
          const merchantIdArray = id ? id.split(",") : [ID.toString()];
          const paginate = (total: number, page: number, limit: number): PaginationResult => {
            const numOfPages = Math.ceil(total / limit);
            const start = (page - 1) * limit;
            return { limit, start, numOfPages };
          };
          const formattedDateFields = `DATE_FORMAT(tbl_merchant_transaction_chargeback_refund.created_on, '%Y-%m-%d %H:%i:%s') AS created_on,
          DATE_FORMAT(tbl_merchant_transaction_chargeback_refund.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on`;

          let baseQuery = `SELECT tbl_user.name, tbl_merchant_transaction_chargeback_refund.*, ${formattedDateFields} FROM tbl_merchant_transaction_chargeback_refund LEFT JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction_chargeback_refund.user_id 
          WHERE tbl_merchant_transaction_chargeback_refund.user_id IN (${merchantIdArray.map(() => "?").join(", ")})`;
      
          let countQuery = `SELECT COUNT(*) AS Total FROM tbl_merchant_transaction_chargeback_refund INNER JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction_chargeback_refund.user_id WHERE tbl_merchant_transaction_chargeback_refund.user_id IN (${merchantIdArray.map(() => "?").join(", ")})`;
      
          let queryValues: (string | number)[] = [...merchantIdArray];
          let conditions: string[] = [];
      
          if (status && status.length) {
            conditions.push(`tbl_merchant_transaction_chargeback_refund.status IN (${status.map(() => "?").join(", ")})`);
            queryValues.push(...status);
          }
          if (method && method.length) {
            conditions.push(`tbl_merchant_transaction_chargeback_refund.payment_type IN (${method.map(() => "?").join(", ")})`);
            queryValues.push(...method);
          }
          if (currency && currency.length) {
            conditions.push(`tbl_merchant_transaction_chargeback_refund.ammount_type IN (${currency.map(() => "?").join(", ")})`);
            queryValues.push(...currency);
          }
          if (to && from) {
            conditions.push("DATE(tbl_merchant_transaction_chargeback_refund.created_on) BETWEEN ? AND ?");
            queryValues.push(from, to);
          }
          if (To && From) {
            conditions.push("DATE(tbl_merchant_transaction_chargeback_refund.updated_on) BETWEEN ? AND ?");
            queryValues.push(From, To);
          }
          if (searchText) {
            conditions.push("(tbl_merchant_transaction_chargeback_refund.order_no LIKE ? OR tbl_merchant_transaction_chargeback_refund.txn_id LIKE ?)");
            queryValues.push(`%${searchText}%`, `%${searchText}%`);
          }
          if (conditions.length) {
            baseQuery += " AND " + conditions.join(" AND ");
            countQuery += " AND " + conditions.join(" AND ");
          }
          const countResult = await mysqlcon(countQuery, queryValues) as { Total: number }[];
          const total = countResult[0]?.Total || 0;
      
          page = page ? Number(page) : 1;
          limit = limit ? Number(limit) : 10;
      
          const { start, numOfPages } = paginate(total, page, limit);
      
          baseQuery += ` ORDER BY tbl_merchant_transaction_chargeback_refund.created_on DESC LIMIT ?, ?`;
          const finalQueryValues = [...queryValues, start, limit];
      
          const resultData = await mysqlcon(baseQuery, finalQueryValues) as ChargebackRefund[];
      
          const startRange = start + 1;
          const endRange = Math.min(start + limit, total);
      
          res.json({
            message: resultData.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
            currentPage: page,
            totalPages: numOfPages || 1,
            pageLimit: limit,
            data: resultData,
            userRefund: user.refund,
          });
      
        } catch (error) {
          console.error(error);
          res.status(500).json({
            message: "Server Error",
            error,
          });
        }
        
    },

    downloadRefundCBRapi: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        let user = req.user!;
        const { id, searchText, to, from, status, currency, method, From, To } = req.body;
        try {
            const ID: number = user.account_type === 3 ? user.parent_id ?? user.id : user.id;
            const merchantIdArray: string[] = id ? id.split(',') : [ID.toString()];
            const formattedDateFields = [
            "DATE_FORMAT(tbl_merchant_transaction_chargeback_refund.created_on, '%Y-%m-%d %H:%i:%s') AS created_on",
            "DATE_FORMAT(tbl_merchant_transaction_chargeback_refund.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on"
            ].join(', ');
            let baseQuery = `SELECT tbl_user.name, tbl_merchant_transaction_chargeback_refund.user_id, tbl_merchant_transaction_chargeback_refund.txn_id, tbl_merchant_transaction_chargeback_refund.ammount_type, tbl_merchant_transaction_chargeback_refund.payment_type, tbl_merchant_transaction_chargeback_refund.ammount, tbl_merchant_transaction_chargeback_refund.payin_charges, tbl_merchant_transaction_chargeback_refund.gst_charges, tbl_merchant_transaction_chargeback_refund.status, tbl_merchant_transaction_chargeback_refund.order_no, tbl_merchant_transaction_chargeback_refund.created_on, tbl_merchant_transaction_chargeback_refund.updated_on,${formattedDateFields} FROM tbl_merchant_transaction_chargeback_refund LEFT JOIN tbl_user ON tbl_user.id = tbl_merchant_transaction_chargeback_refund.user_id WHERE tbl_merchant_transaction_chargeback_refund.user_id IN (${merchantIdArray.map(() => '?').join(', ')})`;
            const queryValues: (string | number)[] = [...merchantIdArray];
            const conditions: string[] = [];
            if (status && status.length > 0) {
                conditions.push(`tbl_merchant_transaction_chargeback_refund.status IN (${status.map(() => '?').join(', ')})`);
                queryValues.push(...status);
            }
            if (method && method.length > 0) {
                conditions.push(`tbl_merchant_transaction_chargeback_refund.payment_type IN (${method.map(() => '?').join(', ')})`);
                queryValues.push(...method);
            }
            if (currency && currency.length > 0) {
                conditions.push(`tbl_merchant_transaction_chargeback_refund.ammount_type IN (${currency.map(() => '?').join(', ')})`);
                queryValues.push(...currency);
            }
            if (to && from) {
                conditions.push("DATE(tbl_merchant_transaction_chargeback_refund.created_on) BETWEEN ? AND ?");
                queryValues.push(from, to);
            }
            if (To && From) {
                conditions.push("DATE(tbl_merchant_transaction_chargeback_refund.updated_on) BETWEEN ? AND ?");
                queryValues.push(From, To);
            }
            if (searchText) {
                conditions.push("(tbl_merchant_transaction_chargeback_refund.order_no LIKE ? OR tbl_merchant_transaction_chargeback_refund.txn_id LIKE ?)");
                queryValues.push(`%${searchText}%`, `%${searchText}%`);
            }
            if (conditions.length > 0) {
              baseQuery += ' AND ' + conditions.join(' AND ');
            }
            baseQuery += ' ORDER BY tbl_merchant_transaction_chargeback_refund.created_on DESC';
            const resultData = await mysqlcon(baseQuery, queryValues);
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Refund&Chargeback');
            worksheet.mergeCells('A1', 'K1');
            worksheet.getCell('A1').value = 'CHARGEBACK AND REFUND';
            worksheet.getCell('A1').font = { size: 16, bold: true };
            worksheet.getRow(1).alignment = { horizontal: 'center' };
            worksheet.addRow([]);
            worksheet.addRow([
                'Sr. No',
                'Merchant',
                'Order No',
                'Currency',
                'Payment Method',
                'Status',
                'Requested Deposit Amount',
                'Charges',
                'Net Deposit Amount',
                'Created On',
                'Updated On',
            ]);
            worksheet.getRow(3).font = { bold: true };
            resultData.forEach((row: any, index: number) => {
                const charges = parseFloat((parseFloat(row.payin_charges) + parseFloat(row.gst_charges || 0)).toFixed(2));
                const netDeposit = parseFloat((parseFloat(row.ammount) - charges).toFixed(2));
                let statusLabel = '';
                if (row.status === 4) statusLabel = 'REFUND';
                else if (row.status === 5) statusLabel = 'CHARGEBACK';

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
            worksheet.columns.forEach((column) => {
                if (!column) return; // Skip undefined columns
                let maxLength = 0;
                column.eachCell?.({ includeEmpty: true }, (cell) => {
                  const length = cell.value ? cell.value.toString().length : 0;
                  if (length > maxLength) maxLength = length;
                });
                column.width = maxLength + 5;
            });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=Deposits.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Server Error',
                error,
            });
        }
    },

    merchantWalletLogs: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        const user = req.user!;
        const { id, searchText, from, to, page = 1, limit = 10 }: WalletLogQueryParams = req.body;
        const ID : number = user.account_type === 3 ? user.parent_id ?? user.id : user.id;
        if (!ID) {
          res.status(400).json({ message: "Invalid user ID" });
        }
        try {
            const merchantIdArray: string[] = id ? id.split(",") : [ID.toString()];
            const formattedDateFields = `DATE_FORMAT(tbl_wallet_update_log.created_on, '%Y-%m-%d %H:%i:%s') AS created_on`;
            let baseQuery = `SELECT tbl_user.name, tbl_wallet_update_log.*, ${formattedDateFields} FROM tbl_wallet_update_log LEFT JOIN tbl_user ON tbl_user.id = tbl_wallet_update_log.merchant_id WHERE tbl_wallet_update_log.merchant_id IN (${merchantIdArray.map(() => "?").join(", ")})`;
            
            let countQuery = `SELECT COUNT(*) AS Total FROM tbl_wallet_update_log INNER JOIN tbl_user ON tbl_user.id = tbl_wallet_update_log.merchant_id WHERE tbl_wallet_update_log.merchant_id IN (${merchantIdArray.map(() => "?").join(", ")})`;
            const queryValues: (string | number)[] = [...merchantIdArray];
            const conditions: string[] = [];

            if (from && to) {
            conditions.push("DATE(tbl_wallet_update_log.created_on) BETWEEN ? AND ?");
            queryValues.push(from, to);
            }
            if (searchText) {
            conditions.push("tbl_wallet_update_log.order_id = ?");
            queryValues.push(searchText);
            }
            if (conditions.length > 0) {
            const whereClause = " AND " + conditions.join(" AND ");
            baseQuery += whereClause;
            countQuery += whereClause;
            }
            const countResult = await mysqlcon(countQuery, queryValues);
            const total: number = countResult[0]?.Total || 0;
            const currentPage = Number(page);
            const perPage = Number(limit);
            const numOfPages = Math.ceil(total / perPage);
            const start = (currentPage - 1) * perPage;
            baseQuery += ` ORDER BY tbl_wallet_update_log.created_on DESC LIMIT ?, ?`;
            const finalQueryValues = [...queryValues, start, perPage];
            const resultData = await mysqlcon(baseQuery, finalQueryValues);
            const startRange = start + 1;
            const endRange = Math.min(start + perPage, total);

            res.json({
                message: resultData.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
                currentPage,
                totalPages: numOfPages || 1,
                pageLimit: perPage,
                data: resultData,
                userRefund: user.refund ?? null,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Server Error",
                error,
            });
        }
    },

    merchantWalletLogsDownload: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        const user = req.user!;
        const { id, searchText, to, from } = req.body as WalletLogRequest;
        const ID : number = user.account_type === 3 ? user.parent_id ?? user.id: user.id;
        try {
            const merchantIdArray: string[] = id ? id.split(",") : [ID.toString()];
            const formattedDateField = `DATE_FORMAT(tbl_wallet_update_log.created_on, '%Y-%m-%d %H:%i:%s') AS created_on`;
            let baseQuery = `SELECT tbl_user.name, tbl_wallet_update_log.*, ${formattedDateField} FROM tbl_wallet_update_log LEFT JOIN tbl_user ON tbl_user.id = tbl_wallet_update_log.merchant_id WHERE tbl_wallet_update_log.merchant_id IN (${merchantIdArray.map(() => "?").join(", ")})`;
            const queryValues: (string | number)[] = [...merchantIdArray];
            const conditions: string[] = [];

            if (to && from) {
                conditions.push("DATE(tbl_wallet_update_log.created_on) BETWEEN ? AND ?");
                queryValues.push(from, to);
            }
            if (searchText) {
                conditions.push("tbl_wallet_update_log.order_id = ?");
                queryValues.push(searchText);
            }
            if (conditions.length > 0) {
               baseQuery += " AND " + conditions.join(" AND ");
            }
            baseQuery += " ORDER BY tbl_wallet_update_log.created_on DESC";
            const resultData: WalletLogRow[] = await mysqlcon(baseQuery, queryValues);
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("WalletLogs");
            worksheet.mergeCells("A1", "J1");
            worksheet.getCell("A1").value = "WALLETLOGS";
            worksheet.getCell("A1").font = { size: 16, bold: true };
            worksheet.getRow(1).alignment = { horizontal: "center" };
            worksheet.addRow([]);
            worksheet.addRow([
                "Sr. No",
                "Merchant",
                "Order No",
                "Currency",
                "Objective",
                "Previous Wallet",
                "Amount",
                "Action",
                "Updated Wallet",
                "Created On",
            ]);
            worksheet.getRow(3).font = { bold: true };
            resultData.forEach((row, index) => {
                let actionLabel = "";
                if (row.current_action === 1) actionLabel = "ADD";
                else if (row.current_action === 2) actionLabel = "DEDUCT";
                worksheet.addRow([
                    index + 1,
                    `${row.merchant_id} - ${row.name}`,
                    row.order_id,
                    row.currency,
                    row.objective,
                    parseFloat(row.current_wallet as string),
                    parseFloat(row.effective_amt as string),
                    actionLabel,
                    parseFloat(row.update_wallet_tot as string),
                    row.created_on,
                ]);
            });

            // Auto-width for all columns
            worksheet.columns.forEach((column) => {
                if (!column) return; // Skip undefined columns
                let maxLength = 0;
                column.eachCell?.({ includeEmpty: true }, (cell) => {
                const length = cell.value ? cell.value.toString().length : 0;
                if (length > maxLength) maxLength = length;
                });
                column.width = maxLength + 5;
            });

            // Set Excel headers
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=WalletLogs.xlsx");
            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error("Excel export error:", error);
            res.status(500).json({
                message: "Server Error",
                error,
            });
        }
    }



}

export default DepositTransaction;

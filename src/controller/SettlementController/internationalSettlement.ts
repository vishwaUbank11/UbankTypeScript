import { Request, Response } from "express";
import mysqlcon from "../../config/db_connection";
import Pagination from "../../services/pagination";

//default
interface SettlementRequestBody {
  to?: string;
  from?: string;
  date?: string;
  pageNumber?: number;
  limit?: number;
  searchItem?: string;
  id: number;
  settlementId: string;
  requested_time: string;
  created_on: string;
  updated_on: string;
  settlement_time: string;
  settlement_mode: number;
}
//default
interface AuthenticatedRequest extends Request {
  body: SettlementRequestBody;
  user?: any; 
}
//requestInternational
interface SettlementRequestBody {
  settlementId: string;
  user_id: number;
  settlementType: string;
  currency: string;
  toCurrency: string;
  walletAdd: string;
  wallet_type: string;
  accountN: string;
  account_name: string;
  availableBalance: number;
  requestedAmount: number;
  fees: number;
  net_amount_for_settlement: number;
  exchangeRate: number;
  bankName: string;
  branchName: string;
  city: string;
  zipcode: string;
  country: string;
  swift: string;
  authorizer: string;
  remBalance: number;
  group_id: number;
  role: number;
}
//editInternational
interface EditSettlementRequestBody {
  id: number;
  settlementId: string;
  user_id: number;
  settlementType: string;
  currency: string;
  toCurrency: string;
  walletAdd: string;
  wallet_type: string;
  accountN: string;
  account_name: string;
  availableBalance: number;
  requestedAmount: number;
  fees: number;
  exchangeRate: number;
  bankName: string;
  branchName: string;
  city: string;
  zipcode: string;
  country: string;
  swift: string;
  authorizer: string;
}
//defaultInternationalDownload
interface DownloadRequestBody {
  to?: string;
  from?: string;
  date?: string;
  searchItem?: string;
}
//toggleInternationalStatus
interface ToggleStatusRequestBody {
  settlementId: string;
  val: number;
  group_id: number;
}
//internationalCards
interface InternationalCardsRequestBody {
  to?: string;
  from?: string;
  date?: string;
  searchItem?: string;
  count: number;
  amount: number | null;
  charges: number | null;
  net_amount_for_settlement: number | null;
  settlementAmount: number | null;
  name: string;
}

class InternationalSettlement{
  public async default(req: Request, res: Response): Promise<void> {
        try {
          const { to, from, date, pageNumber, searchItem } = req.body;
          const { group_id } = req.user;
    
          const sqlAllCount = "SELECT COUNT(*) as Total FROM tbl_settlement WHERE settlement_mode = 1";
          const sqlCountDate = "SELECT COUNT(*) as Total FROM tbl_settlement WHERE DATE(created_on) = ? AND settlement_mode = 1";
          const sqlToFromCount = "SELECT COUNT(*) as Total FROM tbl_settlement WHERE DATE(created_on) >= ? AND DATE(created_on) <= ? AND settlement_mode = 1";
          const sqlSearchCount = `SELECT COUNT(*) as Total FROM tbl_settlement WHERE settlementId LIKE '%${searchItem}%' AND settlement_mode = 1`;
    
          const countQuery = date
            ? sqlCountDate
            : to && from
            ? sqlToFromCount
            : searchItem
            ? sqlSearchCount
            : sqlAllCount;
    
          const countParams = date ? [date] : to && from ? [from, to] : [];
          const result = await mysqlcon(countQuery, countParams);
          const total = result[0]?.Total || 0;
    
          const page = pageNumber ? Number(pageNumber) : 1;
          const limit = req.body.limit ? Number(req.body.limit) : 10;
    
          const { start, numOfPages } = Pagination.pagination(total, page, limit);
    
          const baseQuery = `
            SELECT tbl_settlement.*,
              DATE_FORMAT(requested_time,'%Y-%m-%d %H:%i:%s') AS requested_time,
              DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on,
              DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on,
              DATE_FORMAT(settlement_time,'%Y-%m-%d %H:%i:%s') AS settlement_time
            FROM tbl_settlement
            WHERE settlement_mode = 1
          `;
    
          const sqlQuery = date
            ? `${baseQuery} AND DATE(created_on) = ? ORDER BY created_on DESC LIMIT ?,?`
            : to && from
            ? `${baseQuery} AND DATE(created_on) >= ? AND DATE(created_on) <= ? ORDER BY created_on DESC LIMIT ?,?`
            : searchItem
            ? `${baseQuery} AND settlementId LIKE '%${searchItem}%' ORDER BY created_on DESC LIMIT ?,?`
            : `${baseQuery} ORDER BY created_on DESC LIMIT ?,?`;
    
          const dataParams: any[] = date
            ? [date, start, limit]
            : to && from
            ? [from, to, start, limit]
            : [start, limit];
    
          const data = await mysqlcon(sqlQuery, dataParams);
    
          const startRange = start + 1;
          const endRange = start + data.length;
    
          res.status(200).json({
            groupId: group_id,
            message:
              data.length > 0
                ? `Showing ${startRange} to ${endRange} data from ${total}`
                : "NO DATA",
            result: data,
            numOfPages: numOfPages || 1,
          });
        } catch (error: any) {
          console.error(error);
          res.status(500).json({
            message: "Something went wrong",
            error: error.message || error,
          });
        }
  }

  public async requestInternational(req: Request, res: Response): Promise<void> {
        try {
          const {
            settlementId,
            user_id,
            settlementType,
            currency,
            toCurrency,
            walletAdd,
            wallet_type,
            accountN,
            account_name,
            availableBalance,
            requestedAmount,
            fees,
            net_amount_for_settlement,
            exchangeRate,
            bankName,
            branchName,
            city,
            zipcode,
            country,
            swift,
            authorizer,
            remBalance
          } = req.body;
    
          const { group_id, role } = req.user;
    
          let source: string;
          if (group_id === 1) {
            source = "By SuperAdmin";
          } else {
            source = role === 1 ? "By Admin" : "By Settlement";
          }
    
          const nameSql = "SELECT name FROM tbl_user WHERE id = ?";
          const nameResult: any[] = await mysqlcon(nameSql, [user_id]);
          const merchant_name = nameResult[0]?.name || "";
    
          const settlementAmount =
            requestedAmount && !fees && !exchangeRate
              ? requestedAmount
              : requestedAmount && fees && !exchangeRate
              ? requestedAmount - fees
              : requestedAmount && fees && exchangeRate
              ? (requestedAmount - fees) / exchangeRate
              : 0;
    
          const Settlement = {
            settlementId,
            user_id,
            settlementType,
            fromCurrency: currency,
            toCurrency,
            walletAddress: walletAdd,
            wallet_type,
            accountNumber: accountN,
            account_name,
            available_balance: availableBalance,
            requestedAmount,
            charges: fees,
            net_amount_for_settlement,
            exchangeRate,
            bankName,
            branchName,
            city,
            zip_code: zipcode,
            country,
            swiftCode: swift,
            authorizer,
            settlementAmount,
            source,
            settlement_mode: 1,
            status: 2,
            merchant_name,
          };
    
          const insertSQL =
            "INSERT INTO tbl_settlement SET ?, requested_time = NOW(), created_on = NOW(), updated_on = NOW()";
          const result: any = await mysqlcon(insertSQL, Settlement);
    
          const updateSQL = "UPDATE tbl_user SET wallet = ? WHERE id = ?";
          const walletResult = await mysqlcon(updateSQL, [remBalance, user_id]);
    
          if (result.affectedRows > 0) {
             res.status(200).json({
              message: "Request settlement transaction Successfully",
              // data: result,
            });
          } else {
             res.status(201).json({
              message: "Error While Creating",
              // data: result,
            });
          }
        } catch (error) {
          console.error(error);
           res.status(500).json({
            message: "error occurred",
            error,
          });
        }
  }

  public async editInternational(req: Request<EditSettlementRequestBody>, res: Response): Promise<void> {
        try {
          const {
            id,
            settlementId,
            user_id,
            settlementType,
            currency,
            toCurrency,
            walletAdd,
            wallet_type,
            accountN,
            account_name,
            availableBalance,
            requestedAmount,
            fees,
            exchangeRate,
            bankName,
            branchName,
            city,
            zipcode,
            country,
            swift,
            authorizer
          } = req.body;
    
          const net_amount_for_settlement =
            requestedAmount && fees ? requestedAmount - fees : requestedAmount;
    
          const settlementAmount =
            requestedAmount && !fees && !exchangeRate
              ? requestedAmount
              : requestedAmount && fees && !exchangeRate
              ? requestedAmount - fees
              : requestedAmount && fees && exchangeRate
              ? (requestedAmount - fees) / exchangeRate
              : 0;
    
          const Settlement = {
            settlementId,
            user_id,
            settlementType,
            fromCurrency: currency,
            toCurrency,
            walletAddress: walletAdd,
            wallet_type: settlementType, 
            accountNumber: accountN,
            account_name,
            available_balance: availableBalance,
            requestedAmount,
            charges: fees,
            net_amount_for_settlement,
            exchangeRate,
            bankName,
            branchName,
            city,
            zip_code: zipcode,
            country,
            swiftCode: swift,
            authorizer,
            settlementAmount
          };
    
          const updateSQL =
            "UPDATE tbl_settlement SET ?, requested_time = NOW(), updated_on = NOW() WHERE id = ?";
          const result: any = await mysqlcon(updateSQL, [Settlement, id]);
    
          if (result.affectedRows > 0) {
             res.status(200).json({
              message: "Request settlement transaction updated successfully",
              data: result,
            });
          } else {
             res.status(201).json({
              message: "Error while updating",
              data: result,
            });
          }
        } catch (error) {
          console.error(error);
           res.status(500).json({
            message: "An error occurred",
            error,
          });
        }
  }

  public async defaultInternationalDownload(req: Request<DownloadRequestBody>, res: Response): Promise<void> {
    try {
      const {
        to,
        from,
        date,
        searchItem
      } = req.body;

      console.log(req.body);

      const baseQuery = "SELECT * FROM tbl_settlement WHERE settlement_mode = 1 ORDER BY created_on";
      const dateQuery = "SELECT * FROM tbl_settlement WHERE DATE(created_on) = ? AND settlement_mode = 1 ORDER BY created_on";
      const toFromQuery = "SELECT * FROM tbl_settlement WHERE DATE(created_on) >= ? AND DATE(created_on) <= ? AND settlement_mode = 1 ORDER BY created_on";
      const searchQuery = `SELECT * FROM tbl_settlement WHERE settlementId LIKE ? AND settlement_mode = 1 ORDER BY created_on`;

      let query: string;
      let values: any[] = [];

      if (date) {
        query = dateQuery;
        values = [date];
      } else if (to && from) {
        query = toFromQuery;
        values = [from, to];
      } else if (searchItem) {
        query = searchQuery;
        values = [`%${searchItem}%`];
      } else {
        query = baseQuery;
      }

      const result = await mysqlcon(query, values);
      res.send(result);

    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Server Error",
        err,
      });
    }
  }

  public async toggleInternationalStatus(req: Request, res: Response): Promise<void> {
    try {
      const { group_id } = req.user!;
      const { settlementId, val } = req.body;

      let sql = "";
      let message = "";

      if (val === 1) {
        if (group_id === 1) {
          sql = "UPDATE tbl_settlement SET status = 1 WHERE settlementId = ?";
          message = "Status Approved Successfully By Superadmin";
        } else if (group_id === 2) {
          sql = "UPDATE tbl_settlement SET status = 3 WHERE settlementId = ?";
          message = "Approval Request Sent To SuperAdmin";
        }
      } else {
        sql = "UPDATE tbl_settlement SET status = 0 WHERE settlementId = ?";
        message = group_id === 1
          ? "Status Failed Successfully By Superadmin"
          : "Status Failed Successfully By Subadmin";
      }

      const result = await mysqlcon(sql, [settlementId]);

      if (result) {
         res.status(200).json({ message });
      } else {
         res.status(201).json({ message: "Error While Updating" });
      }

    } catch (err) {
      console.error(err);
       res.status(500).json({ message: "Error occurred" });
    }
  }

  public async internationalCards(req: Request<InternationalCardsRequestBody>, res: Response): Promise<void> {
    try {
      const { to, from, date, searchItem } = req.body;

      const cardSql = `SELECT count(*) as count, SUM(requestedAmount) as amount, SUM(charges) as charges,
        SUM(net_amount_for_settlement) as net_amount_for_settlement, SUM(settlementAmount) as settlementAmount
        FROM tbl_settlement WHERE settlement_mode = 1`;

      const sqlToFrom = `${cardSql} AND DATE(created_on) >= ? AND DATE(created_on) <= ?`;
      const sqlDate = `${cardSql} AND DATE(created_on) = ?`;
      const sqlSearch = `${cardSql} AND settlementId LIKE '%${searchItem}%'`;

      const query = to && from
        ? sqlToFrom
        : date
        ? sqlDate
        : searchItem
        ? sqlSearch
        : cardSql;

      const params = to && from
        ? [from, to]
        : date
        ? [date]
        : [];

      const result = await mysqlcon(query, params);
      const stats = result[0];

      const requestedAmount = stats.amount ? stats.amount.toFixed(2) : 0;
      const charges = stats.charges ? stats.charges.toFixed(2) : 0;
      const netAmount = stats.net_amount_for_settlement ? stats.net_amount_for_settlement.toFixed(2) : 0;
      const totalAmount = stats.settlementAmount ? stats.settlementAmount.toFixed(2) : 0;

      const cardData = [
        { name: "Total Settlement Request", amount: requestedAmount },
        { name: "Total Fees/Charges", amount: charges },
        { name: "Total Amount Sent", amount: netAmount },
        { name: "Total Amount Received", amount: totalAmount },
      ];

      if (stats.count === 0) {
         res.status(201).json({
          message: "User has no transaction",
          data: cardData.map(card => ({ ...card, amount: 0 })),
        });
      } else {
         res.status(200).json({
          message: "All Status Data",
          data: cardData,
        });
      }
    } catch (error) {
      console.error(error);
       res.status(500).json({
        message: "Error occurred",
        error,
      });
    }
  }
}

export default new InternationalSettlement();
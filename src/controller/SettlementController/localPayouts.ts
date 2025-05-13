import { Request, Response } from "express";
import mysqlcon from "../../config/db_connection";

//default
interface PayoutRequestBody {
  to?: string;
  from?: string;
  date?: string;
  merchantSelect?: string;
  currency?: string;
  status?: string;
  searchItem?: string;
  pageNumber?: number;
  limit?: number;
  start: number;
  numOfPages: number;
  Total: number;
}
//localPayoutsCards
interface LocalPayoutsRequestBody {
  to?: string;
  from?: string;
  status?: string;
  merchantSelect?: string;
  currency?: string;
  searchItem?: string;
  name: string;
  count: number | null;
  amount: number | null;
  charges: number | null;
  gst: number | null;
}
//downloadLocalPayouts
interface PayoutDownloadRequest {
  to?: string;
  from?: string;
  date?: string;
  merchantSelect?: string;
  currency?: string;
  status?: string;
  searchItem?: string;
}

class LocalPayouts{
  public async default(req: Request<PayoutRequestBody>, res: Response): Promise<void> {
    try {
      const pagination = (total: number, page: number, limit: number) => {
        const numOfPages = Math.ceil(total / limit);
        const start = page * limit - limit;
        return { limit, start, numOfPages };
      }

      const {
        to,
        from,
        date,
        merchantSelect,
        currency,
        status,
        searchItem,
        pageNumber,
        limit: bodyLimit,
      } = req.body;

      const sqlAllCount = `SELECT COUNT(*) as Total FROM tbl_icici_payout_transaction_response_details`;
      const sqCountDate = `SELECT COUNT(*) as Total FROM tbl_icici_payout_transaction_response_details WHERE DATE(created_on) = ?`;
      const sqlToFromCount = `SELECT COUNT(*) as Total FROM tbl_icici_payout_transaction_response_details WHERE DATE(created_on) >= ? AND DATE(created_on) <= ?`;
      const sqlSearchCount = `SELECT COUNT(*) as Total FROM tbl_icici_payout_transaction_response_details WHERE uniqueid LIKE '%${searchItem}%' OR payee_name LIKE '%${searchItem}%'`;
      const sqlMerchant = `SELECT COUNT(*) as Total FROM tbl_icici_payout_transaction_response_details WHERE users_id = ?`;
      const sqlCurrency = `SELECT COUNT(*) as Total FROM tbl_icici_payout_transaction_response_details WHERE currency = ?`;
      const sqlStatus = `SELECT COUNT(*) as Total FROM tbl_icici_payout_transaction_response_details WHERE status = ?`;
      const sqlmercur = `SELECT COUNT(*) as Total FROM tbl_icici_payout_transaction_response_details WHERE users_id = ? AND currency = ?`;
      const sqlDateMerchantCurrency = `SELECT COUNT(*) as Total FROM tbl_icici_payout_transaction_response_details WHERE users_id = ? AND currency = ? AND DATE(created_on) = ?`;
      const sqlToFromMerchantCurrency = `SELECT COUNT(*) as Total FROM tbl_icici_payout_transaction_response_details WHERE users_id = ? AND currency = ? AND DATE(created_on) >= ? AND DATE(created_on) <= ?`;

      const countQuery = to && from && merchantSelect && currency
        ? sqlToFromMerchantCurrency
        : merchantSelect && currency && date
        ? sqlDateMerchantCurrency
        : to && from
        ? sqlToFromCount
        : merchantSelect && currency
        ? sqlmercur
        : date
        ? sqCountDate
        : merchantSelect
        ? sqlMerchant
        : currency
        ? sqlCurrency
        : status
        ? sqlStatus
        : searchItem
        ? sqlSearchCount
        : sqlAllCount;

      const countParams =
        to && from && merchantSelect && currency
          ? [merchantSelect, currency, to, from]
          : merchantSelect && currency && date
          ? [merchantSelect, currency, date]
          : to && from
          ? [to, from]
          : merchantSelect && currency
          ? [merchantSelect, currency]
          : date
          ? [date]
          : merchantSelect
          ? [merchantSelect]
          : currency
          ? [currency]
          : status
          ? [status]
          : [];

      const countResult = await mysqlcon(countQuery, countParams);
      const total = countResult[0].Total;

      const Page = pageNumber ? Number(pageNumber) : 1;
      const limit = bodyLimit ? Number(bodyLimit) : 10;
      const page = pagination(total, Page, limit);

      const baseSelect = `SELECT tbl_user.name, tbl_icici_payout_transaction_response_details.* FROM tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_icici_payout_transaction_response_details.users_id = tbl_user.id`;

      const sql = `${baseSelect} ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC LIMIT ?, ?`;
      const sqlDate = `${baseSelect} WHERE DATE(tbl_icici_payout_transaction_response_details.created_on) = ? ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC LIMIT ?, ?`;
      const sqlToFrom = `${baseSelect} WHERE DATE(tbl_icici_payout_transaction_response_details.created_on) >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ? ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC LIMIT ?, ?`;
      const sqlSearch = `SELECT * FROM tbl_icici_payout_transaction_response_details WHERE uniqueid LIKE '%${searchItem}%' OR payee_name LIKE '%${searchItem}%' ORDER BY created_on DESC LIMIT ?, ?`;
      const merchantSql = `${baseSelect} WHERE tbl_icici_payout_transaction_response_details.users_id = ? ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC LIMIT ?, ?`;
      const currencySql = `${baseSelect} WHERE tbl_icici_payout_transaction_response_details.currency = ? ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC LIMIT ?, ?`;
      const statusSql = `${baseSelect} WHERE tbl_icici_payout_transaction_response_details.status = ? ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC LIMIT ?, ?`;
      const merCurSql = `${baseSelect} WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.currency = ? ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC LIMIT ?, ?`;
      const dateMerchantCurrencySql = `${baseSelect} WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.currency = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) = ? ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC LIMIT ?, ?`;
      const toFromMerchantCurrencySql = `${baseSelect} WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.currency = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ? ORDER BY tbl_icici_payout_transaction_response_details.created_on DESC LIMIT ?, ?`;

      const dataQuery = to && from && merchantSelect && currency
        ? toFromMerchantCurrencySql
        : merchantSelect && currency && date
        ? dateMerchantCurrencySql
        : to && from
        ? sqlToFrom
        : merchantSelect && currency
        ? merCurSql
        : date
        ? sqlDate
        : merchantSelect
        ? merchantSql
        : currency
        ? currencySql
        : status
        ? statusSql
        : searchItem
        ? sqlSearch
        : sql;

      const dataParams =
        to && from && merchantSelect && currency
          ? [merchantSelect, currency, to, from, page.start, page.limit]
          : merchantSelect && currency && date
          ? [merchantSelect, currency, date, page.start, page.limit]
          : to && from
          ? [to, from, page.start, page.limit]
          : merchantSelect && currency
          ? [merchantSelect, currency, page.start, page.limit]
          : date
          ? [date, page.start, page.limit]
          : merchantSelect
          ? [merchantSelect, page.start, page.limit]
          : currency
          ? [currency, page.start, page.limit]
          : status
          ? [status, page.start, page.limit]
          : [page.start, page.limit];

      const data = await mysqlcon(dataQuery, dataParams);

      const startRange = page.start + 1;
      const endRange = page.start + data.length;

      res.status(200).json({
        message:
          data.length > 0
            ? `Showing ${startRange} to ${endRange} data from ${total}`
            : "NO DATA",
        totalPages: page.numOfPages || 1,
        pageLimit: page.limit,
        result: data,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  }

  public async localPayoutsCards(req: Request<LocalPayoutsRequestBody>, res: Response): Promise<void>  {
    try {
      const { to, from, status, merchantSelect, currency, searchItem } = req.body;
  
      const baseQuery = `SELECT COUNT(*) AS count, 
                                SUM(tbl_icici_payout_transaction_response_details.amount) AS amount,
                                SUM(tbl_icici_payout_transaction_response_details.akonto_charge) AS charges,
                                SUM(tbl_icici_payout_transaction_response_details.gst_amount) AS gst
                          FROM tbl_icici_payout_transaction_response_details
                          LEFT JOIN tbl_user ON tbl_user.id = tbl_icici_payout_transaction_response_details.users_id`;
  
      const conditions: { query: string; values: any[] }[] = [
        { query: `WHERE tbl_icici_payout_transaction_response_details.currency = ?`, values: [currency] },
        { query: `WHERE DATE(tbl_icici_payout_transaction_response_details.created_on) >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?`, values: [from, to] },
        { query: `WHERE tbl_icici_payout_transaction_response_details.users_id = ?`, values: [merchantSelect] },
        { query: `WHERE tbl_icici_payout_transaction_response_details.status = ?`, values: [status] },
        { query: `WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.status = ?`, values: [merchantSelect, status] },
        { query: `WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?`, values: [merchantSelect, from, to] },
        { query: `WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.status = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ?`, values: [merchantSelect, status, from, to] },
      ];
  
      const searchQuery = `WHERE tbl_icici_payout_transaction_response_details.uniqueid LIKE '%${searchItem}%' OR payee_name LIKE '%${searchItem}%'`;
  
      let sql = baseQuery;
      let params: any[] = [];
  
      if (merchantSelect && status && to && from) {
        sql += ` ${conditions[6].query}`;
        params = conditions[6].values;
      } else if (merchantSelect && to && from) {
        sql += ` ${conditions[5].query}`;
        params = conditions[5].values;
      } else if (to && from) {
        sql += ` ${conditions[1].query}`;
        params = conditions[1].values;
      } else if (merchantSelect && status) {
        sql += ` ${conditions[4].query}`;
        params = conditions[4].values;
      } else if (merchantSelect) {
        sql += ` ${conditions[2].query}`;
        params = conditions[2].values;
      } else if (status) {
        sql += ` ${conditions[3].query}`;
        params = conditions[3].values;
      } else if (currency) {
        sql += ` ${conditions[0].query}`;
        params = conditions[0].values;
      } else if (searchItem) {
        sql += ` ${searchQuery}`;
      }
  
      const result = await mysqlcon(sql, params);
  
      const responseData = [
        {
          name: "Total No. Of Transaction",
          amount: result[0].count ?? 0,
        },
        {
          name: "Total Payout Transaction",
          amount: result[0].amount !== null ? result[0].amount.toFixed(2) : 0,
        },
        {
          name: "Total Payout Charges",
          amount: result[0].charges !== null ? result[0].charges.toFixed(2) : 0,
        },
        {
          name: "Total GST Amount",
          amount: result[0].gst !== null ? result[0].gst.toFixed(2) : 0,
        },
      ];
  
      const statusCode = result[0].count === 0 ? 201 : 200;
  
       res.status(statusCode).json({
        data: responseData,
      });
  
    } catch (err) {
      console.error(err);
       res.status(500).json({
        message: "Server Error",
        err,
      });
    }
  }

  public async downloadLocalPayouts(req: Request<PayoutDownloadRequest>, res: Response): Promise<void> {
  try {
    const {
      to,
      from,
      date,
      merchantSelect,
      currency,
      status,
      searchItem,
    } = req.body;

    let sql =
      "select tbl_user.name, tbl_icici_payout_transaction_response_details.* from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_icici_payout_transaction_response_details.users_id = tbl_user.id ORDER BY tbl_icici_payout_transaction_response_details.created_on";

    let sqlDate =
      "select tbl_user.name, tbl_icici_payout_transaction_response_details.* from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_icici_payout_transaction_response_details.users_id = tbl_user.id WHERE DATE(tbl_icici_payout_transaction_response_details.created_on) = ? ORDER BY tbl_icici_payout_transaction_response_details.created_on";

    let sqlToFrom =
      "select tbl_user.name, tbl_icici_payout_transaction_response_details.* from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_icici_payout_transaction_response_details.users_id = tbl_user.id WHERE DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ? ORDER BY tbl_icici_payout_transaction_response_details.created_on";

    let sqlSearch = `select * from tbl_icici_payout_transaction_response_details where uniqueid LIKE '%${searchItem}%' OR payee_name LIKE '%${searchItem}%' ORDER BY created_on`;

    let merchantSql =
      "select tbl_user.name, tbl_icici_payout_transaction_response_details.* from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_icici_payout_transaction_response_details.users_id = tbl_user.id WHERE tbl_icici_payout_transaction_response_details.users_id = ? ORDER BY tbl_icici_payout_transaction_response_details.created_on";

    let currencySql =
      "select tbl_user.name, tbl_icici_payout_transaction_response_details.* from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_icici_payout_transaction_response_details.users_id = tbl_user.id WHERE tbl_icici_payout_transaction_response_details.currency = ? ORDER BY tbl_icici_payout_transaction_response_details.created_on";

    let statusSql =
      "select tbl_user.name, tbl_icici_payout_transaction_response_details.* from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_icici_payout_transaction_response_details.users_id = tbl_user.id WHERE tbl_icici_payout_transaction_response_details.status = ? ORDER BY tbl_icici_payout_transaction_response_details.created_on";

    let merCurSql =
      "select tbl_user.name, tbl_icici_payout_transaction_response_details.* from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_icici_payout_transaction_response_details.users_id = tbl_user.id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.currency = ? ORDER BY tbl_icici_payout_transaction_response_details.created_on";

    let toFromMerchantCurrencySql =
      "select tbl_user.name, tbl_icici_payout_transaction_response_details.* from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_icici_payout_transaction_response_details.users_id = tbl_user.id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.currency = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on)  >= ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) <= ? ORDER BY tbl_icici_payout_transaction_response_details.created_on";

    let dateMerchantCurrencySql =
      "select tbl_user.name, tbl_icici_payout_transaction_response_details.* from tbl_icici_payout_transaction_response_details LEFT JOIN tbl_user ON tbl_icici_payout_transaction_response_details.users_id = tbl_user.id WHERE tbl_icici_payout_transaction_response_details.users_id = ? AND tbl_icici_payout_transaction_response_details.currency = ? AND DATE(tbl_icici_payout_transaction_response_details.created_on) = ? ORDER BY tbl_icici_payout_transaction_response_details.created_on";

    let query: string;
    let params: any[] = [];

    if (to && from && merchantSelect && currency) {
      query = toFromMerchantCurrencySql;
      params = [merchantSelect, currency, from, to];
    } else if (date && merchantSelect && currency) {
      query = dateMerchantCurrencySql;
      params = [merchantSelect, currency, date];
    } else if (to && from) {
      query = sqlToFrom;
      params = [from, to];
    } else if (merchantSelect && currency) {
      query = merCurSql;
      params = [merchantSelect, currency];
    } else if (date) {
      query = sqlDate;
      params = [date];
    } else if (merchantSelect) {
      query = merchantSql;
      params = [merchantSelect];
    } else if (currency) {
      query = currencySql;
      params = [currency];
    } else if (status) {
      query = statusSql;
      params = [status];
    } else if (searchItem) {
      query = sqlSearch;
    } else {
      query = sql;
    }

    const result = searchItem
      ? await mysqlcon(query)
      : await mysqlcon(query, params);

    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server Error",
      err,
    });
  }
  }
}

export default new LocalPayouts();
import { Request, Response } from "express";
import mysqlcon from "../../config/db_connection";
import Pagination from "../../services/pagination";

let today = new Date(); 
let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
let dateTime = date+' '+time; 

//default
interface FundRequestBody {
  to?: string;
  from?: string;
  date?: string;
  pageNumber?: number;
  limit?: number;
  searchItem?: string;
}
//curMer
interface Merchant {
  label: string;
  id: number;
}
//addFund
interface AddFundRequestBody {
  merchant_id: number;
  objective: string;
  currency: string;
  effective_amt: number;
  remarks: string;
  filtertype?: number;
}
//addFund
interface AuthenticatedRequest extends Request {
  body: AddFundRequestBody;
  user?: any; // You can define proper user type here if available
}
//updateFund
interface UpdateFundRequestBody {
  id: string;
  selectMer: string;
  merchant_name: string;
  current_amount: string;
  currency: string;
  addBal: string;
  option: string;
  available_balance: string;
  wallet_current_amount: string;
  firstname: string;
  lastname: string;
}

class AddFund{
  public async default(req: Request<FundRequestBody>, res: Response): Promise<void> {
    try {
      const { to, from, date, pageNumber, limit, searchItem } = req.body || {};

      let sqlAllCount = `
        SELECT COUNT(*) as Total
        FROM tbl_wallet_update_log
        LEFT JOIN tbl_user ON tbl_user.id = tbl_wallet_update_log.merchant_id
      `;

      let sqlCountDate = `
        SELECT COUNT(*) as Total
        FROM tbl_wallet_update_log
        LEFT JOIN tbl_user ON tbl_user.id = tbl_wallet_update_log.merchant_id
        WHERE DATE(tbl_wallet_update_log.created_on) = ?
      `;

      let sqlToFromCount = `
        SELECT COUNT(*) as Total
        FROM tbl_wallet_update_log
        LEFT JOIN tbl_user ON tbl_user.id = tbl_wallet_update_log.merchant_id
        WHERE DATE(tbl_wallet_update_log.created_on) >= ?
        AND DATE(tbl_wallet_update_log.created_on) <= ?
      `;

      let sqlSearchCount = `
        SELECT COUNT(*) as Total
        FROM tbl_wallet_update_log
        LEFT JOIN tbl_user ON tbl_user.id = tbl_wallet_update_log.merchant_id
        WHERE tbl_wallet_update_log.merchant_id LIKE ?
      `;

      let countQuery = date
        ? sqlCountDate
        : to && from
        ? sqlToFromCount
        : searchItem
        ? sqlSearchCount
        : sqlAllCount;

      let countParams = date
        ? [date]
        : to && from
        ? [from, to]
        : searchItem
        ? [`%${searchItem}%`]
        : [];

      const result = await mysqlcon(countQuery, countParams);
      const total = result[0]?.Total ?? 0;

      const page = pageNumber ? Number(pageNumber) : 1;
      const lim = limit ? Number(limit) : 10;

      const { start, numOfPages } = Pagination.pagination(total, page, lim);

      let sqlDefault = `
        SELECT tbl_user.name as merchant_name, tbl_wallet_update_log.*,
        DATE_FORMAT(tbl_wallet_update_log.created_on,'%Y-%m-%d %H:%i:%s') AS created_on
        FROM tbl_wallet_update_log
        LEFT JOIN tbl_user ON tbl_user.id = tbl_wallet_update_log.merchant_id
        ORDER BY tbl_wallet_update_log.created_on DESC
        LIMIT ?,?
      `;

      let sqlDate = `
        SELECT tbl_user.name as merchant_name, tbl_wallet_update_log.*,
        DATE_FORMAT(tbl_wallet_update_log.created_on,'%Y-%m-%d %H:%i:%s') AS created_on
        FROM tbl_wallet_update_log
        LEFT JOIN tbl_user ON tbl_user.id = tbl_wallet_update_log.merchant_id
        WHERE DATE(tbl_wallet_update_log.created_on) = ?
        ORDER BY tbl_wallet_update_log.created_on DESC
        LIMIT ?,?
      `;

      let sqlToFrom = `
        SELECT tbl_user.name as merchant_name, tbl_wallet_update_log.*,
        DATE_FORMAT(tbl_wallet_update_log.created_on,'%Y-%m-%d %H:%i:%s') AS created_on
        FROM tbl_wallet_update_log
        LEFT JOIN tbl_user ON tbl_user.id = tbl_wallet_update_log.merchant_id
        WHERE DATE(tbl_wallet_update_log.created_on) >= ?
        AND DATE(tbl_wallet_update_log.created_on) <= ?
        ORDER BY tbl_wallet_update_log.created_on DESC
        LIMIT ?,?
      `;

      let sqlSearch = `
        SELECT tbl_user.name as merchant_name, tbl_wallet_update_log.*,
        DATE_FORMAT(tbl_wallet_update_log.created_on,'%Y-%m-%d %H:%i:%s') AS created_on
        FROM tbl_wallet_update_log
        LEFT JOIN tbl_user ON tbl_user.id = tbl_wallet_update_log.merchant_id
        WHERE tbl_wallet_update_log.merchant_id LIKE ?
        ORDER BY tbl_wallet_update_log.created_on DESC
      `;

      const dataQuery = date
        ? sqlDate
        : to && from
        ? sqlToFrom
        : searchItem
        ? sqlSearch
        : sqlDefault;

      const dataParams = date
        ? [date, start, lim]
        : to && from
        ? [from, to, start, lim]
        : searchItem
        ? [`%${searchItem}%`]
        : [start, lim];

      const data = await mysqlcon(dataQuery, dataParams);
      const startRange = start + 1;
      const endRange = start + data.length;

      res.status(200).json({
        message:
          data.length > 0
            ? `Showing ${startRange} to ${endRange} data from ${total}`
            : "NO DATA",
        result: data,
        numOfPages: numOfPages || 1,
      });
    } catch (error) {
      console.error("Error in AddFund:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  }

  public async curMer(req: Request<Merchant>, res: Response): Promise<void> {
    try {
      const sqlMer = "SELECT name AS label, id FROM tbl_user";
      const sqlCurr = "SELECT id, sortname AS label FROM countries WHERE status = 1";

      const merchant = await mysqlcon(sqlMer);
      const currency = await mysqlcon(sqlCurr);

      res.status(200).json({ merchant, currency });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public async murAndCurSelect(req: Request, res: Response): Promise<void> {
    try {
      const { merId }: { merId: number } = req.body; 
      const sql = 'SELECT wallet FROM tbl_user WHERE id = ?';
      const result = await mysqlcon(sql, [merId]);
  
      res.status(200).json({ preBal: result });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
  
  public async addFund(req: Request, res: Response): Promise<void> {
  try {
    if (
      req.body.merchant_id === undefined ||
      req.body.objective === undefined ||
      req.body.currency === undefined ||
      req.body.effective_amt === undefined ||
      req.body.remarks === undefined
    ) {
       res.status(400).send({ message: 'All Fields are Required' });
    }

    const sqlSettCurr = "SELECT settle_currency, wallet FROM tbl_user WHERE id = ?";
    const result = await mysqlcon(sqlSettCurr, [req.body.merchant_id]);

    if (result.length === 0) {
       res.status(404).json({ message: "Merchant not found" });
    }

    const currentWallet = Number(result[0].wallet);
    const effectiveAmt = Number(req.body.effective_amt);
    const FinalAddForWallet = currentWallet + effectiveAmt;
    const FinalSubForWallet = currentWallet - effectiveAmt;

    let loginDetails = 0;
    if (req.user?.group_id === 1) {
      loginDetails = -1;
    } else if (req.user?.group_id === 2) {
      loginDetails = req.user.role === 1 ? 1 : 2;
    }

    const filtertype = req.body.filtertype ? Number(req.body.filtertype) : 1;
    const newWallet = filtertype === 1 ? FinalAddForWallet : FinalSubForWallet;

    const insertLogData = {
      merchant_id: req.body.merchant_id,
      objective: req.body.objective,
      currency: req.body.currency,
      current_wallet: currentWallet,
      update_wallet_tot: newWallet,
      effective_amt: effectiveAmt,
      current_action: filtertype,
      remark: req.body.remarks,
      created_on: dateTime,
      login_admin: loginDetails,
    };

    const updateWalletSQL = "UPDATE tbl_user SET wallet = ? WHERE id = ?";
    await mysqlcon(updateWalletSQL, [newWallet, req.body.merchant_id]);

    const insertLogSQL = "INSERT INTO tbl_wallet_update_log SET ?";
    await mysqlcon(insertLogSQL, [insertLogData]);

    const actionText = filtertype === 1 ? "Added" : "Subtracted";
    res.status(200).json({ message: `Fund ${actionText} Successfully ✅` });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'An error occurred while processing the request.',
    });
  }
  }

  public async updateFund(req: Request<UpdateFundRequestBody>, res: Response): Promise<void>{
    try {
      const date = new Date();
      const {
        id,
        selectMer,
        merchant_name,
        current_amount,
        currency,
        addBal,
        option,
        available_balance,
        wallet_current_amount,
        firstname, 
        lastname
      } = req.body;
  
      if (
        selectMer === undefined ||
        merchant_name === undefined ||
        current_amount === undefined ||
        currency === undefined ||
        addBal === undefined ||
        option === undefined ||
        available_balance === undefined ||
        wallet_current_amount === undefined ||
        id === undefined
      ) {
        res.status(400).json({ message: "All Field Required" });
        return;
      }
  
      const insertData = {
        merchant_id: selectMer,
        merchant_name,
        current_amount,
        currency,
        wallet_current_amount,
        add_amount: addBal,
        available_balance,
        funds_added_by: `${firstname} ${lastname}`,
        type: option,
        updated_on: date,
      };
  
      const sqlSettCurr = "SELECT settle_currency, wallet FROM tbl_user WHERE id = ?";
      const sqlSettRate =
        "SELECT rate FROM tbl_user_settled_currency WHERE deposit_currency = ? AND settled_currency = ?";
  
      const result: any[] = await mysqlcon(sqlSettCurr, [15]);
      const result2: any[] = await mysqlcon(sqlSettRate, [currency, result[0].settle_currency]);
  
      const rate = result2[0]?.rate || 1;
      const FinalDataForWallet =
        Number(option) === 1
          ? result[0].wallet + Number(addBal) / rate
          : result[0].wallet - Number(addBal) / rate;
  
      const sqlForWall = "UPDATE tbl_user SET wallet = ? WHERE id = ?";
      await mysqlcon(sqlForWall, [FinalDataForWallet, selectMer]);
  
      const sqlForAddFund = "UPDATE tbl_add_settlement_fund SET ? WHERE id = ?";
      await mysqlcon(sqlForAddFund, [insertData, id]);
  
      res.status(200).json({ message: "Fund Update Successfully✅" });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
    }
  }
}

export default new AddFund();
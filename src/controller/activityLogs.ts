import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';

interface Pagination {
    limit: number;
    start: number;
    numOfPages: number;
}
  
  
const pagination = (total: number, page: number, limit: number): Pagination => {
    const numOfPages = Math.ceil(total / limit);
    const start = page * limit - limit;
    return { limit, start, numOfPages };
};
interface AdminLogRequestBody {
    searchItem?: string;
    limit?: number;
    merchantName?: number;
    page?: number;
}

interface MerchantRequest {
    searchItem?: string;
    limit?: number;
    merchantName?: number;
    page?: number;
}

interface walletRequest {
    searchItem?: string;
    limit?: number;
    merchantName?: number;
    page?: number;
}
interface walletExportRequest {
    id?:string,
    from?:string,
    to?:string
}

interface allowPaymentsReq {
    limit?: number;
    firstname?: string;
    page?: number;
}


class ActivityLogs {
  async adminLogs(req:Request<AdminLogRequestBody>,res:Response):Promise<void> {
    try {
      const { searchItem, limit, merchantName, page } = req.body;
      let sql = "SELECT count (*) as Total  FROM tbl_admin_log INNER JOIN tbl_login ON tbl_admin_log.admin_id = tbl_login.user_id ";
      let sqlCount =
      "SELECT count (*) as Total FROM tbl_admin_log INNER JOIN tbl_login ON tbl_admin_log.admin_id = tbl_login.user_id WHERE id  LIKE '%" +
      searchItem +
      "%' OR  admin_id  LIKE '%" +
      searchItem +
      "%' OR  url  LIKE '%" +
      searchItem +
      "%'"
      let sqlACount = `SELECT count (*) as Total  FROM tbl_admin_log INNER JOIN tbl_login ON tbl_admin_log.admin_id = tbl_login.user_id where admin_id=  ${merchantName}`;
      let result = await mysqlcon(
        searchItem ? sqlCount : merchantName ? sqlACount : sql
      );
      let total = result[0].Total;
      let currentpage = page ? Number(page) : 1;
      let pagelimit = limit ? Number(limit) : 10;
      let { start, numOfPages } = pagination(total, currentpage, pagelimit);
      let sql1 = `SELECT CONCAT(firstname,lastname) as name ,tbl_admin_log.url ,tbl_admin_log.updated_on,tbl_admin_log.created_on,  TIMEDIFF(tbl_admin_log.updated_on,tbl_admin_log.created_on)as timeDeff FROM tbl_admin_log INNER JOIN tbl_login ON tbl_admin_log.admin_id = tbl_login.user_id  LIMIT ?,?`;
      let sql2 =
        "SELECT CONCAT(firstname,lastname) as name ,tbl_admin_log.url ,tbl_admin_log.updated_on,tbl_admin_log.created_on,  TIMEDIFF(tbl_admin_log.updated_on,tbl_admin_log.created_on)as timeDeff FROM tbl_admin_log INNER JOIN tbl_login ON tbl_admin_log.admin_id = tbl_login.user_id where admin_id= ? LIMIT ?,?";
      let sql3 =
        "SELECT CONCAT(firstname,lastname) as name ,tbl_admin_log.url ,tbl_admin_log.updated_on,tbl_admin_log.created_on,  TIMEDIFF(tbl_admin_log.updated_on,tbl_admin_log.created_on)as timeDeff FROM tbl_admin_log INNER JOIN tbl_login ON tbl_admin_log.admin_id = tbl_login.user_id WHERE id  LIKE '%" +
        searchItem +
        "%' OR  admin_id  LIKE '%" +
        searchItem +
        "%' OR  url  LIKE '%" +
        searchItem +
        "%'  LIMIT ?,?";
      let result1 = await mysqlcon(
        searchItem ? sql3 : merchantName ? sql2 : sql1,
        merchantName ? [merchantName, start, pagelimit] : [start, pagelimit]
      );
      res.status(201).json({
        message: `Showing ${result1.length} data from ${total}  `,
        currentPage: currentpage,
        totalPages: result1.length > 1 ? numOfPages : 0,
        pageLimit: pagelimit,
        data: result1,
      });
    } catch (error) {
      res.status(500).json({
        message: "Somthing went wrong",
        error: error,
      });
    }
  }
  
  async merchantLogs(req:Request<MerchantRequest>,res:Response):Promise<void> {
    try {
      const { searchItem, limit, merchantName, page } = req.body;
      let sql = "select count (*) as Total from tbl_merchants_log INNER JOIN tbl_user ON tbl_merchants_log.merchant_id = tbl_user.id";
      let sqlCount =
        "select count (*) as Total FROM tbl_merchants_log INNER JOIN tbl_user ON tbl_merchants_log.merchant_id = tbl_user.id WHERE tbl_merchants_log.id  LIKE '%" +
        searchItem +
        "%' OR  tbl_merchants_log.merchant_id  LIKE '%" +
        searchItem +
        "%' OR  tbl_merchants_log.url  LIKE '%" +
        searchItem +
        "%'";
      let sqlACount = `SELECT count (*) as Total FROM tbl_merchants_log where merchant_id=${merchantName}`;
      let result = await mysqlcon(
        searchItem ? sqlCount : merchantName ? sqlACount : sql
      );
      let total = result[0].Total;
      let currentpage = page ? Number(page) : 1;
      let pagelimit = limit ? Number(limit) : 10;
      let { start, numOfPages } = pagination(total, currentpage, pagelimit);

      let sql1 = `SELECT name,tbl_merchants_log.url ,tbl_merchants_log.updated_on,tbl_merchants_log.created_on,  TIMEDIFF(tbl_merchants_log.updated_on,tbl_merchants_log.created_on)as timeDeff FROM tbl_merchants_log INNER JOIN tbl_user ON tbl_merchants_log.merchant_id = tbl_user.id  LIMIT ?,?`;
      let sql2 =
        "SELECT name,tbl_merchants_log.url ,tbl_merchants_log.updated_on,tbl_merchants_log.created_on,  TIMEDIFF(tbl_merchants_log.updated_on,tbl_merchants_log.created_on)as timeDeff FROM tbl_merchants_log INNER JOIN tbl_user ON tbl_merchants_log.merchant_id = tbl_user.id where merchant_id= ? LIMIT ?,?";
      let sql3 =
        "SELECT name,tbl_merchants_log.url ,tbl_merchants_log.updated_on,tbl_merchants_log.created_on,  TIMEDIFF(tbl_merchants_log.updated_on,tbl_merchants_log.created_on)as timeDeff FROM tbl_merchants_log INNER JOIN tbl_user ON tbl_merchants_log.merchant_id = tbl_user.id WHERE tbl_merchants_log.id  LIKE '%" +
        searchItem +
        "%' OR  tbl_merchants_log.merchant_id  LIKE '%" +
        searchItem +
        "%' OR  tbl_merchants_log.url  LIKE '%" +
        searchItem +
        "%'  LIMIT ?,?";

      let result1 = await mysqlcon(
        searchItem ? sql3 : merchantName ? sql2 : sql1,
        merchantName ? [merchantName, start, pagelimit] : [start, pagelimit]
      );

      res.status(201).json({
        message: `Showing ${result1.length} data from ${total}  `,
        currentPage: currentpage,
        totalPages: result1.length > 1 ? numOfPages : 0,
        pageLimit: pagelimit,
        data: result1,
      });
    } catch (error) {
      res.status(500).json({
        message: "Somthing went wrong",
        error: error,
      });
    }
  }

  async walletLogs(req:Request<walletRequest>,res:Response):Promise<void> {
    try {
      const { searchItem, limit, merchantName, page,to,from } = req.body;
      
      let sql = "select count (*) as Total  from tbl_wallet_update_log INNER JOIN tbl_user ON tbl_wallet_update_log.merchant_id = tbl_user.id INNER JOIN tbl_login on tbl_wallet_update_log.login_admin = tbl_login.user_id";
      let sqlCount =
        "select count (*) as Total FROM tbl_wallet_update_log INNER JOIN tbl_user ON tbl_wallet_update_log.merchant_id = tbl_user.id INNER JOIN tbl_login on tbl_wallet_update_log.login_admin = tbl_login.user_id WHERE tbl_user.name  LIKE '%" +
        searchItem +
        "%' OR  tbl_wallet_update_log.current_wallet  LIKE '%" +
        searchItem +
        "%' OR  tbl_wallet_update_log.update_wallet_tot  LIKE '%" +
        searchItem +
        "%' OR  effective_amt  LIKE '%" +
        searchItem +
        "%' OR  order_id  LIKE '%" +
        searchItem +
        "%'  OR  tbl_wallet_update_log.created_on  LIKE '%" +
        searchItem +
        "%'";
      let sqlACount = `SELECT count (*) as Total FROM tbl_wallet_update_log where merchant_id=${merchantName}`;
      let sqlACount2 = `SELECT count (*) as Total FROM tbl_wallet_update_log wallet INNER JOIN tbl_user ON wallet.merchant_id = tbl_user.id INNER JOIN tbl_login on wallet.login_admin = tbl_login.user_id where(wallet.created_on >= '${to}' AND wallet.created_on <= '${from}')`;
      let result = await mysqlcon(
        searchItem ? sqlCount : merchantName ? sqlACount  : (to&&from)?sqlACount2: sql
      );
      let total = result[0].Total;
      let currentpage = page ? Number(page) : 1;
      let pagelimit = limit ? Number(limit) : 10;
      let { start, numOfPages } = pagination(total, currentpage, pagelimit);
      let sql1 = `SELECT name,tbl_wallet_update_log.current_wallet,tbl_wallet_update_log.update_wallet_tot,if(tbl_wallet_update_log.current_action=1,'ADD','SUB') as Action,effective_amt,order_id,CONCAT(tbl_login.firstname,tbl_login.lastname) as byAdmin,tbl_wallet_update_log.created_on from tbl_wallet_update_log INNER JOIN tbl_user ON tbl_wallet_update_log.merchant_id = tbl_user.id INNER JOIN tbl_login on tbl_wallet_update_log.login_admin = tbl_login.user_id LIMIT ?,?`;
      let sql2 ="SELECT name,tbl_wallet_update_log.current_wallet,tbl_wallet_update_log.update_wallet_tot,if(tbl_wallet_update_log.current_action=1,'ADD','SUB') as Action,effective_amt,order_id,CONCAT(tbl_login.firstname,tbl_login.lastname) as byAdmin,tbl_wallet_update_log.created_on from tbl_wallet_update_log INNER JOIN tbl_user ON tbl_wallet_update_log.merchant_id = tbl_user.id INNER JOIN tbl_login on tbl_wallet_update_log.login_admin = tbl_login.user_id where merchant_id= ? LIMIT ?,?";
      let sql3 ="SELECT name,tbl_wallet_update_log.current_wallet,tbl_wallet_update_log.update_wallet_tot,if(tbl_wallet_update_log.current_action=1,'ADD','SUB') as Action,effective_amt,order_id,CONCAT(tbl_login.firstname,tbl_login.lastname) as byAdmin,tbl_wallet_update_log.created_on from tbl_wallet_update_log INNER JOIN tbl_user ON tbl_wallet_update_log.merchant_id = tbl_user.id INNER JOIN tbl_login on tbl_wallet_update_log.login_admin = tbl_login.user_id WHERE tbl_user.name  LIKE '%" +
        searchItem +
        "%' OR  tbl_wallet_update_log.current_wallet  LIKE '%" +
        searchItem +
        "%' OR  tbl_wallet_update_log.update_wallet_tot  LIKE '%" +
        searchItem +
        "%' OR  effective_amt  LIKE '%" +
        searchItem +
        "%' OR  order_id  LIKE '%" +
        searchItem +
        "%'  OR  tbl_wallet_update_log.created_on  LIKE '%" +
        searchItem +
        "%'   LIMIT ?,?";

        let sql4 = `SELECT name,wallet.current_wallet,wallet.update_wallet_tot,if(wallet.current_action=1,'ADD','SUB') as Action,effective_amt,order_id,CONCAT(tbl_login.firstname,tbl_login.lastname) as byAdmin,wallet.created_on from tbl_wallet_update_log wallet INNER JOIN tbl_user ON wallet.merchant_id = tbl_user.id INNER JOIN tbl_login on wallet.login_admin = tbl_login.user_id where(wallet.created_on >= '${to}' AND wallet.created_on <= '${from}')LIMIT ?,?`;

      let result1 = await mysqlcon(
        searchItem ? sql3 : merchantName ? sql2 : (to&&from)?sql4: sql1,
        merchantName ? [merchantName, start, pagelimit] : [start, pagelimit]
      );

      res.status(200).json({
        message: `Showing ${result1.length} data from ${total}  `,
        currentPage: currentpage,
        totalPages: result1.length > 1 ? numOfPages : 0,
        pageLimit: pagelimit,
        data: result1,
      });
    } catch (error) {
      res.status(500).json({
        message: "Somthing went wrong",
        error: error,
      });
    }
  }

  async walletexport (req:Request<walletExportRequest>,res:Response):Promise<void>{
    try{
      const {id,from,to} = req.body

       if(id && from &&to){
        let sql = "SELECT name,wallet.current_wallet,wallet.update_wallet_tot,if(wallet.current_action = 1,'ADD','SUB') as Action,effective_amt,order_id,CONCAT(tbl_login.firstname,tbl_login.lastname) as byAdmin,wallet.created_on from tbl_wallet_update_log wallet INNER JOIN tbl_user ON wallet.merchant_id = tbl_user.id INNER JOIN tbl_login on wallet.login_admin = tbl_login.user_id WHERE merchant_id = ? AND DATE(wallet.created_on) >= ? AND DATE(wallet.created_on) <= ?";
        let result = await mysqlcon(sql,[id,from,to])
        if(result.length === 0) {
          res.send(result)
        } else {
          res.send(result)
        }
        } else if(id) {
          let sql = "SELECT name,wallet.current_wallet,wallet.update_wallet_tot,if(wallet.current_action=1,'ADD','SUB') as Action,effective_amt,order_id,CONCAT(tbl_login.firstname,tbl_login.lastname) as byAdmin,wallet.created_on from tbl_wallet_update_log wallet INNER JOIN tbl_user ON wallet.merchant_id = tbl_user.id INNER JOIN tbl_login on wallet.login_admin = tbl_login.user_id WHERE merchant_id = ?"
          let result = await mysqlcon(sql,[id])
  
          if(result.length === 0) {
          res.send(result)
          } else {
            res.send(result)
          }
        }else if(from&&to){
          let sql = "SELECT name,wallet.current_wallet,wallet.update_wallet_tot,if(wallet.current_action = 1,'ADD','SUB') as Action,effective_amt,order_id,CONCAT(tbl_login.firstname,tbl_login.lastname) as byAdmin,wallet.created_on from tbl_wallet_update_log wallet INNER JOIN tbl_user ON wallet.merchant_id = tbl_user.id INNER JOIN tbl_login on wallet.login_admin = tbl_login.user_id WHERE DATE(wallet.created_on) >= ? AND DATE(wallet.created_on) <= ?";
          let result = await mysqlcon(sql,[from,to])
          if(result.length === 0){
            res.send(result)
          } else {
            res.send(result)
        }
      } else {
        let sql = "SELECT name,wallet.current_wallet,wallet.update_wallet_tot,if(wallet.current_action = 1,'ADD','SUB') as Action,effective_amt,order_id,CONCAT(tbl_login.firstname,tbl_login.lastname) as byAdmin,wallet.created_on from tbl_wallet_update_log wallet INNER JOIN tbl_user ON wallet.merchant_id = tbl_user.id INNER JOIN tbl_login on wallet.login_admin = tbl_login.user_id";
        let result = await mysqlcon(sql)
  
        if(result.length === 0){
          res.send(result)
        } else {
          res.send(result)
      }
    }
      } catch(error){
        console.log(error)
         res.status(500).json({
          message : 'error'
        })
      }
  }

  async currencyRateLogs(req:Request,res:Response):Promise<void> {
    try {
      let sqlCurrencyRate = "SELECT user_id, created_on, rate_log FROM `tbl_rate_log`";
      let resultCurrencyRate = await mysqlcon (sqlCurrencyRate);
      res.status(200).json({
        data: resultCurrencyRate
      });
    }catch (error) {
      res.status(500).json({
        message: "Somthing went wrong",
        error: error,
      });
    }
  }

  async allowPaymentsLogs(req:Request<allowPaymentsReq>,res:Response):Promise<void> {
    try {
      const { firstname, limit, page } = req.body;
      let sql = "SELECT COUNT(*) as Total FROM payments_allow_log";
      let sqlACount = `SELECT count(*) as Total FROM payments_allow_log where source LIKE '%${firstname}%'`;
      let result = await mysqlcon(
       firstname ? sqlACount  : sql
      );
      let total = result[0].Total;
      let currentpage = page ? Number(page) : 1;
      let pagelimit = limit ? Number(limit) : 10;
      let { start, numOfPages } = pagination(total, currentpage, pagelimit);
      let sql1 = "SELECT source, logs, user_id, created_on FROM payments_allow_log LIMIT ?,?";
      let sql2 = `SELECT source, logs, user_id, created_on FROM payments_allow_log where source LIKE '%${firstname}%'`;
      let result1 = await mysqlcon(
      firstname ? sql2 : sql1,
        firstname ? [firstname, start, pagelimit] : [start, pagelimit]
      );
      let startRange = start + 1;
      let endRange = start + result1.length;
      res.status(200).json({
        message: result1.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
        totalPages: result1.length > 1 ? numOfPages : 0,
        pageLimit: pagelimit,
        data: result1,
      });
    } catch (error) {
      console.log(error)
      res.status(500).json({
        message: "Somthing went wrong",
        error: error,
      });
    }
  }

  async filterAdmin(req:Request,res:Response):Promise<void> {
    try {
      let sql = "SELECT user_id, firstname, lastname from tbl_login"
      let result = await mysqlcon(sql)
      res.status(200).json({
        result
      });
    } catch (error) {
      res.status(500).json({
        message: "Somthing went wrong",
        error: error,
      });
    }
  }
}

export default new ActivityLogs
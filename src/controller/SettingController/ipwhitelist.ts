import { Request, Response } from 'express';
import mysqlcon from '../../config/db_connection';


let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;


interface gatewayIpreq {

  user_id: number;
  ip: string;
  created_on: string,
  updated_on: string
}
// interface AuthenticatedRequest extends Request {
//   user: {
//     email: string;
//   };
// }
interface ToggleIpRequestBody {
  status: string; 
  id: number;
}
interface EditIpRequestBody {
  user_id: number;
  ip: string;
  id: number;
  updated_on: string // ID is required to find the record to update
}

interface ReadOneIpRequestBody {
  id: number;
}
interface DefaultIPWhitelistRequestBody {
  to?: string;
  from?: string;
  date?: string;
  page?: number;
  limit?: number;
}
class IpWhiteList {
  
  async  defaultIPWhitelist(req: Request, res: Response): Promise<void> {
    const pagination = (total: number, page: number, limit: number) => {
      const numOfPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      return { limit, start, numOfPages };
    };
  
    try {
      const { to, from, date, page = 1, limit = 10 }: DefaultIPWhitelistRequestBody = req.body;
      const pageNumber = Number(page);
      const limitNumber = Number(limit);
  
      const sqlCount =
        date
          ? "SELECT COUNT(*) AS Total FROM tbl_ip_whitelist WHERE DATE(created_on) = ?"
          : from && to
          ? "SELECT COUNT(*) AS Total FROM tbl_ip_whitelist WHERE DATE(created_on) >= ? AND DATE(created_on) <= ?"
          : "SELECT COUNT(*) AS Total FROM tbl_ip_whitelist";
  
      const countParams = date ? [date] : from && to ? [from, to] : [];
  
      const result = await mysqlcon(sqlCount, countParams);
      const total = result[0].Total;
      const { start, numOfPages } = pagination(total, pageNumber, limitNumber);
  
      const sqlData =
        date
          ? "SELECT tbl_user.name, tbl_ip_whitelist.*, DATE_FORMAT(tbl_ip_whitelist.created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_ip_whitelist.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_ip_whitelist LEFT JOIN tbl_user ON tbl_ip_whitelist.user_id = tbl_user.id WHERE DATE(tbl_ip_whitelist.created_on) = ? ORDER BY tbl_ip_whitelist.created_on DESC LIMIT ?, ?"
          : from && to
          ? "SELECT tbl_user.name, tbl_ip_whitelist.*, DATE_FORMAT(tbl_ip_whitelist.created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_ip_whitelist.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_ip_whitelist LEFT JOIN tbl_user ON tbl_ip_whitelist.user_id = tbl_user.id WHERE DATE(tbl_ip_whitelist.created_on) >= ? AND DATE(tbl_ip_whitelist.created_on) <= ? ORDER BY tbl_ip_whitelist.created_on DESC LIMIT ?, ?"
          : "SELECT tbl_user.name, tbl_ip_whitelist.*, DATE_FORMAT(tbl_ip_whitelist.created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_ip_whitelist.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_ip_whitelist LEFT JOIN tbl_user ON tbl_ip_whitelist.user_id = tbl_user.id ORDER BY tbl_ip_whitelist.created_on DESC LIMIT ?, ?";
  
      const dataParams = date
        ? [date, start, limitNumber]
        : from && to
        ? [from, to, start, limitNumber]
        : [start, limitNumber];
  
      const result1 = await mysqlcon(sqlData, dataParams);
      const startRange = start + 1;
      const endRange = start + result1.length;
  
      if (result1.length === 0) {
        res.status(201).json({
          message: "Showing 0 from 0 data",
          currentPage: pageNumber,
          totalPages: numOfPages,
          pageLimit: limitNumber,
          data: result1,
        });
      } else {
        res.status(200).json({
          message: `Showing ${startRange} to ${endRange} data from ${total}`,
          currentPage: pageNumber,
          totalPages: numOfPages,
          pageLimit: limitNumber,
          data: result1,
        });
      }
    } catch (error) {
      console.error("Error in defaultIPWhitelist:", error);
      res.status(500).json({
        message: "Error occurred",
        error,
      });
    }
  }
  async createipwhitelist(req: Request, res: Response): Promise<void> {
    try {


      let { user_id, ip }: gatewayIpreq = req.body;
      if (!user_id || !ip) {
        res.status(400).json({
          message: "user_id and ip are required",
        });
        return;
      }


      let details = {
        user_id,
        ip,
        created_on: dateTime,
        updated_on: dateTime
      };

      let sql = "INSERT INTO tbl_ip_whitelist SET ?";

      let result = await mysqlcon(sql, [details]);

      if (result && result.affectedRows > 0) {
        res.json({
          message: "Data Inserted Successfully✅",
          data: details
        });
      } else {
        res.json({
          message: "Error While Creating",
        });
      }
    } catch (error) {
      console.log(error)
      res.json({
        message: "error occurered",
        error: error,
      })
    }









  }

  async allGateway(req: Request, res: Response): Promise<void> {
    try {
      const auth = req.user.email; 

      const sql = "SELECT id, gateway_name FROM payment_gateway";
      const result = await mysqlcon(sql);

      res.status(200).json({
        data: result,
        auth,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: "Server Error",
        error: err,
      });
    }
  }

  async toggleIP(req: Request, res: Response): Promise<void> {
    try {
      const { status, id }:ToggleIpRequestBody = req.body;

      const sql = "UPDATE tbl_ip_whitelist SET status = ? WHERE id = ?";
      const result = await mysqlcon(sql, [status, id]);

      if (result.affectedRows > 0) {
        res.status(200).json({
          message: `Status ${status === "1" ? "Enabled" : "Disabled"} Successfully`,
          data: result,
          
        });
      } else {
        res.status(201).json({
          message: "Error while Changing Status",
          data: result,
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "Error occurred",
        error,
      });
    }
  }
  async editIP(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, ip, id }:EditIpRequestBody = req.body;

      if (!id) {
         res.status(400).json({
          message: "Kindly Provide Id",
        });
      }

      const details = {
        user_id,
        ip,
        updated_on:dateTime 
      };

      const sql = "UPDATE tbl_ip_whitelist SET ? WHERE id = ?";
      const result = await mysqlcon(sql, [details, id]);

      if (result.affectedRows > 0) {
         res.status(200).json({
          message: "Data Updated ✅",
          data:details
        });
      } else {
         res.status(201).json({
          message: "Error while updating",
        });
      }
    } catch (error) {
       res.status(500).json({
        message: "Error occurred",
        error,
      });
    }
  }
  
  async readOneIP(req: Request, res: Response): Promise<void> {
    try {
      let { id }:ReadOneIpRequestBody = req.body;

      if (!id) {
         res.status(400).json({
          message: "ID is required",
        });
      }

      const sql = "SELECT * FROM tbl_ip_whitelist WHERE id = ?";
      const result = await mysqlcon(sql, [id]);

      if (result.length > 0) {
        res.status(200).json(result[0]); 
      } else {
        res.status(404).json({
          message: "Record not found",
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
export default new IpWhiteList();
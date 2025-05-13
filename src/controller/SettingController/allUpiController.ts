import { Request, Response } from 'express';
import mysqlcon from '../../config/db_connection';

let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;

interface UpiRequestBody {
  searchItem?: string;
  page?: number;
  limit?: number;
  id: number;
  merchant_id: number;
  upi_id: string;
  create_on: string;
  update_on: string;
}

interface UpiData {
  id: string;               // Merchant ID
  upi_id: string;           // Full UPI ID
  reason: string;           // Reason for blocking
  create_on: string;       // Timestamp when created
  update_on: string;        // Timestamp when updated
  upi_no?: string;  
  merchant_id?: string;        // Derived UPI number (optional before insert)
}


interface ToggleUpiRequestBody {
  status: string; // "1" for unblock, "0" for block
  id: string;
}
interface ReadUpiRequestBody {
  id: string;
}
interface UpdateUpiRequestBody {
  id: string;
  upi_id: string;
  reason: string;
  update_on: string;
}
interface deleteapi {
  id: string;
}

const pagination = (total: number, page: number, limit: number) => {
  const numOfPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { start, numOfPages };
};

class allUpi {
  async defaultAllUpi(req: Request, res: Response): Promise<void>{
    try {
      const { searchItem = '', page = 1, limit = 10 }: UpiRequestBody = req.body;
  
      const parsedPage = Number(page);
      const parsedLimit = Number(limit);
  
      // Detect numeric input
      const isMerchantIdSearch = /^\d+$/.test(searchItem.trim());
  
      const baseCountSql = `SELECT COUNT(*) AS Total FROM tbl_upi_block`;
      const baseDataSql = `
        SELECT *,
          DATE_FORMAT(create_on,'%Y-%m-%d %H:%i:%s') AS create_on,
          DATE_FORMAT(update_on,'%Y-%m-%d %H:%i:%s') AS update_on
        FROM tbl_upi_block`;
  
      let countSql = baseCountSql;
      let dataSql = baseDataSql;
      const countParams: any[] = [];
      const dataParams: any[] = [];
  
      if (searchItem.trim() !== '') {
        if (isMerchantIdSearch) {
          countSql += ` WHERE merchant_id = ?`;
          dataSql += ` WHERE merchant_id = ?`;
          countParams.push(Number(searchItem));
          dataParams.push(Number(searchItem));
        } else {
          countSql += ` WHERE upi_id LIKE ?`;
          dataSql += ` WHERE upi_id LIKE ?`;
          countParams.push(`%${searchItem}%`);
          dataParams.push(`%${searchItem}%`);
        }
      }
  
      dataSql += ` ORDER BY create_on DESC LIMIT ?, ?`;
  
      // Get count and pagination info
      const countResult: any[] = await mysqlcon(countSql, countParams);
      const total: number = countResult[0].Total;
  
      const { start: finalStart, numOfPages: finalNumOfPages } = pagination(total, parsedPage, parsedLimit);
  
      // Add LIMIT params
      dataParams.push(finalStart, parsedLimit);
  
      // Fetch results
      const result: UpiData[] = await mysqlcon(dataSql, dataParams);
  
      const startRange = finalStart + 1;
      const endRange = finalStart + result.length;
  
      res.status(200).json({
        message: result.length > 0
          ? `Showing ${startRange} to ${endRange} data from ${total}`
          : 'NO DATA',
        currentPage: parsedPage,
        totalPages: finalNumOfPages,
        pageLimit: parsedLimit,
        data: result
      });
    } catch (error) {
      console.error('Error in defaultAllUpi:', error);
      res.status(500).json({ message: 'Error occurred', error });
    }
  }
  

  async createAllUpi  (req: Request, res: Response): Promise<void>  {
    try {
      const { id, upi_id, reason }: UpiData = req.body;
    
      const upi_no = upi_id.slice(0, -4);
      console.log("upi_no", upi_no);
    
      const details = {
        merchant_id: id,
        upi_id,
        upi_no,
        reason,
        create_on: dateTime,
        update_on: dateTime
      };
    
      const sql = "INSERT INTO tbl_upi_block SET ?";
      const result: any = await mysqlcon(sql, [details]);
    
      // After insertion, the insertId will be available
      if (result && result.insertId) {
        // Attach the insertId to the details object to send back the inserted data
        details.merchant_id = result.insertId;
        
        res.status(200).json({
          message: "Data Inserted Successfully ✅",
          data: details  // Return the inserted data with the insertId
        });
      } else {
        res.status(500).json({ message: "Error While Creating ❌" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "An error occurred",
        error,
      });
    }
  }
  
  
  async  toggleUpi  (req: Request, res: Response): Promise<void>  {
    try {
      const { status, id }: ToggleUpiRequestBody = req.body;
  
      const sql = "UPDATE tbl_upi_block SET status = ? WHERE id = ?";
      const result: any = await mysqlcon(sql, [status, id]);
  
      if (result.affectedRows > 0) {
        res.status(200).json({
          message: `Status ${status === "1" ? "Unblock" : "Block"} Successfully`,
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
  };
   async readUpi  (req: Request, res: Response): Promise<void> {
    try {
      const { id }: ReadUpiRequestBody = req.body;
  
      const sql = "SELECT * FROM tbl_upi_block WHERE id = ?";
      const result: any = await mysqlcon(sql, [id]);
  
      res.status(200).json({
        data: result
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error occurred',
        error
      });
    }
  };
  async  updateUpi (req: Request, res: Response): Promise<void> {
    try {
      const { id, upi_id, reason }: UpdateUpiRequestBody = req.body;
      console.log(req.body);
  
      const sqlId = "SELECT id, name FROM tbl_user";
      const resultId = await mysqlcon(sqlId);
  
      const details = {
        upi_id,
        reason,
        update_on:dateTime   // You can format it if you prefer IST-style
      };
  
      const sql = "UPDATE tbl_upi_block SET ? WHERE id = ?";
      const result: any = await mysqlcon(sql, [details, id]);
  
      if (result.affectedRows > 0) {
        res.status(200).json({
          message: "Data Updated Successfully ✅",
          mId: resultId
        });
      } else {
        res.status(201).json({
          message: "Error while Changing",
          data: result
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "Error occurred",
        error
      });
    }
  };
  async deleteApi (req: Request, res: Response): Promise<void> {
 
  
    try {
      
      const { id }: deleteapi = req.body;
  
      const sql = "DELETE FROM tbl_upi_block WHERE id = ?"
      const result = await mysqlcon(sql, [id])
      res.status(200).json({
        message: "row deleted Successfully ",
        data: result
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error occurred',
        error
      });
    }
  }
}

export default new allUpi
































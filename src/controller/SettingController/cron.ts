import { Request, Response } from 'express';
import mysqlcon from '../../config/db_connection';


let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;

interface CronRequestData {
  searchItem?: string;
  page?: number;
  limit?: number;
  id?: number;
  type?: string;
  gateway_name?: string;
  cron_status?: number;
  manual_callback?: number;
  additional_charges?: number;
  cron_id?: number;
}
interface ReadOneCronRequestBody {
  id: number;
}

interface ToggleCronRequest {
  cron_status: string;
  id: number;
}
interface ToggleSwitchRequest {
  cron_status: string;
  cron_id: number;
}
interface toggleONRequest{
  manual_callback:string;
  id:number;
}
interface UpdateAdditionalRequestBody {
  additional_charges: number;
  id: number;
  updated_on: string;
}
interface SetLimitRequest{
  body: {
    gateway: string;
    currency: string;
    min: number;
    max: number;
  };
}

interface AuthenticatedRequest extends Request {
  body: SetLimitRequest;
  user?: any; // You can define proper user type here if available
}



class CronController {
  async defaultCron(req: Request, res: Response): Promise<void> {
    const paginate = (total: number, page: number, limit: number) => {
      const numOfPages = Math.ceil(total / limit);
      const start = page * limit - limit;
      return { limit, start, numOfPages };
    };

    try {
      const { searchItem = '', page = 1, limit = 10 }: CronRequestData = req.body;
      const currentPage = Number(page);
      const pageLimit = Number(limit);

      const baseCountQuery = `SELECT COUNT(*) AS Total FROM payment_gateway`;
      // const searchCountQuery = `SELECT COUNT(*) AS Total FROM payment_gateway WHERE page_title LIKE ?`;

      const countParams = [`%${searchItem}%`];
      const countResult = await mysqlcon(
        // searchItem ? searchCountQuery : 
         baseCountQuery,
        searchItem ? countParams : []
      );

      const total: number = countResult[0].Total;
      const { start, numOfPages } = paginate(total, currentPage, pageLimit);

      const baseDataQuery = `
        SELECT id, type, gateway_name, cron_status, manual_callback, additional_charges 
        FROM payment_gateway 
        LIMIT ?, ?
      `;
      // const searchDataQuery = `
      //   SELECT id, type, gateway_name, cron_status, manual_callback, additional_charges 
      //   FROM payment_gateway 
      //   WHERE page_title LIKE ? 
      //   LIMIT ?, ?
      // `;

      const dataParams = [`%${searchItem}%`, start, pageLimit];
      const resultData: CronRequestData[] = await mysqlcon(
        // searchItem ? searchDataQuery : 
       baseDataQuery,
        searchItem ? dataParams : [start, pageLimit]
      );

      const cronSql = `SELECT cron_id, cron_status FROM tbl_cron_status`;
      const cronStatus: CronRequestData[] = await mysqlcon(cronSql);

      const startRange = start + 1;
      const endRange = start + resultData.length;

      res.status(200).json({
        message: `Showing ${startRange} to ${endRange} data from ${total}`,
        currentPage,
        totalPages: numOfPages,
        pageLimit,
        data: resultData,
        cronStatus,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error occurred",
        error,
      });
    }
  }
// Toggle Button

async toggleCron  (req: Request, res: Response): Promise<void> {
    try {
      const { cron_status, id }: ToggleCronRequest = req.body;
  
      const sql = "UPDATE payment_gateway SET cron_status = ? WHERE id = ?";
      const result = await mysqlcon(sql, [cron_status, id]);
  
      if (result.affectedRows > 0) {
        res.status(200).json({
          message: `Status ${cron_status === "1" ? "Enabled" : "Disabled"} Successfully`,
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
// Toggle Switch Button
async toggleSwitch  (req: Request, res: Response): Promise<void> {
    try {
      const { cron_status, cron_id }: ToggleSwitchRequest = req.body;
  
      const sql = "UPDATE tbl_cron_status SET cron_status = ? WHERE cron_id = ?";
      const result: any = await mysqlcon(sql, [cron_status, cron_id]);
  
      if (result.affectedRows > 0) {
        res.status(200).json({
          message: `Status ${cron_status === "1" ? "Enabled" : "Disabled"} Successfully`,
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
//Togele ON/OFF Button
async toggleON  (req: Request, res: Response): Promise<void> {
    try {
      const { manual_callback, id }: toggleONRequest = req.body;
  
      const sql = "UPDATE payment_gateway SET manual_callback = ? WHERE id = ?";
      const result: any = await mysqlcon(sql, [manual_callback, id]);
  
      if (result.affectedRows > 0) {
        res.status(200).json({
          message: `Status ${manual_callback === "1" ? "Enabled" : "Disabled"} Successfully`,
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
// Update Additional Charges
async  updateAdditional  (req: Request, res: Response): Promise<void> {
  try {
    const { additional_charges, id }:UpdateAdditionalRequestBody = req.body;

    const details = {
      additional_charges,
      updated_on: dateTime,
    };

    if (id) {
      const sql = "UPDATE payment_gateway SET ? WHERE id = ?";
      const result: any = await mysqlcon(sql, [details, id]);

      if (result.affectedRows > 0) {
         res.status(200).json({
          message: "Additional Charges Updated ✅",
          data:details
        });
      } else {
       res.status(201).json({
          message: "Error while updating",
        });
      }
    } else {
     res.status(205).json({
        message: "Kindly Provide Id",
      });
    }
  } catch (error) {
     res.status(500).json({
      message: "error occurred",
      error,
    });
  }
}

async readOneCron (req: Request, res: Response): Promise<void> {
   try {
      let { id }:ReadOneCronRequestBody = req.body;

      let sql = "SELECT * FROM payment_gateway WHERE id = ?";
      let result = await mysqlcon(sql, [id]);
      if(result.length > 0) {
          res.json(result[0]);
      }
    } catch (error) {
       res.json({
        message: "Error occurred",
       })
    }
}

async SetLimit_SetLimitmodule  ( req: Request, res: Response): Promise<void> {
  try {
    const { user_id } = req.user!;
    const { gateway, currency, min, max } = req.body;

    const edit = { gateway, currency, min, max };

    const sqlMerchant = "SELECT id, name FROM tbl_user WHERE account_type = 1";
    const sqlGateway = "SELECT id, gateway_name FROM payment_gateway";
    const sqlCurrency = "SELECT currency_code FROM tbl_currency";

    const Merchantresult = await mysqlcon(sqlMerchant);
    const Gatewayresult = await mysqlcon(sqlGateway);
    const Currencyresult = await mysqlcon(sqlCurrency);

    if (user_id) {
      const sql = "INSERT INTO tbl_set_limit SET ?";
      const result: any = await mysqlcon(sql, [edit]);

      if (result) {
        res.status(200).json({
          message: "Data Inserted Successfully ✅",
          status: true,
          data: {
            Merchant: Merchantresult,
            Gateway: Gatewayresult,
            Currency: Currencyresult,
          },
        });
      } else {
        res.status(201).json({
          message: "Data not Inserted ❌",
        });
      }
    } else {
      res.status(205).json({
        message: "Kindly Provide gateway",
        data: {
          Merchant: Merchantresult,
          Gateway: Gatewayresult,
          Currency: Currencyresult,
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "error occurred",
      error,
    });
  }
};


}
export default new CronController();

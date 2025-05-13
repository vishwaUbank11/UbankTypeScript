import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';
import Pagination from '../services/pagination';

interface PaymentGateway {
  id: number;
  gateway_name: string;
  merNo: string;
  created_on: string;
  updated_on: string;
  [key: string]: any;
}

interface CountResult {
  Total: number;
}

interface getidResponse{
    id? : string
}


interface EditResponse {
  message?: string;
  data?: any;
  error?: any;
}

interface deleteResponse{
  id? : string
}

interface CreateResponse {
  message?: string;
  error?: any;
}

interface toggleResponse {
  status?: string;
  id?: string;
  message: string;
  error?: any;
}

class Payment {

  async paymentGateway(req: Request, res: Response): Promise<void> {
    try {
      const { to, from, date, searchVal, pageNumber, limit } = req.body;

      let sqlAllCount = "SELECT COUNT(*) AS Total FROM payment_gateway";
      let sqlCountDate = "SELECT COUNT(*) AS Total FROM payment_gateway WHERE DATE(created_on) = ?";
      let sqlToFromCount = "SELECT COUNT(*) AS Total FROM payment_gateway WHERE DATE(created_on) >= ? AND DATE(created_on) <= ?";
      let sqlSearchCount = `SELECT COUNT(*) AS Total FROM payment_gateway WHERE ((gateway_name LIKE '%${searchVal}%' OR merNo LIKE '%${searchVal}%'))`;

      const countQuery = date
        ? sqlCountDate
        : to && from
        ? sqlToFromCount
        : searchVal
        ? sqlSearchCount
        : sqlAllCount;

      const countParams = date ? [date] : to && from ? [from, to] : [];

      const result = await mysqlcon(countQuery, countParams) as CountResult[];
      const total = result[0].Total;
      const page = pageNumber ? Number(pageNumber) : 1;
      const pageLimit = limit ? Number(limit) : 10;
      const { start, numOfPages } = Pagination.pagination(total, page, pageLimit);

      let sql =
        `SELECT payment_gateway.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
         FROM payment_gateway ORDER BY created_on DESC LIMIT ?, ?`;

      let sqlDate =
        `SELECT payment_gateway.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
         FROM payment_gateway WHERE DATE(created_on) = ? ORDER BY created_on DESC LIMIT ?, ?`;

      let sqlToFrom =
        `SELECT payment_gateway.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
         FROM payment_gateway WHERE DATE(created_on) >= ? AND DATE(created_on) <= ? ORDER BY created_on DESC LIMIT ?, ?`;

      let sqlSearch =
        `SELECT payment_gateway.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on 
         FROM payment_gateway WHERE ((gateway_name LIKE '%${searchVal}%' OR merNo LIKE '%${searchVal}%')) ORDER BY created_on DESC LIMIT ?, ?`;

      const dataQuery = date
        ? sqlDate
        : to && from
        ? sqlToFrom
        : searchVal
        ? sqlSearch
        : sql;

      const dataParams = date
        ? [date, start, pageLimit]
        : to && from
        ? [from, to, start, pageLimit]
        : [start, pageLimit];

      const data = await mysqlcon(dataQuery, dataParams) as PaymentGateway[];

      const startRange = start + 1;
      const endRange = start + data.length;

      res.status(200).json({
        message: data.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
        numOfPages,
        result: data,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  }

  async getId(req:Request<getidResponse>,res:Response):Promise<void>{
      try {
        let { id } = req.body;
    
        let sql = "SELECT * FROM payment_gateway WHERE id = ?";
    
        let result = await mysqlcon(sql, [id]);
    
        if (result.length > 0) {
           res.status(200).json({
            message: `Take data for id = ${id}`,
            data: result[0],
          });
        } else {
           res.status(201).json({
            message: "No Record Found",
            data: result,
          });
        }
      } catch (error) {
         res.status(500).json({
          message: "error occurered",
          error: error,
        });
      }
  }

  async create(req: Request, res: Response<CreateResponse>):Promise<void>{
    try {
      const currentUTC = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; 
      const istTime = new Date(currentUTC.getTime() + istOffset);
      const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');

      let { type, gateway_name, merchantN, key } = req.body;

      let details = {
        type: type,
        gateway_name: gateway_name,
        merNo: merchantN,
        key: key,
        created_on: formattedIST,
        updated_on: formattedIST
      };

      let sql = "INSERT INTO payment_gateway SET ?";
      let result = await mysqlcon(sql, [details]);

      let gatewayID = "SELECT id FROM payment_gateway ORDER BY id DESC LIMIT 1"
      let resultgate = await mysqlcon(gatewayID)

      let update = `UPDATE payment_gateway SET gateway_number = ${resultgate[0].id} WHERE id = ${resultgate[0].id}`;
      await mysqlcon(update)
      if (result.affectedRows > 0) {
         res.status(200).json({
          message: type === "0" ? "Payin Gateway Created": "Payout Gateway Created",

        });
      } else {
         res.status(201).json({
          message: "Error While Creating",
        });
      }
    } catch (error) {
      console.log(error);
       res.status(500).json({
        message: "error occurered",
        error: error,
      });
    }
  }

  async edit(req: Request, res: Response<EditResponse>):Promise<void>{
      try {
        const currentUTC = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; 
        const istTime = new Date(currentUTC.getTime() + istOffset);
        const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');
        
        let { type, gateway_name, merchantN, key, id } = req.body;
    
        let details = {
          type: type,
          gateway_name: gateway_name,
          merNo: merchantN,
          key: key,
          updated_on: formattedIST
        };
    
        let sql = "UPDATE payment_gateway SET ? WHERE id = ?";
    
        let result = await mysqlcon(sql, [details, id]);
    
        if (result.affectedRows > 0) {
           res.status(200).json({
            message: "Gateway Updated",
          });
        } else {
           res.status(201).json({
            message: "Error while updating"
          });
        }
      } catch (error) {
        console.log(error)
         res.status(500).json({
          message: "error occurered",
          error: error,
        });
      }
  }

  async delete(req:Request<deleteResponse>,res:Response):Promise<void>{
    try {
      let { id } = req.body;

      let sql = "DELETE FROM payment_gateway WHERE id = ?";
      let result = await mysqlcon(sql, [id]);

      if (result.affectedRows > 0) {
         res.status(200).json({
          message: "Gateway Deleted"
        });
      } else {
         res.status(201).json({
          message: "Error while Deleting",
        });
      }
    } catch (error) {
       res.status(500).json({
        message: "error occurered",
        error: error,
      });
    }
  }

  async togglePayment(req: Request, res: Response<toggleResponse>):Promise<void>{

      try {
        let { status, id } = req.body;
    
        let sql = "UPDATE payment_gateway SET status = ? WHERE id = ?";
        let result = await mysqlcon(sql, [status, id]);
    
        if (result.affectedRows > 0) {
           res.status(200).json({
            message: `Status ${
              status === "1" ? "Enabled" : "Disabled"
            } Successfully `,
          
          });
        } else {
           res.status(201).json({
            message: "Error while Changing Status",
          });
        }
      } catch (error) {
         res.status(500).json({
          message: "error occurered",
          error: error,
        });
      }
  }

}

export default new Payment();


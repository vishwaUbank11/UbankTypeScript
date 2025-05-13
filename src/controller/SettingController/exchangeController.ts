import { Request, Response } from 'express';
import mysqlcon from '../../config/db_connection';

let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;



interface Pagination {
  limit: number;
  start: number;
  numOfPages: number;
}

interface UpdateExchangeRequest {
  exchange_title: string;
  rate: string;
  id: number;
}
interface readonceEx{
  id:number;
}
interface DeleteExchangeRequest {
  id: number;
}
interface CreateExchangeRequest {
  exchange_title: string;
  rate: string;
}

class ExchangeController{
async defaultExchange(req: Request, res: Response):  Promise<void> {
  // 👇 Pagination 👇
  const pagination = (total: number, page: number, limit: number): Pagination => {
    const numOfPages = Math.ceil(total / limit);
    const start = page * limit - limit;
    return { limit, start, numOfPages };
  };

  try {
    const searchItem: string = req.body.searchItem || '';
    const page: number = req.body.page ? Number(req.body.page) : 1;
    const limit: number = req.body.limit ? Number(req.body.limit) : 10;

    const sql = "SELECT COUNT(*) AS Total FROM tbl_settlement_exchange_rate";
    const sqlCount = `
      SELECT COUNT(*) AS Total 
      FROM tbl_settlement_exchange_rate 
      WHERE rate LIKE '%${searchItem}%' 
      OR exchange_title LIKE '%${searchItem}%' 
      OR created_on LIKE '%${searchItem}%'
    `;

    const countResult = await mysqlcon(searchItem ? sqlCount : sql);
    const total: number = countResult[0].Total;

    const { start, numOfPages } = pagination(total, page, limit);

    const sql1 = `
      SELECT * FROM tbl_settlement_exchange_rate 
      ORDER BY created_on DESC 
      LIMIT ?, ?
    `;

    const sql2 = `
      SELECT * FROM tbl_settlement_exchange_rate 
      WHERE rate LIKE '%${searchItem}%' 
      OR exchange_title LIKE '%${searchItem}%' 
      OR created_on LIKE '%${searchItem}%' 
      ORDER BY created_on DESC 
      LIMIT ?, ?
    `;

    const result = await mysqlcon(searchItem ? sql2 : sql1, [start, limit]);

    // 👇 Format each row's created_on 👇
    const formattedResult = result.map((row: any) => {
      const today = new Date(row.created_on);
      const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      const time = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
      return {
        ...row,
        created_on: `${date} ${time}`,
      };
    });

    const startRange = start + 1;
    const endRange = start + result.length;

     res.status(200).json({
      message: result.length > 0
        ? `Showing ${startRange} to ${endRange} data from ${total}`
        : "NO DATA",
      currentPage: page,
      totalPages: numOfPages,
      pageLimit: limit,
      data: formattedResult,
    });
  } catch (error) {
     res.status(500).json({
      message: "An error occurred",
      error,
    });
  }
}
async updateExchange(req: Request, res: Response): Promise<void> {
  try {
    const { exchange_title, rate, id } = req.body;

    if (!id) {
      res.status(400).json({
        message: 'Kindly provide ID',
      });
      return;
    }

    const details = {
      exchange_title,
      rate,
    };

    const sql = 'UPDATE tbl_settlement_exchange_rate SET ? WHERE id = ?';
    const result = await mysqlcon(sql, [details, id]);

    if (result && result.affectedRows > 0) {
      res.status(200).json({
        message: 'Row Updated ✅',
        data:details
      });
    } else {
      res.status(404).json({
        message: 'No row updated or row not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred',
      error,
    });
  }
}
async readonceExchange(req: Request, res: Response): Promise<void> {
  try {
    const { id }: readonceEx = req.body;

    const sql = `
      SELECT * FROM tbl_settlement_exchange_rate 
      WHERE id = ?
    `;

    const result = await mysqlcon(sql, [id]);

    if (result.length > 0) {
      res.status(200).json({
        message: 'Data fetched successfully ✅',
        data: result,
      });
    } else {
      res.status(404).json({
        message: 'No row found with the provided ID',
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred',
      error,
    });
  }

}
async deleteExchange(req: Request, res: Response): Promise<void> {
  try {
    const { id }:DeleteExchangeRequest= req.body;

    if (!id) {
      res.status(400).json({
        message: 'Kindly provide ID',
      });
      return;
    }

    const sql = 'DELETE FROM tbl_settlement_exchange_rate WHERE id = ?';
    const result = await mysqlcon(sql, [id]);

    if (result && result.affectedRows > 0) {
      res.status(200).json({
        message: 'Deleted Successfully ✅',
      });
    } else {
      res.status(404).json({
        message: 'No record found to delete',
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred',
      error,
    });
  }
}
async createExchange(req: Request, res: Response): Promise<void> {
  try {
    const { exchange_title, rate }:CreateExchangeRequest = req.body;

    if (!exchange_title || !rate) {
      res.status(400).json({
        message: 'Please provide both exchange_title and rate',
      });
      return;
    }

    const details = { exchange_title, rate };
    const sql = 'INSERT INTO tbl_settlement_exchange_rate SET ?';

    const result = await mysqlcon(sql, [details]);

    if (result && result.affectedRows > 0) {
      res.status(200).json({
        message: 'Data Inserted Successfully ✅',
        data: details
      });
    } else {
      res.status(500).json({
        message: 'Error While Creating',
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred',
      error,
    });
  }
}
}
export default new ExchangeController();
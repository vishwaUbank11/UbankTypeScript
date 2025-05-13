import { Request, Response } from "express";
import mysqlcon from '../../config/db_connection';
let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;

const pagination = (total: number, page: number, limit: number): { limit: number, start: number, numOfPages: number } => {
    const numOfPages = Math.ceil(total / limit);
    const start = page * limit - limit;
    return { limit, start, numOfPages };
  };
  
  

interface DefaultSwapResponse {
    message: string;
    currentPage: number;
    totalPages: number;
    pageLimit: number;
    data: {
      name: string;
      title: string;
      primaryGateway: string;
      switchGateway: string;
      merchant_bank_swap: any;  
      creation_date: string;
      modification_date: string;
    }[];
  }
  interface ToggleSwapRequestBody {
    id: number;
    status: string;
  }
  interface CreateMerchantSwapRequestBody {
    merchant_id: number;
    bankcode: string;
    primary_gateway: number;
    switch_gateway: number;
    modification_date:string;
    creation_date:string;
  }
  interface UpdateMerchantSwapGatewayRequestBody {
    id: number;
    merchant_id: number;
    bankcode: string;
    primary_gateway: number;
    switch_gateway: number;
    modification_date:string
  }
  interface GetSwapDetailsRequestBody {
    id: number;
  }


  class DefaultSwap{

  async  fetchdefaultSwap  (req: Request, res: Response): Promise<void> {
        try {
          const sql1 = "SELECT count(*) AS Total FROM merchant_bank_swap";
          const result1: any[] = await mysqlcon(sql1);
          const total: number = result1[0].Total;
      
          const page: number = req.body.page ? Number(req.body.page) : 1;
          const limit: number = req.body.limit ? Number(req.body.limit) : 10;
          const { start, numOfPages } = pagination(total, page, limit);
      
          const sql = `SELECT 
                          tbl_user.name, 
                          tbl_akonto_banks_code.title, 
                          primary_gateway.gateway_name AS primaryGateway, 
                          switch_gateway.gateway_name AS switchGateway, 
                          merchant_bank_swap.*, 
                          DATE_FORMAT(merchant_bank_swap.creation_date, '%Y-%m-%d %H:%i:%s') AS creation_date, 
                          DATE_FORMAT(merchant_bank_swap.modification_date, '%Y-%m-%d %H:%i:%s') AS modification_date 
                       FROM merchant_bank_swap 
                       LEFT JOIN payment_gateway AS primary_gateway ON primary_gateway.id = merchant_bank_swap.primary_gateway 
                       LEFT JOIN payment_gateway AS switch_gateway ON switch_gateway.id = merchant_bank_swap.switch_gateway 
                       LEFT JOIN tbl_akonto_banks_code ON tbl_akonto_banks_code.code = merchant_bank_swap.bankcode 
                       LEFT JOIN tbl_user ON tbl_user.id = merchant_bank_swap.merchant_id 
                       LIMIT ?, ?`;
      
          const result = await mysqlcon(sql, [start, limit]);
          const startRange = start + 1;
          const endRange = start + result.length;
      
          const response: DefaultSwapResponse = {
            message: result.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
            currentPage: page,
            totalPages: numOfPages,
            pageLimit: limit,
            data: result.map((item: any) => ({
              name: item.name,
              title: item.title,
              primaryGateway: item.primaryGateway,
              switchGateway: item.switchGateway,
              merchant_bank_swap: item,
              creation_date: dateTime,
              modification_date: dateTime
            }))
          };
      
           res.status(200).json(response);
      
        } catch (err) {
           res.status(500).json({
            message: "Error occurred",
            error: err instanceof Error ? err.message : err, // Ensure proper error handling
          });
        }



  }

  async toggleSwap(req: Request, res: Response): Promise<void> {
    try {
      const { id, status }:ToggleSwapRequestBody = req.body;

     
      if (status !== '0' && status !== '1') {
         res.status(400).json({
          message: 'Invalid status value. Status should be "0" (blocked) or "1" (unblocked).'
        });
      }

      const sql = "UPDATE merchant_bank_swap SET status=? WHERE id=?";
      const result = await mysqlcon(sql, [status, id]);

      res.status(200).json({
        result: status === '0' ? 'Gateway Blocked Successfully' : 'Gateway Unblocked Successfully'
      });
    } catch (err) {
      res.status(500).json({
        message: 'Error occurred while toggling the gateway status',
        error: err instanceof Error ? err.message : err,
      });
    }
  }


  async createMerchantSwap(req: Request, res: Response): Promise<void> {
    try {
      const { merchant_id, bankcode, primary_gateway, switch_gateway }:CreateMerchantSwapRequestBody = req.body;


      const details = {
        merchant_id,
        bankcode,
        primary_gateway,
        switch_gateway,
        status: 0,
        creation_date: dateTime,
        modification_date: dateTime
      };

      const sqlDefault = 'INSERT INTO merchant_bank_swap SET ?';

      const result = await mysqlcon(sqlDefault, [details]);

       res.status(200).json({
        message: "Data sent successfully",
        data:details
      });
    } catch (error) {
       res.status(500).json({
        error: 'An error occurred',
      });
    }
  }

  async updateMerchantSwapGateway(req: Request, res: Response): Promise<void> {
    try {
      const { id, merchant_id, bankcode, primary_gateway, switch_gateway }: UpdateMerchantSwapGatewayRequestBody = req.body;

      const details = {
        merchant_id,
        bankcode,
        primary_gateway,
        switch_gateway,
        modification_date: dateTime,
      };

      if (id) {
        const sql = 'UPDATE merchant_bank_swap SET ? WHERE id = ?';
        const result = await mysqlcon(sql, [details, id]);

        if (result) {
           res.status(200).json({
            message: 'Swap Gateway Updated ✅',
            data:details
          });
        } else {
           res.status(201).json({
            message: 'Error while updating',
          });
        }
      } else {
         res.status(205).json({
          message: 'Kindly Provide Id',
        });
      }
    } catch (error) {
       res.status(500).json({
        message: 'Error occurred',
        error: error instanceof Error ? error.message : error, 
      });
    }
  }
async getSwapDetails (req: Request, res: Response ): Promise<void>  {
    try {
      const { id }:GetSwapDetailsRequestBody = req.body;
  
      const sql = ` SELECT primary_gateway.gateway_name AS primaryGateway, switch_gateway.gateway_name AS switchGateway, merchant_bank_swap.*, DATE_FORMAT(merchant_bank_swap.creation_date, '%Y-%m-%d %H:%i:%s') AS creation_date, DATE_FORMAT(merchant_bank_swap.modification_date, '%Y-%m-%d %H:%i:%s') AS modification_date 
        FROM merchant_bank_swap 
        LEFT JOIN payment_gateway AS primary_gateway ON primary_gateway.id = merchant_bank_swap.primary_gateway 
        LEFT JOIN payment_gateway AS switch_gateway ON switch_gateway.id = merchant_bank_swap.switch_gateway 
        WHERE merchant_bank_swap.id = ?`;
  
      const result = await mysqlcon(sql, [id]);
  
       res.status(200).json({
        result: result
      });
    } catch (error) {
         res.status(500).json({
        message: 'Error occurred',
        error: error 
      });
    }
  }

 async selectBankCode (req: Request, res: Response): Promise<void>  {
    try {
      const sqlDefault = `SELECT CONCAT(code, '-', title) AS selectValue, code FROM tbl_akonto_banks_code`;
      const result = await mysqlcon(sqlDefault);
  
      res.status(200).json({
        result: result,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error occurred',
        error: error instanceof Error ? error.message : error,
      });
    }
  };

 async deleteSwap (req: Request, res: Response): Promise<void>{
      try {
        let { id }: { id: number } = req.body;
    
        let sql = "DELETE FROM merchant_bank_swap WHERE id = ?";
        let result = await mysqlcon(sql, [id]);
    
     if (result) {
          res.json({
            message: "Deleted Successfully",
            data:result
          })
        } else {
           res.json({
            message: "Error while Deleting",
          });
        }
      } catch (error) {
         res.json({
          message: "error occurered",
          error: error,
          });
      }
  };
  
  
}



  export default new DefaultSwap
  
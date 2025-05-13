import { Request, Response } from "express";
import mysqlcon from "../../../config/db_connection";

//yesterday,weekly,monthly,yearly
interface DepositAmount{
  amount: number;
  total: number;
  hr: number;
  day: string; 
  month: string;
  yesterdayAmount: number[];
  weekly: { [dayLabel: string]: number };
  monthly: { [dayLabel: string]: number };   
}

class AmountReqController{
  public async yesterday(req: Request, res: Response): Promise<void>{
        try {
            const yesterdayAmount: number[] = [0, 0, 0, 0, 0, 0];
            let total = 0;
    
            const sql = `
                SELECT 
                    SUM(deposit_recieved) as amount, 
                    (CASE 
                        WHEN HOUR(created_on) < 4 THEN 0 
                        WHEN HOUR(created_on) >= 4 AND HOUR(created_on) < 8 THEN 1 
                        WHEN HOUR(created_on) >= 8 AND HOUR(created_on) < 12 THEN 2 
                        WHEN HOUR(created_on) >= 12 AND HOUR(created_on) < 16 THEN 3 
                        WHEN HOUR(created_on) >= 16 AND HOUR(created_on) < 20 THEN 4 
                        ELSE 5 
                    END) as hr 
                FROM tbl_bank_deposites_receive 
                WHERE DATE(created_on) = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY)) 
                GROUP BY hr
            `;
    
            const result: DepositAmount[] = await mysqlcon(sql);
    
            for (const row of result) {
                yesterdayAmount[row.hr] = row.amount;
                total += row.amount;
            }
    
            const responseData = {
                yesterdayAmount,
                total
            };
    
             res.status(200).json({
                status: true,
                message: "Amount Received For Settlement (Yesterday)",
                data: responseData
            });
    
        } catch (error) {
             res.status(500).json({
                message: "Error occurred",
                error
            });
        }
  }
 
  public async weekly(req: Request, res: Response): Promise<void>{
    try {
        const dayNames: { [key: number]: string } = {
            0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
        };

        const dates: string[] = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return `${dayNames[d.getDay()]} (${("0" + d.getDate()).slice(-2)}-${("0" + (d.getMonth() + 1)).slice(-2)})`;
        });

        const sql = `
            SELECT 
                SUM(deposit_recieved) AS amount, 
                DATE_FORMAT(created_on, '%d-%m') as day 
            FROM tbl_bank_deposites_receive 
            WHERE DATE(created_on) >= DATE(DATE_SUB(NOW(), INTERVAL 6 DAY)) 
            GROUP BY day, created_on 
            ORDER BY DATE(created_on) DESC
        `;

        const result: DepositAmount[] = await mysqlcon(sql);
        const depositData = result;

        let total = 0;
        const data: { [key: string]: number } = {};

        dates.forEach((label) => {
            const formattedDay = label.split('(')[1].substring(0, 5);
            const matchingEntries = depositData.filter(entry => entry.day === formattedDay);
            const amount = matchingEntries.reduce((sum, entry) => sum + entry.amount, 0);
            data[label] = amount;
            total += amount;
        });

        const responseData = {
            weekly: data,
            total
        };

     res.status(200).json({
            status: true,
            message: "Amount Received For Settlement (Weekly)",
            data: responseData
        });

    } catch (error) {
     res.status(500).json({
            message: "Error occurred",
            error
        });
    }
  }  

  public async monthly(req: Request, res: Response): Promise<void>{
    try {
        const dayNames: { [key: number]: string } = {
            0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
        };

        const dates: string[] = [...Array(30)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return `${dayNames[d.getDay()]} (${("0" + d.getDate()).slice(-2)}-${("0" + (d.getMonth() + 1)).slice(-2)})`;
        });

        const sql = `
            SELECT 
                SUM(deposit_recieved) AS amount, 
                DATE_FORMAT(created_on, '(%d-%m)') AS day 
            FROM tbl_bank_deposites_receive 
            WHERE DATE(created_on) >= DATE(DATE_SUB(NOW(), INTERVAL 29 DAY)) 
            GROUP BY day, created_on 
            ORDER BY DATE(created_on) DESC
        `;

        const result: DepositAmount[] = await mysqlcon(sql);
        const depositData = result;

        let total = 0;
        const data: { [key: string]: number } = {};

        dates.forEach(label => {
            const formattedDay = label.split(' ')[1]; 
            const matchingEntries = depositData.filter(entry => entry.day === formattedDay);
            const amount = matchingEntries.reduce((sum, entry) => sum + entry.amount, 0);
            data[label] = amount;
            total += amount;
        });

        const responseData = {
            monthly: data,
            total
        };

         res.status(200).json({
            status: true,
            message: "Amount Received For Settlement (Monthly)",
            data: responseData
        });

    } catch (error) {
         res.status(500).json({
            message: "Error occurred",
            error
        });
    }
  }

  public async yearly(req: Request, res: Response): Promise<void> {
    try {
      const year = new Date().getFullYear() % 100; 
      const monthLabels: string[] = [
        `Jan-${year}`, `Feb-${year}`, `Mar-${year}`, `Apr-${year}`,
        `May-${year}`, `Jun-${year}`, `Jul-${year}`, `Aug-${year}`,
        `Sep-${year}`, `Oct-${year}`, `Nov-${year}`, `Dec-${year}`
      ];

      const sql = `
        SELECT 
          DATE_FORMAT(created_on, '%b-%y') AS month, 
          SUM(deposit_recieved) AS amount 
        FROM tbl_bank_deposites_receive 
        WHERE YEAR(created_on) = YEAR(NOW()) 
        GROUP BY month
      `;

      const result: DepositAmount[] = await mysqlcon(sql);

      const data: { [key: string]: number } = {};
      let total = 0;

      monthLabels.forEach(label => {
        const matchingEntries = result.filter(entry => entry.month === label);
        const amount = matchingEntries.reduce((sum, entry) => sum + entry.amount, 0);
        data[label] = amount;
        total += amount;
      });

      res.status(200).json({
        status: true,
        message: "Amount Received For Settlement (Yearly)",
        data: {
          yearly: data,
          total
        }
      });

    } catch (error) {
      res.status(500).json({
        message: "Error occurred",
        error
      });
    }
  }
}

export default new AmountReqController();
import { Request, Response } from 'express';
import mysqlcon from '../../../config/db_connection';

//yesterday,weekly,monthly,yearly
interface SettlementRow {
  amount: number;
  hr: number;
  day: string;   
  month: string;  
}

class LocalSettlement{
   async yesterdaySettlement(req: Request, res: Response): Promise<void> {
    try {
      const yesterdaySettlement: number[] = [0, 0, 0, 0, 0, 0];
  
      const sql = `
        SELECT 
          SUM(requestedAmount) as amount, 
          (
            CASE 
              WHEN HOUR(created_on) < 4 THEN 0
              WHEN HOUR(created_on) >= 4 AND HOUR(created_on) < 8 THEN 1
              WHEN HOUR(created_on) >= 8 AND HOUR(created_on) < 12 THEN 2
              WHEN HOUR(created_on) >= 12 AND HOUR(created_on) < 16 THEN 3
              WHEN HOUR(created_on) >= 16 AND HOUR(created_on) < 20 THEN 4
              ELSE 5
            END
          ) as hr 
        FROM tbl_settlement 
        WHERE status = 1 
          AND settlement_mode = 2 
          AND DATE(created_on) = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY)) 
        GROUP BY hr
      `;
  
      const result: SettlementRow[] = await mysqlcon(sql);
  
      for (const row of result) {
        yesterdaySettlement[row.hr] = row.amount || 0;
      }
  
      const total = yesterdaySettlement.reduce((a, b) => a + b, 0);
  
       res.status(200).json({
        status: true,
        message: 'Local Settlement (Yesterday)',
        data: {
          yesterdaySettlement,
          total
        }
      });
    } catch (error) {
      console.error('Error in yesterdaySettlement:', error);
       res.status(500).json({
        message: 'Error occurred',
        error: (error as Error).message || error
      });
    }  
  }

   async weeklySettlement(req: Request, res: Response): Promise<void> {
    try {
        const dayMap: { [key: number]: string } = {
            0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
        };

        const dates: string[] = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return `${dayMap[d.getDay()]} (${("0" + d.getDate()).slice(-2)}-${("0" + (d.getMonth() + 1)).slice(-2)})`;
        });

        const sql = `
            SELECT 
                SUM(requestedAmount) AS amount,
                DATE_FORMAT(created_on, '(%d-%m)') AS day 
            FROM 
                tbl_settlement 
            WHERE 
                status = 1 AND settlement_mode = 2 
                AND DATE(created_on) >= DATE(DATE_SUB(NOW(), INTERVAL 6 DAY))  
            GROUP BY 
                day, created_on 
            ORDER BY 
                DATE(created_on) DESC
        `;

        const result: SettlementRow[] = await mysqlcon(sql);

        let total = 0;
        const data: { [key: string]: number } = {};

        dates.forEach((item) => {
            const formattedDay = item.split(" ")[1]; // '(22-04)'
            const amount = result
                .filter((row) => row.day === formattedDay)
                .reduce((sum, row) => sum + row.amount, 0);

            data[item] = amount;
            total += amount;
        });

         res.status(200).json({
            status: true,
            message: "Local Settlement (Weekly)",
            data: {
                weekly: data,
                total
            }
        });

    } catch (error: any) {
        console.error("Weekly Settlement Error:", error);
         res.status(500).json({
            message: "Error occurred",
            error: error.message || error
        });
    }
  }

   async monthlySettlement(req: Request, res: Response): Promise<void>  {
    try {
        const dayMap: { [key: number]: string } = {
            0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
        };

        const dates: string[] = [...Array(30)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return `${dayMap[d.getDay()]} (${("0" + d.getDate()).slice(-2)}-${("0" + (d.getMonth() + 1)).slice(-2)})`;
        });

        const sql = `
            SELECT 
                SUM(requestedAmount) AS amount,
                DATE_FORMAT(created_on, '(%d-%m)') AS day 
            FROM 
                tbl_settlement 
            WHERE 
                status = 1 AND settlement_mode = 2 
                AND DATE(created_on) >= DATE(DATE_SUB(NOW(), INTERVAL 29 DAY))  
            GROUP BY 
                day, created_on 
            ORDER BY 
                DATE(created_on) DESC
        `;

        const result: SettlementRow[] = await mysqlcon(sql);

        let total = 0;
        const data: { [key: string]: number } = {};

        dates.forEach((label) => {
            const dayPart = label.split(" ")[1]; // e.g., "(22-04)"
            const sum = result
                .filter((row) => row.day === dayPart)
                .reduce((acc, row) => acc + row.amount, 0);

            data[label] = sum;
            total += sum;
        });

         res.status(200).json({
            status: true,
            message: "Local Settlement (Monthly)",
            data: {
                monthly: data,
                total
            }
        });

    } catch (error: any) {
        console.error("Monthly Settlement Error:", error);
         res.status(500).json({
            message: "Error occurred",
            error: error.message || error
        });
    }
  }

   async yearlySettlement(req: Request, res: Response): Promise<void> {
  try {
      const currentYearShort = new Date().getFullYear() % 100;
      const months: string[] = [
          `Jan-${currentYearShort}`, `Feb-${currentYearShort}`, `Mar-${currentYearShort}`,
          `Apr-${currentYearShort}`, `May-${currentYearShort}`, `Jun-${currentYearShort}`,
          `Jul-${currentYearShort}`, `Aug-${currentYearShort}`, `Sep-${currentYearShort}`,
          `Oct-${currentYearShort}`, `Nov-${currentYearShort}`, `Dec-${currentYearShort}`
      ];

      const sql = `
          SELECT 
              DATE_FORMAT(created_on, '%b-%y') AS month, 
              SUM(requestedAmount) AS amount 
          FROM 
              tbl_settlement 
          WHERE 
              status = 1 
              AND settlement_mode = 2 
              AND YEAR(created_on) = YEAR(NOW()) 
          GROUP BY 
              month
      `;

      const result: SettlementRow[] = await mysqlcon(sql);

      let total = 0;
      const data: { [key: string]: number } = {};

      months.forEach((label) => {
          const sum = result
              .filter((row) => row.month === label)
              .reduce((acc, row) => acc + row.amount, 0);

          data[label] = sum;
          total += sum;
      });

       res.status(200).json({
          status: true,
          message: "Local Settlement (Yearly)",
          data: {
              yearly: data,
              total
          }
      });

  } catch (error: any) {
      console.error("Yearly Settlement Error:", error);
       res.status(500).json({
          message: "Error occurred",
          error: error.message || error
      });
  }


  }
}
export default new LocalSettlement();
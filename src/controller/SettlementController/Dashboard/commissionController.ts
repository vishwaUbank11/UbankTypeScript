import { Request, Response } from "express";
import mysqlcon from "../../../config/db_connection";

//yesterday,weekly,monthly,yearly
interface CommissionEntry {
  amount: number;
  hr: number;
  day: string;
  month: string;
}

class CommissioController{
  public async yesterdayCommissions(req: Request, res: Response): Promise<void> {
    try {
      const yesterday: number[] = [0, 0, 0, 0, 0, 0];

      const sql = `
        SELECT 
          SUM(charges) AS amount, 
          (CASE 
            WHEN HOUR(created_on) < 4 THEN 0 
            WHEN HOUR(created_on) >= 4 AND HOUR(created_on) < 8 THEN 1 
            WHEN HOUR(created_on) >= 8 AND HOUR(created_on) < 12 THEN 2 
            WHEN HOUR(created_on) >= 12 AND HOUR(created_on) < 16 THEN 3 
            WHEN HOUR(created_on) >= 16 AND HOUR(created_on) < 20 THEN 4 
            ELSE 5 
          END) AS hr 
        FROM tbl_settlement 
        WHERE status = 1 
          AND DATE(created_on) = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY)) 
        GROUP BY hr
      `;

      const result: CommissionEntry[] = await mysqlcon(sql);

      for (const entry of result) {
        yesterday[entry.hr] = entry.amount;
      }

      const total: number = yesterday.reduce((a, b) => a + b, 0);

      res.status(200).json({
        status: true,
        message: "Commission (Yesterday)",
        data: {
          yesterday,
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

  public async weeklyCommissions(req: Request, res: Response): Promise<void> {
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
          SUM(charges) AS amount,
          DATE_FORMAT(created_on, '(%d-%m)') AS day
        FROM tbl_settlement 
        WHERE status = 1 
          AND DATE(created_on) >= DATE(DATE_SUB(NOW(), INTERVAL 6 DAY)) 
        GROUP BY day, created_on 
        ORDER BY DATE(created_on) DESC
      `;

      const result: CommissionEntry[] = await mysqlcon(sql);

      const data: { [key: string]: number } = {};
      let total = 0;

      dates.forEach(label => {
        const formattedDay = label.split(' ')[1]; // e.g., "(15-04)"
        const dayTotal = result
          .filter(entry => entry.day === formattedDay)
          .reduce((sum, entry) => sum + entry.amount, 0);
        data[label] = dayTotal;
        total += dayTotal;
      });

      res.status(200).json({
        status: true,
        message: "Commission (Weekly)",
        data: {
          weekly: data,
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

  public async monthlyCommissions(req: Request, res: Response): Promise<void> {
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
          SUM(charges) AS amount,
          DATE_FORMAT(created_on,'(%d-%m)') AS day 
        FROM tbl_settlement 
        WHERE status = 1 
          AND DATE(created_on) >= DATE(DATE_SUB(NOW(), INTERVAL 29 DAY))  
        GROUP BY day, created_on 
        ORDER BY DATE(created_on) DESC
      `;

      const result: CommissionEntry[] = await mysqlcon(sql);

      let total = 0;
      const data: { [key: string]: number } = {};

      dates.forEach(label => {
        const formattedDay = label.split(' ')[1]; // e.g., "(21-04)"
        const amount = result
          .filter(entry => entry.day === formattedDay)
          .reduce((sum, entry) => sum + entry.amount, 0);
        data[label] = amount;
        total += amount;
      });

      res.status(200).json({
        status: true,
        message: "Commission (Monthly)",
        data: {
          monthly: data,
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

  public async yearlyCommissions(req: Request, res: Response): Promise<void> {
    try {
      const year = new Date().getFullYear() % 100;
      const monthLabels: string[] = [
        `Jan-${year}`, `Feb-${year}`, `Mar-${year}`, `Apr-${year}`, `May-${year}`, `Jun-${year}`,
        `Jul-${year}`, `Aug-${year}`, `Sep-${year}`, `Oct-${year}`, `Nov-${year}`, `Dec-${year}`
      ];
  
      const sql = `
        SELECT DATE_FORMAT(created_on, '%b-%y') as month, 
               SUM(charges) as amount 
        FROM tbl_settlement 
        WHERE status = 1 AND YEAR(created_on) = YEAR(NOW()) 
        GROUP BY month
      `;
  
      const result: CommissionEntry[] = await mysqlcon(sql);
  
      let total = 0;
      const data: { [key: string]: number } = {};
  
      monthLabels.forEach(label => {
        const matching = result.find(entry => entry.month === label);
        const amount = matching ? matching.amount : 0;
        data[label] = amount;
        total += amount;
      });
  
      res.status(200).json({
        status: true,
        message: "Commission (Yearly)",
        data: {
          yearly: data,
          total
        }
      });
  
    } catch (error) {
      res.status(500).json({
        message: "Error occured",
        error
      });
    }
  }
}

export default new CommissioController();
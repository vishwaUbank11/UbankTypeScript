import { Request, Response } from 'express';
import mysqlcon from '../../../config/db_connection';

//yesterday,weekly,monthly,yearly
interface InternationalSettlementRow{
  amount: number;
  settlementType: "FIAT" | "CRYPTO";
  hr: number;
  day: string;
  month: string;
}

class InternationalSettlement{
  public async  yesterdayInternational(req: Request, res: Response): Promise<void> {
        try {
            const fiat = [0, 0, 0, 0, 0, 0];
            const crypto = [0, 0, 0, 0, 0, 0];
            let total = 0;
    
            const sql = `
                SELECT 
                    SUM(requestedAmount) AS amount, 
                    settlementType, 
                    (CASE 
                        WHEN HOUR(created_on) < 4 THEN 0 
                        WHEN HOUR(created_on) >= 4 AND HOUR(created_on) < 8 THEN 1 
                        WHEN HOUR(created_on) >= 8 AND HOUR(created_on) < 12 THEN 2 
                        WHEN HOUR(created_on) >= 12 AND HOUR(created_on) < 16 THEN 3 
                        WHEN HOUR(created_on) >= 16 AND HOUR(created_on) < 20 THEN 4 
                        ELSE 5 
                    END) AS hr 
                FROM tbl_settlement 
                WHERE 
                    status = 1 
                    AND settlement_mode = 1 
                    AND DATE(created_on) = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY)) 
                GROUP BY hr, settlementType
            `;
    
            const result: InternationalSettlementRow[] = await mysqlcon(sql);
    
            const tempFiat = result.filter(item => item.settlementType === "FIAT");
            const tempCrypto = result.filter(item => item.settlementType === "CRYPTO");
    
            for (const x of tempFiat) {
                fiat[x.hr] = Number(x.amount);
                total += fiat[x.hr];
            }
    
            for (const y of tempCrypto) {
                crypto[y.hr] = Number(y.amount);
                total += crypto[y.hr];
            }
    
             res.status(200).json({
                status: true,
                message: "International Settlement (Yesterday)",
                data: {
                    fiat,
                    crypto,
                    total
                }
            });
        } catch (error: any) {
            console.error("Error in yesterdayInternational:", error);
             res.status(500).json({
                message: "Error occurred",
                error: error.message || error
            });
        }
  }

  public async weeklyInternational(req: Request, res: Response): Promise<void>  {
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
                    settlementType, 
                    DATE_FORMAT(created_on, '(%d-%m)') AS day 
                FROM tbl_settlement 
                WHERE 
                    status = 1 
                    AND settlement_mode = 1 
                    AND DATE(created_on) >= DATE(DATE_SUB(NOW(), INTERVAL 6 DAY)) 
                GROUP BY day, settlementType 
                ORDER BY day DESC
            `;
    
            const result:InternationalSettlementRow [] = await mysqlcon(sql);
    
            const tempFiat = result.filter(item => item.settlementType === "FIAT");
            const tempCrypto = result.filter(item => item.settlementType === "CRYPTO");
    
            const data = dates.map(dayStr => ({
                day: dayStr,
                fiat: tempFiat
                    .filter(item => item.day === dayStr.split(' ')[1])
                    .reduce((a, b) => a + Number(b.amount), 0),
                crypto: tempCrypto
                    .filter(item => item.day === dayStr.split(' ')[1])
                    .reduce((a, b) => a + Number(b.amount), 0)
            }));
    
            const total = Number(result.reduce((acc, row) => acc + Number(row.amount), 0).toFixed(2));
    
             res.status(200).json({
                status: true,
                message: "International Settlement (Weekly)",
                data: {
                    weekly: data,
                    total: total
                }
            });
    
        } catch (error: any) {
            console.error("Error in weeklyInternational:", error);
             res.status(500).json({
                message: "Error occurred",
                error: error.message || error
            });
        }
  }

  public async monthlyInternational (req: Request, res: Response): Promise<void> {
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
                    settlementType, 
                    DATE_FORMAT(created_on, '(%d-%m)') AS day 
                FROM tbl_settlement 
                WHERE 
                    status = 1 
                    AND settlement_mode = 1 
                    AND DATE(created_on) >= DATE(DATE_SUB(NOW(), INTERVAL 29 DAY)) 
                GROUP BY settlementType, DATE_FORMAT(created_on, '(%d-%m)'), created_on 
                ORDER BY created_on DESC
            `;
    
            const result:InternationalSettlementRow [] = await mysqlcon(sql);
    
            const tempFiat = result.filter(item => item.settlementType === "FIAT");
            const tempCrypto = result.filter(item => item.settlementType === "CRYPTO");
    
            const fiat: number[] = [];
            const crypto: number[] = [];
    
            dates.forEach((date, i) => {
                const dayKey = date.split(" ")[1];
                fiat[i] = tempFiat
                    .filter(item => item.day === dayKey)
                    .reduce((sum, row) => sum + Number(row.amount), 0);
    
                crypto[i] = tempCrypto
                    .filter(item => item.day === dayKey)
                    .reduce((sum, row) => sum + Number(row.amount), 0);
            });
    
            const total = Number(result.reduce((acc, row) => acc + Number(row.amount), 0).toFixed(2));
    
             res.status(200).json({
                status: true,
                message: "International Settlement (Monthly)",
                data: {
                    fiat,
                    crypto,
                    dates,
                    total
                }
            });
    
        } catch (error: any) {
            console.error("Error in monthlyInternational:", error);
             res.status(500).json({
                message: "Error occurred",
                error: error.message || error
            });
        }
  }

  public async yearlyInternational  (req: Request, res: Response): Promise<void>  {
        try {
            const year = new Date().getFullYear() % 100;
            const months = [
                `Jan-${year}`, `Feb-${year}`, `Mar-${year}`, `Apr-${year}`, `May-${year}`, `Jun-${year}`,
                `Jul-${year}`, `Aug-${year}`, `Sep-${year}`, `Oct-${year}`, `Nov-${year}`, `Dec-${year}`
            ];
    
            const sql = `
                SELECT 
                    DATE_FORMAT(created_on, '%b-%y') AS month, 
                    settlementType, 
                    SUM(requestedAmount) AS amount 
                FROM tbl_settlement 
                WHERE 
                    status = 1 
                    AND settlement_mode = 1 
                    AND YEAR(created_on) = YEAR(NOW()) 
                GROUP BY month, settlementType
            `;
    
            const result: InternationalSettlementRow[] = await mysqlcon(sql);
    
            const tempFiat = result.filter(item => item.settlementType === "FIAT");
            const tempCrypto = result.filter(item => item.settlementType === "CRYPTO");
    
            const data = months.map(month => ({
                day: month,
                fiat: tempFiat
                    .filter(item => item.month === month)
                    .reduce((_, row) => row.amount, 0),
                crypto: tempCrypto
                    .filter(item => item.month === month)
                    .reduce((_, row) => row.amount, 0),
            }));
    
            const total = Number(
                result.reduce((sum, row) => sum + Number(row.amount), 0).toFixed(2)
            );
    
             res.status(200).json({
                status: true,
                message: "International Settlement (Yearly)",
                data: {
                    yearly: data,
                    total
                }
            });
    
        } catch (error: any) {
            console.error("Error in yearlyInternational:", error);
             res.status(500).json({
                message: "Error occurred",
                error: error.message || error
            });
        }
  }
}

export default new InternationalSettlement();

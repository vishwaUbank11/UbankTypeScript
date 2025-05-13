import { Request, Response } from "express";
import mysqlcon from "../../../config/db_connection";

//dashboardTable
interface TopUserEntry{
  name?: string;
  amount?: number;
  currency?: string;
  sortname?: string;
  symbol?: string;
}

class DashboardTable{
  public async dashboardTable(req: Request, res: Response): Promise<void> {
        try {
          const sqlLocal = `
            SELECT user.name, SUM(settlement.requestedAmount) as amount 
            FROM tbl_settlement settlement 
            INNER JOIN tbl_user user ON settlement.user_id = user.id 
            WHERE settlement.status = 1 AND settlement.settlement_mode = 1 
            GROUP BY user.name 
            ORDER BY amount DESC 
            LIMIT 0,10
          `;
      
          const sqlInternational = `
            SELECT user.name, SUM(settlement.requestedAmount) as amount 
            FROM tbl_settlement settlement 
            INNER JOIN tbl_user user ON settlement.user_id = user.id 
            WHERE settlement.status = 1 AND settlement.settlement_mode = 2 
            GROUP BY user.name 
            ORDER BY amount DESC 
            LIMIT 0,10
          `;
      
          const sqlCurrency = `
            SELECT name, MAX(amount) as amount, currency 
            FROM (
              SELECT user.name, settlement.requestedAmount as amount, settlement.fromCurrency as currency 
              FROM tbl_settlement settlement 
              INNER JOIN tbl_user user ON settlement.user_id = user.id 
              WHERE settlement.status = 1 
              GROUP BY user.name, settlement.fromCurrency, settlement.requestedAmount
            ) tbl 
            GROUP BY currency, name
          `;
      
          const curSql = `SELECT sortname, symbol FROM countries WHERE status = 1`;
      
          const topLocal: TopUserEntry[] = await mysqlcon(sqlLocal);
          const topInternational: TopUserEntry[] = await mysqlcon(sqlInternational);
          const result: TopUserEntry[] = await mysqlcon(sqlCurrency);
          const curResult: TopUserEntry[] = await mysqlcon(curSql);
      
          const currencies = curResult.map(row => row.sortname);
      
          const topCurrency: TopUserEntry[] = currencies.map(currency => {
            const matched = result.filter(item => item.currency === currency);
            return {
              name: matched.length > 0 ? matched[matched.length - 1].name : 'NA',
              amount: matched.length > 0 ? matched[matched.length - 1].amount : 0,
              currency
            };
          });
      
          res.status(200).json({
            status: true,
            data: {
              topLocal,
              topInternational,
              topCurrency
            }
          });
      
        } catch (error) {
          console.error(error);
          res.status(500).json({
            message: "Error occured",
            error
          });
        }
  }
}
export default new DashboardTable();
import { Request,Response } from "express";
import mysqlcon from '../config/db_connection';


function getSixMonthsAgoDate(): string {
    const now = new Date();
    now.setMonth(now.getMonth() - 6);
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  }

interface dashCarResponse{
    value? : any;
    error? : string;
    message? : string;
    data? : any
}

interface PieGraphRow {
    status: number;
    total_amount: string; 
}
    
interface PieGraphResponse {
    message: string;
    data: {
        [key: string]: string; 
    };
}

interface Country {
    Name: string;
    image: string;
    symbol: string;
}
    
interface DepositRow {
    ammount_type: string;
    total_amount: string;
}

interface PayoutRow {
    currency: string;
    total_amount: string;
}

interface CurrencyEntry {
    currency: {
        Name: string;
        Image: string;
    };
    Deposits: string;
    Payouts: string;
}

interface CurrencyResponse {
    data: CurrencyEntry[];
    currencylength: number;
}

interface VendorResult {
    gateway_name: string;
    totalAmount: string;
    gatewayNumber?: number; // Needed for fallback query if only 1 result
    id?: number; // Depending on how mysqlcon maps aliases
  }
  
  interface VendorResponse {
    data: { Vendors: string; Amount: string }[];
  }
      

class dashboard {

    async dashboard_cardData(req:Request,res:Response<dashCarResponse>):Promise<void>{
        try {
            // Calculate the date 6 months ago
            const sixMonthsAgo = getSixMonthsAgoDate();
    
            // Database queries
            const queries = [
                { sql: 'SELECT SUM(ammount) AS merchant_transactions_sum FROM tbl_merchant_transaction WHERE status = 1 AND created_on >= ?', params: [sixMonthsAgo] },
                { sql: 'SELECT SUM(amount) AS icici_sum FROM tbl_icici_payout_transaction_response_details WHERE status = "success" AND created_on >= ?', params: [sixMonthsAgo] },
                { sql: 'SELECT SUM(settlementAmount) AS settlement_sum FROM tbl_settlement WHERE status = 1 AND (settlement_mode = 1 OR settlement_mode = 2) AND created_on >= ?', params: [sixMonthsAgo] }
            ];
    
            // Execute all queries concurrently
            const results = await Promise.all(queries.map(({ sql, params }) => mysqlcon(sql, params)));
    
            // Extract sums from query results and format them
            const formatValue = (value: any) => parseFloat(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const responseData = {
                merchant_transactions_sum: formatValue(results[0][0].merchant_transactions_sum),
                icici_sum: formatValue(results[1][0].icici_sum),
                settlement_sum: formatValue(results[2][0].settlement_sum)
            };
    
            // Determine message
            const message = Object.values(responseData).some(value => value !== '0.00') ? "Data found" : "No Record Found";
    
            // Send the response
            res.status(200).json({ message, data: responseData });
        } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async  piegraph_data (req: Request,res: Response<PieGraphResponse>): Promise<void>  {
      try {
        const sixMonthsAgo = getSixMonthsAgoDate();
    
        const query = `
          SELECT 
            status, 
            COALESCE(SUM(ammount), 0) AS total_amount 
          FROM 
            tbl_merchant_transaction 
          WHERE 
            created_on >= ? 
          GROUP BY 
            status
        `;
        const params = [sixMonthsAgo];
    
        const results = await mysqlcon(query, params) as PieGraphRow[];
    
        const responseData: { [key: string]: string } = {};
        const statuses = [0, 1, 2, 3, 4, 5];
    
        for (const status of statuses) {
          const row = results.find(r => r.status === status);
          const totalAmount = parseFloat(row?.total_amount || '0')
            .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          responseData[`status_${status}_sum`] = totalAmount;
        }
    
        const message = Object.values(responseData).some(value => value !== '0.00')
          ? "Data found"
          : "No Record Found";
    
        res.status(200).json({ message, data: responseData });
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error', data: {} });
      }
    };
    

    
    async currency_data (req: Request,res: Response<CurrencyResponse | { error: string }>): Promise<void> {
      try {
        const sixMonthsAgo = getSixMonthsAgoDate();
    
        const [countries, deposits, payouts] = await Promise.all([
          mysqlcon('SELECT sortname AS Name, image, symbol FROM countries WHERE status=1') as Promise<Country[]>,
          mysqlcon(
            `SELECT ammount_type, SUM(ammount) AS total_amount 
             FROM tbl_merchant_transaction 
             WHERE status=1 AND ammount_type IS NOT NULL AND created_on >= ? 
             GROUP BY ammount_type`, 
            [sixMonthsAgo]
          ) as Promise<DepositRow[]>,
          mysqlcon(
            `SELECT currency, SUM(amount) AS total_amount 
             FROM tbl_icici_payout_transaction_response_details 
             WHERE status='SUCCESS' AND currency IS NOT NULL AND created_on >= ? 
             GROUP BY currency`, 
            [sixMonthsAgo]
          ) as Promise<PayoutRow[]>
        ]);
    
        const depositsMap: Record<string, string> = Object.fromEntries(
          deposits.map(({ ammount_type, total_amount }) => [
            ammount_type,
            parseFloat(total_amount).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          ])
        );
    
        const payoutsMap: Record<string, string> = Object.fromEntries(
          payouts.map(({ currency, total_amount }) => [
            currency,
            parseFloat(total_amount).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          ])
        );
    
        const matchedData: CurrencyEntry[] = countries.map(({ Name, image, symbol }) => {
          const depositsValue = depositsMap[Name] || '0.00';
          const payoutsValue = payoutsMap[Name] || '0.00';
    
          return {
            currency: {
              Name,
              Image: image,
            },
            Deposits: `${symbol} ${depositsValue}`,
            Payouts: `${symbol} ${payoutsValue}`,
          };
        });
    
        res.status(200).json({
          data: matchedData,
          currencylength: matchedData.length,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
    
    async vendorsData(req: Request,res: Response<VendorResponse | { error: string }>):Promise<void>{
        try {
            const sql = `
              SELECT 
                t.gatewayNumber,
                p.gateway_name, 
                FORMAT(SUM(t.ammount), 2) AS totalAmount 
              FROM 
                tbl_merchant_transaction t 
              JOIN 
                payment_gateway p ON t.gatewayNumber = p.id 
              WHERE 
                t.created_on >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) 
                AND t.status = 1 
              GROUP BY 
                t.gatewayNumber, p.id, p.gateway_name 
              ORDER BY 
                SUM(t.ammount) DESC 
              LIMIT 10;
            `;
        
            const result = await mysqlcon(sql) as VendorResult[];
            console.log("Fetched result:", result);
            if (result.length === 1) {
              const topRecord = result[0];
              const remainingLimit = 9;
        
              const remainingSql = `
                SELECT 
                  p.gateway_name, 
                  FORMAT(SUM(t.ammount), 2) AS totalAmount 
                FROM 
                  tbl_merchant_transaction t 
                JOIN 
                  payment_gateway p ON t.gatewayNumber = p.id 
                WHERE 
                  t.created_on >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) 
                  AND t.status = 1 
                  AND t.gatewayNumber != ? 
                GROUP BY 
                  t.gatewayNumber, p.id, p.gateway_name 
                ORDER BY 
                  RAND() 
                LIMIT ?;
              `;
        
              const remainingResult = await mysqlcon(
                remainingSql,
                [topRecord.gatewayNumber, remainingLimit]
              ) as VendorResult[];
        
              const finalResult = [topRecord, ...remainingResult];
        
              res.status(200).json({
                data: finalResult.map(item => ({
                  Vendors: item.gateway_name,
                  Amount: item.totalAmount,
                }))
              });
        
            } else {
              // Return top 10 vendors
              res.status(200).json({
                data: result.map(item => ({
                  Vendors: item.gateway_name,
                  Amount: item.totalAmount,
                }))
              });
            }        
        } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async getTypeDetails(req:Request,res:Response):Promise<void>{
        try {
            // Database queries
            const sql1 = 'SELECT type FROM payout_gateway_detail';
            const sql2 = 'SELECT type FROM gateway_detail';
    
            // Execute both queries concurrently
            const [payoutGatewayResult, gatewayDetailsResult] = await Promise.all([
                mysqlcon(sql1),
                mysqlcon(sql2)
            ]);
    
            // Send the response
            res.status(200).json({ payout_gateway: payoutGatewayResult, gateway_details: gatewayDetailsResult });
        } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

}

export default new dashboard
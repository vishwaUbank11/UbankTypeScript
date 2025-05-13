import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';
const currentUTC = new Date();
const istOffset = 5.5 * 60 * 60 * 1000; 
const istTime = new Date(currentUTC.getTime() + istOffset);
const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');

interface Pagination {
    limit: number;
    start: number;
    numOfPages: number;
}

interface AuthenticatedRequest extends Request {
  user?: any; 
}

interface getDetailRequest{
  merchant_id? : string,
  currency? : string
  message?: string
  data? :any
  error? : any
}
const pagination = (total: number, page: number, limit: number): Pagination => {
    const numOfPages = Math.ceil(total / limit);
    const start = page * limit - limit;
    return { limit, start, numOfPages };
};


class settlement{

    async defaultSettlement(req: AuthenticatedRequest,res:Response):Promise<void>{
            try {
                let {group_id} = req.user;
                
                let sql = "SELECT COUNT(*) as Total FROM tbl_settlement";
                let result = await mysqlcon(sql);
        
                let total  = result[0].Total;
                let Page = req.body.page ? Number(req.body.page) : 1;
                let limit = req.body.limit ? Number(req.body.limit) : 10;
        
                let page = pagination(total,Page,limit);
        
                let sql1 = "SELECT tbl_user.name,tbl_settlement.* FROM tbl_user INNER JOIN tbl_settlement ON tbl_user.id = tbl_settlement.user_id ORDER BY created_on DESC LIMIT ?,?";
        
                let result1 = await mysqlcon(sql1,[page.start,page.limit]);
        
                let sqlM = "SELECT id,name from tbl_user WHERE status = 1 AND complete_profile = 1";
                let resultM = await mysqlcon(sqlM);
        
                let sqlC = "SELECT id as currencyId,sortname from countries ORDER BY sortname ASC";
                let resultC = await mysqlcon(sqlC);
        
                if(result1.length !== 0){
                     res.status(200).json({
                        message:`Total settlements are ${total}`,
                        currentPage: Page,
                        totalPages: page.numOfPages,
                        pageLimit: page.limit,
                        group_id:group_id,
                        merchants:resultM,
                        currency:resultC,
                        data: result1         
                    })
                }
                else{
                     res.status(201).json({
                        message:`No Record Found`,
                        group_id:group_id,
                        merchants:resultM,
                        currency:resultC,
                        data: result1      
        
                    })
                }
            } catch (error) {
                console.log(error)
                 res.status(500).json({
                    message: "error occurered",
                    error: error
                })
                
            }
    }
      
    async  getById(req: AuthenticatedRequest, res: Response): Promise<void> {
      try {
        const { id } = req.body;
        const { group_id } = req.user;
    
        if (!id) {
          res.status(400).json({ message: 'Missing settlement ID' });
        }
    
        // Check current status
        const sqlCheck = "SELECT status FROM tbl_settlement WHERE id = ?";
        const resultCheck = await mysqlcon(sqlCheck, [id]);
    
        if (!resultCheck.length) {
            res.status(404).json({ message: 'Settlement record not found' });
        }
    
        const currentStatus = resultCheck[0].status;
        let sqlToExecute = '';
    
        if (group_id === 2) {
          // SubAdmin can update only if status is not 1 or 2
          if (currentStatus !== 1 && currentStatus !== 2) {
            sqlToExecute = "UPDATE tbl_settlement SET status = 2 WHERE id = ?";
          } else {
            res.status(200).json({
              message: `Already status updated to ${currentStatus === 2 ? '2 by SubAdmin' : '1 by SuperAdmin'}`,
            });
          }
        } else if (group_id === 1) {
          // SuperAdmin can override to 1
          if (currentStatus !== 1) {
            sqlToExecute = "UPDATE tbl_settlement SET status = 1 WHERE id = ?";
          } else {
            res.status(200).json({
              message: 'Status is already updated to 1 by SuperAdmin',
            });
          }
        } else {
          // If the group is not 1 or 2, you can decide whether to handle the case
            res.status(403).json({ message: 'Unauthorized group' });
        }
    
        if (!sqlToExecute) {
            res.status(400).json({ message: 'No valid update condition met' });
        }
    
        const result = await mysqlcon(sqlToExecute, [id]);
    
        if (result.affectedRows > 0) {
            res.status(200).json({
            message: `Settlement Approved ${group_id === 1 ? 'to 1 by SuperAdmin' : 'to 2 by SubAdmin'}`,
            data: result
          });
        } else {
            res.status(200).json({
            message: 'Update attempted but no rows were affected',
            data: result
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: "An error occurred",
          error
        });
      }
    }
    
    async createSettlement(req: AuthenticatedRequest, res: Response): Promise<void> {
      try {
        const { group_id } = req.user
        const {
          settlementId,
          merchant_id,
          settlementType,
          currency,
          toCurrency,
          walletAddress,
          accountNumber,
          available_balance,
          requested_time,
          settlement_time,
          requestedAmount,
          fee_charge,
          total_charges,
          net_amount_for_settlement,
          exchangeRate,
          bankName,
          branchName,
          city,
          zip_code,
          country,
          swiftCode,
          Settlement_Ammount,
          merchant_name
        } = req.body;
    
        let settlement: any = {
          settlementId,
          user_id: merchant_id,
          settlementType,
          fromCurrency: currency,
          toCurrency,
          walletAddress: "",
          accountNumber,
          available_balance,
          requested_time,
          settlement_time,
          requestedAmount,
          charges: fee_charge,
          totalCharges: total_charges,
          net_amount_for_settlement,
          exchangeRate,
          bankName,
          branchName,
          city,
          zip_code,
          country,
          swiftCode,
          settlementAmount: Settlement_Ammount,
          merchant_name,
          source: group_id === 1 ? "By SuperAdmin" : "By SubAdmin",
          created_on: formattedIST,
          updated_on: formattedIST
        };
    
        // If settlementType is CRYPTO, modify the settlement object
        if (settlement.settlementType === "CRYPTO") {
          settlement = {
            settlementId,
            user_id: merchant_id,
            settlementType,
            fromCurrency: currency,
            toCurrency,
            walletAddress,
            available_balance,
            requested_time,
            settlement_time,
            accountNumber: "",
            bankName: "",
            branchName: "",
            city: "",
            country: "",
            swiftCode: "",
            zip_code,
            requestedAmount,
            charges: fee_charge,
            totalCharges: total_charges,
            net_amount_for_settlement,
            exchangeRate,
            settlementAmount: Settlement_Ammount,
            merchant_name,
            source: group_id === 1 ? "By SuperAdmin" : "By SubAdmin",
            created_on: formattedIST,
            updated_on: formattedIST
          };
        }
    
        // Prepare SQL query
        const sql = "INSERT INTO tbl_settlement SET ?";
        const result = await mysqlcon(sql, settlement);
    
        // Respond to client
        if (result.affectedRows > 0) {
          res.status(200).json({
            message: "Request settlement transaction successfully",
          });
        } else {
          res.status(400).json({
            message: "Error while creating settlement",
          });
        }
      } catch (error) {
        console.log(error);
        res.status(500).json({
          message: "An error occurred",
          error: error
        });
      }
    }
    
    async updateSettlement(req:Request,res:Response):Promise<void>{
      try {
        let {id} = req.body;
  
        if(id === undefined){
          res.status(201).json({
            message:'Please send the id of the row by which i can search the record and update it'
          })
        }

        let { 
          settlementId,
          merchant_id,
          settlementType,
          currency,
          toCurrency,
          walletAddress,
          accountNumber,
          available_balance,
          requested_time,
          settlement_time,
          requestedAmount,
          fee_charge,
          total_charges,
          net_amount_for_settlement,
          exchangeRate,
          bankName,
          branchName,
          city,
          zip_code,
          country,
          swiftCode,
          Settlement_Ammount
        } = req.body;
  
        let Settlement = {
          settlementId: settlementId,
          user_id: merchant_id,
          settlementType: settlementType,
          fromCurrency: currency, 
          toCurrency: toCurrency,
          walletAddress: "",
          accountNumber: accountNumber,
          available_balance: available_balance,
          requested_time,
          settlement_time,
          requestedAmount: requestedAmount,
          charges: fee_charge, 
          totalCharges: total_charges, 
          net_amount_for_settlement:net_amount_for_settlement,
          exchangeRate: exchangeRate, 
          bankName: bankName,
          branchName:branchName,
          city:city,
          zip_code:zip_code,
          country: country,
          swiftCode: swiftCode,
          settlementAmount: Settlement_Ammount, 
          updated_on:formattedIST
        };
    
        if (Settlement.settlementType === "CRYPTO") {
          Settlement = {
            settlementId: settlementId, 
            user_id: merchant_id,
            settlementType: settlementType,
            fromCurrency: currency, 
            toCurrency: toCurrency,
            walletAddress,
            available_balance: available_balance,
            requested_time,
            settlement_time,
            accountNumber: "",
            bankName: "",
            branchName: "",
            city: "",
            country: "",
            swiftCode: "",
            zip_code:zip_code,
            requestedAmount: requestedAmount,
            charges: fee_charge, 
            totalCharges: total_charges, 
            net_amount_for_settlement:net_amount_for_settlement,
            exchangeRate: exchangeRate, 
            settlementAmount: Settlement_Ammount,
            updated_on:formattedIST
          }
        }

        let sql = "UPDATE tbl_settlement SET ? WHERE id = ?";
        let result = await mysqlcon(sql,[Settlement,id]);
  
        if(result.affectedRows > 0){
           res.status(200).json({
              message:`Settlement Updated Successfully`,
          })
        }
        else{
          res.json(201).json({
            message:`Error While Updating`,
          })
        }  
      } catch (error) {
        console.log(error)
        res.status(500).json({
          message: "error occurered",
          error: error
        })
      }
    }

    async detailSettlement(req:Request,res:Response<getDetailRequest>):Promise<void>{
      try {
        let {merchant_id,currency} = req.body;

        let sql="";
        let result;

        if(merchant_id && currency === undefined){
          sql += "SELECT fee_charge,wallet FROM tbl_user where id = ?";
          result = await mysqlcon(sql, [merchant_id]);
        }
        else if(currency){
          sql = "SELECT rate FROM tbl_settled_currency WHERE deposit_currency = ?";
          result = await mysqlcon(sql,[currency]);
        }
  
        if(result.length !== 0){
          res.status(200).json({
            message: `Data for ${(merchant_id && currency === undefined)?`merchant id ${merchant_id}`:currency?`currency ${currency}`:''}`,
            data:result
          })
        }else{
          res.status(201).json({
            message: "Not data Found",
            data:result
          })
        }
      } catch (error) {
        console.log(error)
        res.status(500).json({
          message: "error occurered",
          error: error
      })
    }
    }

    // header error
    async toggleSettlement(req: AuthenticatedRequest,res:Response):Promise<void>{
      try {
        let {id} = req.body;
        let {group_id} = req.user;

        let sql="";

        let sqlCheck = "SELECT status FROM tbl_settlement WHERE id = ?";
        let resultCheck = await mysqlcon(sqlCheck,[id]);
          // SubAdmin
        if(group_id === 2){
          if(resultCheck.length !== 0){

            if(resultCheck[0].status !== 1 && resultCheck[0].status !== 2){
              sql += "UPDATE tbl_settlement SET status = 2 WHERE id = ?";
            }else{
              res.status(200).json({
                  message:`Already Status Updated to ${resultCheck[0].status === 2 ? '2 by SubAdmin':resultCheck[0].status === 1 ? '1 by SuperAdmin':''}`,
                
                })
              }
          }
        }
          
        // SuperAdmin
        if(group_id === 1){
  
          if(resultCheck.length !== 0){

            if(resultCheck[0].status !== 1){
              sql += "UPDATE tbl_settlement SET status = 1 WHERE id = ?";
            }else{
                res.status(200).json({
                  message:`Status is Already ${resultCheck[0].status === 1 ? 'updated to 1 by SuperAdmin':''}`
              })
            }
          }
        }
        
        let result = await mysqlcon(sql,[id]);
            
        if(result.affectedRows > 0){
          res.status(200).json({
            message:`Settlement Approved  ${group_id === 1 ? 'to 2 by SuperAdmin': group_id === 2 ? ' to 1 by SubAdmin':''} `,
            data: result        
          })
        }
        else{
          res.status(201).json({
            message:`No Record Found`,
            data: result  
          })
        }  
      } catch (error) {
        console.log(error);
          res.status(500).json({
            message: "error occurered",
            error: error
        })
      }
    }

}


export default new settlement
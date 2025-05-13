import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';

const currentUTC = new Date();
const istOffset = 5.5 * 60 * 60 * 1000; 
const istTime = new Date(currentUTC.getTime() + istOffset);
const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');

interface defaultResponse{
    to?:any, 
    from?:any, 
    searchVal?:any
    date? : any
}

interface readRequset{
    value?: string
}

interface readUpdateRequest{
    id? : string
    type? : string
}

interface UpdateBankCodeRequestBody {
    id?: number;
    type?: string;
    akontocode?: string;
    payment_gate?: number;
    bank_services_charge?: string;
    title?: string;
    code?: string;
    branch_code?: string;
    branch_name?: string;
    mer_no?: number[];
}

interface deleteRequest{
    id? : string
    akontocode? : string
}

interface ToggleBankCodeRequestBody {
    id: number;
    status: string; 
    akontocode: string;
}

interface merchantRequest{
    code_id?: string, 
    akontocode? : string
    type? : string
}

interface UpdateGateRequest {
    merNo?: string;
    akontocode?: string;
    type?: number;
    pre?: string[];
    values?: string[];
  }


class bankCode{

    async readBankCode(req:Request<defaultResponse>,res:Response):Promise<void>{
        let pagination = (total: number, page: number, limit: number) => {
            let numOfPages = Math.ceil(total / limit);
            let start = page * limit - limit;
            return { limit, start, numOfPages };
        };

        try {
            let {searchVal, date, to, from} = req.body;
            let sql = "select count (*) as Total from tbl_akonto_banks_code";
            let sqlCount =
            "select count (*) as Total FROM tbl_akonto_banks_code WHERE title  LIKE '%" +
            searchVal +
            "%' OR  code  LIKE '%" +
            searchVal +
            "%'";
            let sqlDate = "SELECT count (*) AS Total FROM tbl_akonto_banks_code WHERE Date(created_on) = ?" ;
            let sqlToFrom = "SELECT count (*) AS Total FROM tbl_akonto_banks_code WHERE Date(created_on) >= ? AND Date(created_on) <= ?"

            let result = await mysqlcon(searchVal ? sqlCount: date ? sqlDate: to && from ? sqlToFrom  : sql,  date ? [date] : to && from ? [from, to] :"");
            let total = result[0].Total;
            let page = req.body.page ? Number(req.body.page) : 1;
            let limit = req.body.limit ? Number(req.body.limit) : 10;
            let { start, numOfPages } = pagination(total, page, limit);
            

            let sql1 = "SELECT tbl_akonto_banks_code.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_akonto_banks_code ORDER BY created_on DESC LIMIT ?,?";
            let sql2 =
            "SELECT tbl_akonto_banks_code.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_akonto_banks_code WHERE title  LIKE '%" +
            searchVal +
            "%' OR  code  LIKE '%" +
            searchVal +
            "%'  LIMIT ?,?";
            let sql_Date = "SELECT tbl_akonto_banks_code.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_akonto_banks_code WHERE Date(created_on) = ? ORDER BY created_on DESC limit ?,?";
            let sql_tofrom = "SELECT tbl_akonto_banks_code.*, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_akonto_banks_code WHERE Date(created_on) >= ? AND Date(created_on) <= ? ORDER BY created_on DESC limit ?,?"

            let result1 = await mysqlcon(searchVal ? sql2: date? sql_Date: to && from? sql_tofrom : sql1, date? [date, start, limit] : to && from ? [from, to, start, limit]: [start, limit]);

            let startRange = start + 1;
            let endRange = start + result1.length;

            res.status(200).json({
            message: result1.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
            currentPage: page,
            totalPages: numOfPages,
            pageLimit: limit,
            data: result1,
            });
        } catch (error) {
            res.status(500).json({
            message: "error occurered",
            error: error,
            });
        }
    }

    async merchantSelect(req:Request,res:Response):Promise<void>{
        try {
            let sql = "SELECT id as value, CONCAT('(', id, ') ', name) as label from tbl_user WHERE status = 1 AND complete_profile = 1"
            let result = await mysqlcon(sql)
            res.status(200).json({
                result
            });
            } catch (error) {
            res.status(500).json({
                message: "error occurered",
                error: error,
            });
        }
    }

    async readType1BankCode(req:Request<readRequset>,res:Response):Promise<void>{
        try {
            let {value} = req.body
            let type;
            if(value === "10"){
                type = 1
                let sql = `SELECT id ,gateway_name FROM payment_gateway WHERE type = ${type}`;
                let result = await mysqlcon(sql);
                res.status(200).json({
                    data: result,
                });
            } else {
                type = 0
                let sql = `SELECT id ,gateway_name FROM payment_gateway WHERE type = ${type}`;
                let result = await mysqlcon(sql);
                res.status(200).json({
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
    
    async  readType2BankCode(req: Request<{}, {}, readRequset>,res: Response): Promise<void> {
        try {
            const { value } = req.body;

            if (!value) {
            res.status(400).json({ message: "Missing 'value' in request body" });
            return;
            }

            const valuesArray: string[] = value.split(',').map((v) => v.trim());

            if (!valuesArray.length) {
                res.status(400).json({ message: "No valid types provided" });
                return;
            }

            const placeholders = valuesArray.map(() => '?').join(',');
            const sql = `SELECT code, title FROM tbl_akonto_banks_code WHERE type IN (${placeholders})`;
            const result = await mysqlcon(sql, valuesArray);

            res.status(200).json({
                data:  result,
            });
        } catch (error) {
            console.error("Error in readType2BankCode:", error);
            res.status(500).json({
                message: "An error occurred",
                error
            });
        }
    }

    async  updateBankCode(req: Request<{}, {}, UpdateBankCodeRequestBody>,res: Response): Promise<void> {
      try {
        const {
          id,
          type,
          akontocode,
          payment_gate,
          bank_services_charge,
          title,
          code,
          branch_code,
          mer_no,
          branch_name,
        } = req.body;
    
        if (!id) {
          res.status(400).json({ message: "Kindly Provide Id" });
          return;
        }
    
        const details = {
          type,
          akontocode,
          payment_gate,
          bank_services_charge,
          title,
          code,
          branch_code,
          branch_name,
          updated_on: formattedIST,
        };
    
        const sqlUpdateCode = "UPDATE tbl_code SET ? WHERE id = ?";
        const resultUpdateCode = await mysqlcon(sqlUpdateCode, [details, id]);
    
        if (!resultUpdateCode) {
          res.status(500).json({ message: "Error while updating" });
          return;
        }
    
        if (mer_no && Array.isArray(mer_no)) {
          for (const merchantId of mer_no) {
            const assignData = await mysqlcon(
              "SELECT * FROM tbl_merchant_assign WHERE a_code = ? AND mer_no = ?",
              [akontocode, merchantId]
            );
    
            const codeSql = `SELECT id FROM tbl_code WHERE akontocode = ? AND payment_gate = ?`;
            const codeResult = await mysqlcon(codeSql, [akontocode, payment_gate]);
    
            if (!codeResult.length) continue;
    
            const assignDetails: any = {
              type,
              a_code: akontocode,
              b_code: code,
              mer_no: merchantId,
              code_id: codeResult[0].id,
              updated_on: formattedIST,
            };
    
            if (assignData.length > 0) {
              const sqlAssignUpdate =
                "UPDATE tbl_merchant_assign SET ? WHERE a_code = ? AND mer_no = ?";
              await mysqlcon(sqlAssignUpdate, [assignDetails, akontocode, merchantId]);
            } else {
              assignDetails.created_on = formattedIST;
              const sqlAssignInsert = "INSERT INTO tbl_merchant_assign SET ?";
              await mysqlcon(sqlAssignInsert, [assignDetails]);
            }
    
            // Update tbl_user bankId
            const sqlSelectUser = "SELECT bankId FROM tbl_user WHERE id = ?";
            const resultSelectUser = await mysqlcon(sqlSelectUser, [merchantId]);
    
            let bankIdArray: string[] = [];
    
            if (resultSelectUser.length > 0 && resultSelectUser[0].bankId) {
              bankIdArray = resultSelectUser[0].bankId
                .split(",")
                .map((item: string) => item.trim());
            }
    
            if (!bankIdArray.includes(akontocode as string)) {
              bankIdArray.push(akontocode as string);
            }
    
            const bankIdString = bankIdArray.join(", ");
            const sqlUpdateUser = "UPDATE tbl_user SET bankId = ? WHERE id = ?";
            await mysqlcon(sqlUpdateUser, [bankIdString, merchantId]);
          }
        }
    
        res.status(200).json({
          message: "Bankcodes Updated ✅",
        });
      } catch (error) {
        console.error("Error in updateBankCode:", error);
        res.status(500).json({
          message: "Error occurred",
          error: error instanceof Error ? error.message : error,
        });
      }
    }
    
    async readUpdateBankCode(req:Request<readUpdateRequest>,res:Response):Promise<void>{
        try {
            let { id, type } = req.body;
            let sql = `SELECT payment_gateway.id AS gateway_name, GROUP_CONCAT(tbl_merchant_assign.mer_no) AS merNo, tbl_code.id AS identification, tbl_code.status AS status2, tbl_code.type AS type2, tbl_code.bank_services_charge, tbl_code.title, tbl_code.code, tbl_code.akontocode, tbl_code.branch_code, tbl_code.branch_name FROM tbl_code LEFT JOIN payment_gateway ON tbl_code.payment_gate = payment_gateway.id LEFT JOIN tbl_merchant_assign ON tbl_code.akontocode = tbl_merchant_assign.a_code WHERE tbl_code.type IN (${type}) AND tbl_code.id = ? GROUP BY tbl_code.id, tbl_code.status, tbl_code.type, tbl_code.bank_services_charge, tbl_code.title, tbl_code.code, tbl_code.akontocode, tbl_code.branch_code, tbl_code.branch_name`;
            
            let result = await mysqlcon(sql, [id]);
            res.status(200).json({
                data: result[0],
            });
            } catch (error) {
            res.status(500).json({
                message: "error occurered",
                error: error,
            });
        }
    }

    async deleteBankCode(req:Request<{},{},deleteRequest>,res:Response):Promise<void>{
        try {
            let { id, akontocode } = req.body;
            let sql = "DELETE FROM tbl_code WHERE id = ?";
            let result = await mysqlcon(sql, [id]);
            if (result) {
                let sqlSelect = "SELECT mer_no from tbl_merchant_assign WHERE a_code = ?";
                let resultData = await mysqlcon(sqlSelect, [akontocode]);
                let merNos = resultData.map((item: { mer_no: any; }) => item.mer_no);
                
                for (let i = 0; i < merNos.length; i++) {
                    let mer_no = merNos[i];
                    let sqlSelectUser = "SELECT bankId from tbl_user WHERE id = ?";
                    let resultUser = await mysqlcon(sqlSelectUser, [mer_no]);
                    let bankIdArray = resultUser[0].bankId.split(',').map((item: string) => item.trim());
                
                    if (bankIdArray.includes(akontocode)) {
                        bankIdArray = bankIdArray.filter((item: string) => item !== akontocode);
                        let updatedBankIdString = bankIdArray.join(', ');
                        let sqlUpdate = "UPDATE tbl_user SET bankId = ? WHERE id = ?";
                        await mysqlcon(sqlUpdate, [updatedBankIdString, mer_no]);
                    }
                }

                let sqlDelete = "DELETE FROM tbl_merchant_assign WHERE a_code = ?";
                let resultDelete = await mysqlcon(sqlDelete, [akontocode]);
                res.status(200).json({
                    message: "Delete Successfully✅",
                });
            } else {
                res.status(201).json({
                message: "Error while Deleting",
                });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "error occurred",
                error: error,
            });
        }
    }

    async createBankCode(req:Request,res:Response):Promise<void>{
          try {
            
            let { type, akontocode, payment_gate, bank_services_charge, title, code, branch_code, mer_no, branch_name } = req.body;
            let details = {
              type,
              akontocode,
              payment_gate,
              bank_services_charge,
              title,
              code,
              branch_code,
              branch_name,
              created_on: formattedIST,
              updated_on: formattedIST
            };
            let sql = "INSERT INTO tbl_code SET ?";
            let result = await mysqlcon(sql, [details]);
        
            for (let i = 0; i < mer_no.length; i++) {
              let codeSql = `SELECT id FROM tbl_code WHERE akontocode = '${akontocode}' AND payment_gate = ${payment_gate}`;
              let codeResult = await mysqlcon(codeSql)
              // return res.send(codeResult[0].id)
              let assignDetails = {
                type: type,
                a_code: akontocode,
                b_code: code,
                mer_no: mer_no[i],
                code_id: codeResult[0].id,
                created_on: formattedIST,
                updated_on: formattedIST
              };
              let sqlAssign = "INSERT INTO tbl_merchant_assign SET ?";
              await mysqlcon(sqlAssign, [assignDetails]);
        
              let sqlSelect = "SELECT bankId from tbl_user WHERE id = ?";
              let resultSelect = await mysqlcon(sqlSelect, [mer_no[i]]);
        
              let bankIdArray = resultSelect[0].bankId.split(',').map((item: string) => item.trim());
        
              if (!bankIdArray.includes(akontocode)) {
                bankIdArray.push(akontocode);
              }
        
              let bankIdString = bankIdArray.join(', ');
        
              // Update the tbl_user table with the modified bankId values
              let sqlUpdate = "UPDATE tbl_user SET bankId = ? WHERE id = ?";
              await mysqlcon(sqlUpdate, [bankIdString, mer_no[i]]);
              // let currency = `SELECT * FROM tbl_akonto_banks_code WHERE code = '${akontocode}'`
              // let curRes = await mysqlcon(currency)
              // if (curRes.length > 0) {
              //   let currenciesArray = curRes[0].currencies.split(',');
              //   for (let j = 0; j < currenciesArray.length; j++) {
              //     if(type === "10"){
              //       let currency = currenciesArray[j].trim();
              //       let gatewaySql = `SELECt * FROM payout_gateway_detail WHERE merNo = ${mer_no[i]} AND currency = '${currency}' AND type = ${type}`;
              //       let gatewayResult = await mysqlcon(gatewaySql);
              //       if(gatewayResult.length > 0){
              //         let sqlU = `UPDATE payout_gateway_detail SET gatewayNo = ${payment_gate} WHERE merNo = ${mer_no[i]} AND currency = '${currency}' AND type = ${type}`;
              //         await mysqlcon(sqlU, [details]);
              //       } else {
              //         let detail = {
              //           merNo: mer_no[i],
              //           gatewayNo: payment_gate,
              //           currency: currency,
              //           type: type
              //         };
              //         let sqlC = "INSERT INTO payout_gateway_detail SET ?";
              //         await mysqlcon(sqlC, [detail]);
              //       }
              //     } else {
              //       let currency = currenciesArray[j].trim();
              //       let gatewaySql = `SELECt * FROM gateway_detail WHERE merNo = ${mer_no[i]} AND currency = '${currency}' AND type = ${type}`;
              //       let gatewayResult = await mysqlcon(gatewaySql);
              //       if(gatewayResult.length > 0){
              //         let sqlU = `UPDATE gateway_detail SET gatewayNo = ${payment_gate} WHERE merNo = ${mer_no[i]} AND currency = '${currency}' AND type = ${type}`;
              //         await mysqlcon(sqlU, [details]);
              //       } else {
              //         let detail = {
              //           merNo: mer_no[i],
              //           gatewayNo: payment_gate,
              //           currency: currency,
              //           type: type
              //         };
              //         let sqlC = "INSERT INTO gateway_detail SET ?";
              //         await mysqlcon(sqlC, [detail]);
              //       }
              //     }
              //   }
              // }
            }
            if (result) {
                res.status(200).json({
                    message: "Bankcodes Added✅",
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

    async  toggleBankCode(req: Request<{}, {}, ToggleBankCodeRequestBody>,res: Response): Promise<void> {
      try {
        const { id, status, akontocode } = req.body;
    
        // Update the status in tbl_code
        const updateCodeSql = "UPDATE tbl_code SET status = ? WHERE id = ?";
        await mysqlcon(updateCodeSql, [status, id]);
    
        // Get all merchant IDs assigned to the code
        const merchantQuery = `SELECT mer_no FROM tbl_merchant_assign WHERE a_code = ?`;
        const codeResult = await mysqlcon(merchantQuery, [akontocode]);
        const merNumbers: number[] = codeResult.map((result: any) => result.mer_no);
    
        if (status === "1") {
          // Enabling
          for (const merId of merNumbers) {
            const selectUserSql = "SELECT bankId FROM tbl_user WHERE id = ?";
            const userResult = await mysqlcon(selectUserSql, [merId]);
    
            let bankIdArray: string[] = [];
            if (userResult.length && userResult[0].bankId) {
              bankIdArray = userResult[0].bankId.split(",").map((item: string) => item.trim());
            }
    
            if (!bankIdArray.includes(akontocode)) {
              bankIdArray.push(akontocode);
            }
    
            const updatedBankIds = bankIdArray.join(", ");
            const updateUserSql = "UPDATE tbl_user SET bankId = ? WHERE id = ?";
            await mysqlcon(updateUserSql, [updatedBankIds, merId]);
    
            const updateAssignSql = "UPDATE tbl_merchant_assign SET status = ? WHERE a_code = ?";
            await mysqlcon(updateAssignSql, [status, akontocode]);
          }
    
          res.status(200).json({
            message: "Status Enabled Successfully ✅",
          });
    
        } else {
          // Disabling
          for (const merId of merNumbers) {
            const selectUserSql = "SELECT bankId FROM tbl_user WHERE id = ?";
            const userResult = await mysqlcon(selectUserSql, [merId]);
    
            let bankIdArray: string[] = [];
            if (userResult.length && userResult[0].bankId) {
              bankIdArray = userResult[0].bankId.split(",").map((item: string) => item.trim());
            }
    
            if (bankIdArray.includes(akontocode)) {
              bankIdArray = bankIdArray.filter((item) => item !== akontocode);
              const updatedBankIds = bankIdArray.join(", ");
    
              const updateUserSql = "UPDATE tbl_user SET bankId = ? WHERE id = ?";
              await mysqlcon(updateUserSql, [updatedBankIds, merId]);
    
              const updateAssignSql = "UPDATE tbl_merchant_assign SET status = ? WHERE a_code = ?";
              await mysqlcon(updateAssignSql, [status, akontocode]);
            }
          }
    
          res.status(200).json({
            message: "Status Disabled Successfully ✅",
          });
        }
    
      } catch (error) {
        console.error("Error in toggleBankCode:", error);
        res.status(500).json({
          message: "Error occurred",
          error
        });
      }
    }    

    async merchantData(req:Request<{},{},merchantRequest>,res:Response):Promise<void>{
          try {
            let { code_id, akontocode } = req.body;
            // console.log(req.body);
            let sql = "SELECT tbl_user.name, tbl_merchant_assign.* FROM tbl_merchant_assign INNER JOIN tbl_user ON tbl_user.id = tbl_merchant_assign.mer_no WHERE tbl_merchant_assign.code_id = ?";
            let result = await mysqlcon(sql, [code_id]);
        
            let paymentGate = await mysqlcon(`SELECT payment_gate FROM tbl_code WHERE akontocode = '${akontocode}'`);
            let gateway = paymentGate[0].payment_gate;
            let currency = `SELECT currencies FROM tbl_akonto_banks_code WHERE code = '${akontocode}'`;
            let curResult = await mysqlcon(currency);
            const currenciesArray = curResult[0].currencies.split(',');
            const transformedResult = currenciesArray.map((currency: string, index: any) => ({
              label: currency.trim(),
              value: currency.trim()
            }));
        
            // Loop through result array
            for (const entry of result) {
              // Create an array to store chosen currencies for each mer_no
              entry.currencies = [];
        
              // Loop through currenciesArray for each mer_no
              for (const currency of currenciesArray) {
                if(req.body.type === "10"){
                  const currenciesString = `'${currency}'`;
                  let payin_details = await mysqlcon(
                    `SELECT * FROM payout_gateway_detail WHERE merNo = ${entry.mer_no} AND gatewayNo = '${gateway}' AND type = '${entry.type}' AND currency = ${currenciesString}`
                  );
        
                  // Check if payin_details is not empty before adding to the currencies array
                  if (payin_details.length > 0) {
                    entry.currencies.push(currency);
                  }
                } else {
                  const currenciesString = `'${currency}'`;
                  let payin_details = await mysqlcon(
                    `SELECT * FROM gateway_detail WHERE merNo = ${entry.mer_no} AND gatewayNo = '${gateway}' AND type = '${entry.type}' AND currency = ${currenciesString}`
                  );
        
                  // Check if payin_details is not empty before adding to the currencies array
                  if (payin_details.length > 0) {
                    entry.currencies.push(currency);
                  }
                }
              }
            }
            res.status(200).json({
              result,
              transformedResult,
              gateway
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
              message: "error occurred",
              error: error,
            });
        }
    }

    async  update_gateway(req: Request<{}, {}, UpdateGateRequest>,res: Response): Promise<void> {
      try {
        const { merNo, akontocode, type, pre = [], values = [] } = req.body;
    
        if (!merNo || !akontocode || type === undefined || !Array.isArray(pre) || !Array.isArray(values)) {
           res.status(400).json({ message: "Invalid request body" });
        }
    
        // Get gateway number
        const paymentGate = await mysqlcon(
          `SELECT payment_gate FROM tbl_code WHERE akontocode = ?`,
          [akontocode]
        );
    
        if (!paymentGate.length) {
           res.status(404).json({ message: "Gateway not found" });
        }
    
        const gateway = paymentGate[0].payment_gate;
    
        // Get existing gateway details
        const tableName = type === 10 ? "payout_gateway_detail" : "gateway_detail";
        const existingGatewayDetails = await mysqlcon(
          `SELECT * FROM ${tableName} WHERE merNo = ? AND type = ? AND gatewayNo = ? AND currency IN (?)`,
          [merNo, type, gateway, pre]
        );
    
        // Filter out currencies not in 'values' list for deletion
        const currenciesToDelete = existingGatewayDetails.filter(
          (detail: any) => !values.includes(detail.currency)
        );
    
        for (const currencyToDelete of currenciesToDelete) {
          const deleteSql = `DELETE FROM ${tableName} WHERE merNo = ? AND currency = ? AND type = ? AND gatewayNo = ?`;
          const deleteResult = await mysqlcon(deleteSql, [merNo, currencyToDelete.currency, type, gateway]);
    
          if (deleteResult.affectedRows > 0) {
            console.log(`Deleted ${currencyToDelete.currency} for merNo ${merNo}`);
          } else {
            console.warn(`Failed to delete ${currencyToDelete.currency}`);
          }
        }
    
        // Add new bank codes if not already present
        for (const currency of values) {
          const checkSql = `SELECT * FROM ${tableName} WHERE merNo = ? AND currency = ? AND type = ? AND gatewayNo = ?`;
          const checkResult = await mysqlcon(checkSql, [merNo, currency, type, gateway]);
    
          if (checkResult.length === 0) {
            const insertDetail = {
              merNo,
              gatewayNo: gateway,
              currency,
              type,
            };
    
            const insertSql = `INSERT INTO ${tableName} SET ?`;
            const insertResult = await mysqlcon(insertSql, [insertDetail]);
    
            if (insertResult.affectedRows > 0) {
              console.log(`Added ${currency} for merNo ${merNo}`);
            } else {
              console.warn(`Failed to add ${currency}`);
            }
          }
        }
    
        res.status(200).json({
          message: "Gateway update process completed ✅",
        });
      } catch (error) {
        console.error("update_gateway error:", error);
        res.status(500).json({
          message: "Error occurred",
          error
        });
      }
    }
    
    async  toggleMerchantBankCodes(req: Request, res: Response): Promise<void> {
      try {
        const { id, status, akontocode } = req.body;
    
        if (!id || status === undefined || !akontocode) {
           res.status(400).json({ message: "Invalid request body" });
        }
    
        // Update merchant assign status
        const updateMerchantAssignSql = "UPDATE tbl_merchant_assign SET status = ? WHERE id = ?";
        const result = await mysqlcon(updateMerchantAssignSql, [status, id]);
    
        if (!result || result.affectedRows === 0) {
           res.status(500).json({ message: "Error while updating merchant assignment" });
        }
    
        // Fetch mer_no
        const selectMerSql = "SELECT mer_no FROM tbl_merchant_assign WHERE id = ?";
        const merResult = await mysqlcon(selectMerSql, [id]);
    
        if (!merResult.length) {
           res.status(404).json({ message: "Merchant not found" });
        }
    
        const mer_no = merResult[0].mer_no;
    
        // Fetch user's bankId
        const selectUserSql = "SELECT bankId FROM tbl_user WHERE id = ?";
        const userResult = await mysqlcon(selectUserSql, [mer_no]);
    
        if (!userResult.length) {
           res.status(404).json({ message: "User not found" });
        }
    
        let bankIdArray: string[] = userResult[0].bankId
          ? userResult[0].bankId.split(',').map((item: string) => item.trim())
          : [];
    
        if (status === "0") {
          // Disable: remove the akontocode
          bankIdArray = bankIdArray.filter(item => item !== akontocode);
          const updatedBankIdString = bankIdArray.join(', ');
          await mysqlcon("UPDATE tbl_user SET bankId = ? WHERE id = ?", [updatedBankIdString, mer_no]);
    
            res.status(200).json({ message: "Bankcodes Disabled Successfully ✅" });
        } else {
          // Enable: add the akontocode if not present
          if (!bankIdArray.includes(akontocode)) {
            bankIdArray.push(akontocode);
          }
          const bankIdString = bankIdArray.join(', ');
          await mysqlcon("UPDATE tbl_user SET bankId = ? WHERE id = ?", [bankIdString, mer_no]);
    
            res.status(200).json({ message: "Bankcodes Enabled Successfully ✅" });
        }
      } catch (error) {
        console.error("toggleMerchantBankCodes error:", error);
        res.status(500).json({
          message: "An error occurred",
          error: error instanceof Error ? error.message : error,
        });
      }
    }

}

export default new bankCode



// Request<{}, {}, ReadRequestBody>
// Request<Params, ResBody, ReqBody> — You only care about the body, so we use:
import { Request, Response } from 'express';
import mysqlcon from '../../config/db_connection';

let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;


interface EditLimitRequestBody {
  id: number;
  user_id: number;
  gateway: string;
  currency: string;
  type: string;
  bank_codes: { bank_codes: string }[];
}
interface UpdateBankLimitRequest extends Request {
  body: {
    min: number;
    max: number;
    bank_code: string;
  };
  user?: {
    user_id: number;
  };
}
interface CreateLimitRequestBody {
  user_id: number;
  gateway: string;
  currency: string;
  type: string;
  bank_codes: string[];
  created_on: string;
  updated_on: string;
}
interface DefaultSetLimitRequestBody {
  to?: string;
  from?: string;
  date?: string;
  page?: number;
  limit?: number;
}


class LimitsTS{
  
async readBankLimit (req: Request, res: Response): Promise<void> {
   try {
    const { bankIds } : { bankIds:string }= req.body;

if (!bankIds) {
   res.status(400).json({ message: "bankIds is required" });
}
const sql = `SELECT tbl_akonto_banks_code.title, tbl_set_limit.* FROM tbl_set_limit  LEFT JOIN tbl_akonto_banks_code ON tbl_akonto_banks_code.code = tbl_set_limit.bank_codes WHERE tbl_set_limit.bankIds = ?`;

const result = await mysqlcon(sql, [bankIds]);
if(result.length>0){
res.status(200).json({
message: "Data read successfully",
data: result,
});
}else{
  res.json({
message: "data not found"
  })
  
}
} catch (error) {
console.error(error);
res.status(500).json({
message: "An error occurred",
error,
});
}
 }

async toggleLimit (req: Request, res: Response): Promise<void> {
  try {
    const { status, id }: { status: string; id: number } = req.body;

    const sql = "UPDATE tbl_set_limit SET status = ? WHERE id = ?";
    const result = await mysqlcon(sql, [status, id]);

    if (result.affectedRows > 0) {
      res.status(200).json({
        message: `Bankcodes ${status === "1" ? "Enabled" : "Disabled"} Successfully`,
        data: result,
        
      });
    } else {
      res.status(201).json({
        message: "Error while Changing Status",
        data: result,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      message: "Error occurred",
      error: error.message || error,
    });
  }


}

async selectBank  (req: Request, res: Response): Promise<void> {
  try {
    const { gatewayNo, currency, type }: { gatewayNo: string; currency: string; type: string } = req.body;

    const sql = `
      SELECT tbl_code.title AS label, tbl_code.akontocode 
      FROM tbl_code 
      JOIN tbl_akonto_banks_code 
      ON tbl_code.akontocode = tbl_akonto_banks_code.code 
      WHERE tbl_code.payment_gate = ? 
      AND FIND_IN_SET(?, tbl_akonto_banks_code.currencies) 
      AND tbl_code.type = ?
    `;

    const result: { label: string; akontocode: string }[] = await mysqlcon(sql, [gatewayNo, currency, type]);

    if (result.length > 0) {
      const finalResult = result.map((item) => ({
        label: item.label.trim(),
        value: item.akontocode.trim(),
      }));

      res.status(200).json({
        
        finalResult });
    } else {
      res.status(200).json({ message: "No banks" });
    }
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || err });
  }
};

async allCurrency  (req: Request, res: Response): Promise<void> {
  try{
      
     let  sql = "SELECT sortname FROM countries WHERE status = 1"
      let result = await mysqlcon(sql);
  
      res.status(200).json({
        message:"data fetch successfully",
          Data:result
      })
  
  }
  catch(err){
    console.log(err)
      res.status(500).json({
          message:"Server Error",
          err,
      })
  }
  
};

async readOneLimit  (req: Request, res: Response): Promise<void> {
  try {
    const { id }: { id: number } = req.body;

    if (!id) {
      res.status(400).json({ message: "'id' is required in the request body" });
      return;
    }

    const sql = ` SELECT  payment_gateway.gateway_name, tbl_akonto_banks_code.title, tbl_user.name, tbl_set_limit.* FROM tbl_set_limit LEFT JOIN tbl_user ON tbl_set_limit.user_id = tbl_user.id LEFT JOIN payment_gateway ON tbl_set_limit.gateway = payment_gateway.gateway_number LEFT JOIN tbl_akonto_banks_code ON tbl_akonto_banks_code.code = tbl_set_limit.bank_codes WHERE tbl_set_limit.bankIds = ? `;

    const result: any[] = await mysqlcon(sql, [id]);

    if (!result || result.length === 0) {
      res.status(404).json({ message: "No record found for the provided ID" });
      return;
    }

    const bankCodes = result
      .filter(row => row.title && row.bank_codes)
      .map(row => ({
        label: row.title.trim(),
        value: row.bank_codes.trim()
      }));

    res.status(200).json({
      message: "data read successfully",
      result: result[0],
      bankCodes
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while reading limit data.",
      error: error.message || error
    });
  }

}
// async editLimit (req: Request, res: Response): Promise<void>{
//   try {
//     const {id,user_id,gateway, currency, type,bank_codes }: EditLimitRequestBody = req.body;

//     if (!id || !user_id || !gateway || !currency || !type || !Array.isArray(bank_codes)) {
//       res.status(400).json({ message: "Missing or invalid fields in request body" });
//       return;
//     }

//     const existingData: any[] = await mysqlcon(`SELECT * FROM tbl_set_limit WHERE bankIds = ?`,[id]);

//     const frontEndBankCodes = bank_codes.map(code => code.bank_codes);
//     const existingBankCodes = existingData.map(data => data.bank_codes);

//     const newBankCodes = frontEndBankCodes.filter(code => !existingBankCodes.includes(code));

//     let isOtherFieldChanged = existingData.some(data =>
//       data.user_id !== user_id ||
//       data.gateway !== gateway ||
//       data.currency !== currency ||
//       data.type !== type
//     );

//     for (const code of newBankCodes) {
//       await mysqlcon(
//         `INSERT INTO tbl_set_limit (user_id, gateway, currency, type, bank_codes, bankIds) VALUES (?, ?, ?, ?, ?, ?)`,
//         [user_id, gateway, currency, type, code, id]
//       );
//     }

//     for (const code of existingBankCodes) {
//       if (!frontEndBankCodes.includes(code)) {
//         await mysqlcon(
//           `DELETE FROM tbl_set_limit WHERE bankIds = ? AND bank_codes = ?`,
//           [id, code]
//         );
//       }
//     }

//     if (isOtherFieldChanged) {
//       await mysqlcon(
//         `UPDATE tbl_set_limit SET user_id = ?, gateway = ?, currency = ?, type = ? WHERE bankIds = ?`,
//         [user_id, gateway, currency, type, id]
//       );
//     }

//     res.status(200).json({
//       message: "Limits updated successfully",
     
//     });
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({
//       message: "An error occurred",
//       error: error.message || error
//     });
//   }


// }
// request body
//   "id": 12387, 
//   "user_id": 62,
//   "gateway": "GW01",
//   "currency": "INR",
//   "type": "PAYOUT",
//   "bank_codes": [
//     { "bank_codes": "SBIN0001000" },
//     { "bank_codes": "HDFC0002" }
//   ]
// }
async  editLimit(req: Request, res: Response): Promise<void> {
  try {
    const { id, user_id, gateway, currency, type, bank_codes }: EditLimitRequestBody = req.body;

    if (!id || !user_id || !gateway || !currency || !type || !Array.isArray(bank_codes)) {
      res.status(400).json({ message: "Missing or invalid fields in request body" });
      return;
    }

    const existingData: any[] = await mysqlcon(`SELECT * FROM tbl_set_limit WHERE bankIds = ?`, [id]);

    const frontEndBankCodes = bank_codes.map(code => code.bank_codes);
    const existingBankCodes = existingData.map(data => data.bank_codes);

    const newBankCodes = frontEndBankCodes.filter(code => !existingBankCodes.includes(code));

    const isOtherFieldChanged = existingData.some(data =>
      data.user_id !== user_id ||
      data.gateway !== gateway ||
      data.currency !== currency ||
      data.type !== type
    );

    for (const code of newBankCodes) {
      await mysqlcon(
        `INSERT INTO tbl_set_limit (user_id, gateway, currency, type, bank_codes, bankIds) VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, gateway, currency, type, code, id]
      );
    }

    for (const code of existingBankCodes) {
      if (!frontEndBankCodes.includes(code)) {
        await mysqlcon(
          `DELETE FROM tbl_set_limit WHERE bankIds = ? AND bank_codes = ?`,
          [id, code]
        );
      }
    }

    if (isOtherFieldChanged) {
      await mysqlcon(
        `UPDATE tbl_set_limit SET user_id = ?, gateway = ?, currency = ?, type = ? WHERE bankIds = ?`,
        [user_id, gateway, currency, type, id]
      );
    }

    // Fetch updated data
    const updatedData: any[] = await mysqlcon(
      `SELECT payment_gateway.gateway_name, tbl_akonto_banks_code.title, tbl_user.name, tbl_set_limit.* 
       FROM tbl_set_limit 
       LEFT JOIN tbl_user ON tbl_set_limit.user_id = tbl_user.id 
       LEFT JOIN payment_gateway ON tbl_set_limit.gateway = payment_gateway.gateway_number 
       LEFT JOIN tbl_akonto_banks_code ON tbl_akonto_banks_code.code = tbl_set_limit.bank_codes 
       WHERE tbl_set_limit.bankIds = ?`,
      [id]
    );

    const formattedBankCodes = updatedData.map(row => ({
      label: row.title?.trim(),
      value: row.bank_codes?.trim()
    })).filter(entry => entry.label && entry.value);

    res.status(200).json({
      message: "Limits updated successfully",
      result: updatedData[0], // or return all with updatedData
      bankCodes: formattedBankCodes
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred",
      error: error.message || error
    });
  }
}
async  updateBankLimit(req: UpdateBankLimitRequest, res: Response): Promise<void>  {
  try {
    const { min, max, bank_code } = req.body;
    const createdName = req.user?.user_id;

    if (!bank_code || createdName === undefined) {
      res.status(400).json({ message: "Missing required fields." });
      return;
    }

    const details = { min, max };

    const sql = "UPDATE tbl_set_limit SET ?, limit_updatedby = ? WHERE bank_codes = ?";
    const result: any = await mysqlcon(sql, [details, createdName, bank_code]);

    if (result.affectedRows > 0) {
      res.status(200).json({
        message: "Data Updated ✅",
        data:result
      });
    } else {
      res.status(404).json({
        message: "No matching record found to update.",
      });
    }

  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Error occurred",
      error: error.message || error,
    });
  }



}
async createLimit (req: Request, res: Response): Promise<void>  {
  try {
    const {user_id,gateway,currency,type,bank_codes,}: CreateLimitRequestBody = req.body;

    if (!user_id || !gateway || !currency || !type || !Array.isArray(bank_codes)) {
      res.status(400).json({ message: "Missing or invalid request parameters" });
      return;
    }

    const detailsList = bank_codes.map(code => ({
      user_id: String(user_id),
      gateway: String(gateway),
      currency: String(currency),
      type: String(type),
      bank_codes: String(code),
      created_on: dateTime,
      updated_on: dateTime,
    }));

    const createdName = (req as any).user.user_id; // Typecast to access `req.user`

    const insertSql = "INSERT INTO tbl_set_limit SET ?";
    const insertResults = await Promise.all(
      detailsList.map(details => mysqlcon(insertSql, [details]))
    );

    const firstInsertedId = insertResults[0].insertId;
    const insertedIds = insertResults.map(result => result.insertId);

    const updateSql = "UPDATE tbl_set_limit SET bankIds = ?, limit_updatedby = ? WHERE id IN (?)";
    const updateResult = await mysqlcon(updateSql, [firstInsertedId, createdName, insertedIds]);

    if (updateResult) {
      res.status(200).json({
         message: "Limits Set Successfully ✅" ,
         data:detailsList
        });
    } else {
      res.status(201).json({ message: "Error While Setting Limits" });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Error occurred",
      error: error.message || error,
    });
  }

}
async defaultSetLimit (req: Request, res: Response): Promise<void>  {
  try {
    const { to, from, date, page, limit }:DefaultSetLimitRequestBody = req.body;

    const pagination = (total: number, limit: number): number => {
      return Math.ceil(total / limit);
    };

    let sqlQuery = `
      SELECT 
        p.gateway_name, 
        l.currency, 
        l.type, 
        u.name, 
        l.user_id, 
        l.id, 
        u.id AS ID, 
        p.gateway_number, 
        l.gateway, 
        l.min, 
        l.max, 
        GROUP_CONCAT(l.bank_codes) AS bank_codes, 
        l.status, 
        l.bank_codes, 
        l.bankIds, 
        m.mode, 
        DATE_FORMAT(l.created_on, '%Y-%m-%d %H:%i:%s') AS created_on, 
        DATE_FORMAT(l.updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on 
      FROM 
        payment_gateway p 
      JOIN 
        tbl_set_limit l ON p.gateway_number = l.gateway 
      JOIN 
        tbl_user u ON l.user_id = u.id 
      JOIN 
        tbl_mode m ON l.type = m.type
    `;

    const sqlConditions: string[] = [];
    const sqlParams: (string | number)[] = [];

    if (date) {
      sqlConditions.push("DATE(l.created_on) = ?");
      sqlParams.push(date);
    } else if (to && from) {
      sqlConditions.push("DATE(l.created_on) >= ?", "DATE(l.created_on) <= ?");
      sqlParams.push(from, to);
    }

    if (sqlConditions.length > 0) {
      sqlQuery += ` WHERE ${sqlConditions.join(" AND ")}`;
    }

    sqlQuery += ` GROUP BY  p.gateway_name, l.currency, l.type, l.user_id HAVING  l.user_id = u.id  ORDER BY l.created_on DESC`;

    const currentPage = page ? Number(page) : 1;
    const pageLimit = limit ? Number(limit) : 10;

    const start = (currentPage - 1) * pageLimit;

    const result = await mysqlcon(`${sqlQuery} LIMIT ?, ?`, [...sqlParams, start, pageLimit]);

    result.forEach((row: any) => {
      row.bank_codes = row.bank_codes ? row.bank_codes.split(",") : [];
    });

    const startRange = start + 1;
    const endRange = start + result.length;

    const numOfPages = pagination(result.length, pageLimit); // Calculate number of pages based on the result length

    const response = {
      message: `Showing ${startRange} to ${endRange} data from ${result.length}`,
      currentPage,
      totalPages: numOfPages,
      pageLimit,
      totalLength: result.length,
      data: result,
    };

     res.status(200).json(response);
  } catch (error) {
    console.error(error);
     res.status(500).json({
      message: "An error occurred",
      error:error
    });
  }

}
}
export default new LimitsTS
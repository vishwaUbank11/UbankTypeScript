import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';
import Pagination from '../services/pagination';
import md5 from 'md5';

const currentUTC = new Date();
const istOffset = 5.5 * 60 * 60 * 1000; 
const istTime = new Date(currentUTC.getTime() + istOffset);
const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');

interface subAdminRequest{
    to?: string, 
    from?: string, 
    date?: string, 
    searchVal?: string
    limit?: string
    pageNumber? : string
}
interface toogleRequest{
    status?: string, 
    id? : string
}

interface deleteRequest{
    id? : string
}

interface createRequest{
    fname?: string, 
    lname?: string, 
    email?: string, 
    password?: any, 
    role?: string
}

interface updateRequest {
    id?: string;
    fname?: string;
    lname?: string;
    email?: string;
    password?: string;
    role?: string;
}

interface getpermissionReq{
    id? : string
}

interface permissionSubRequest{
    id? : string, 
    actionData? : any, 
    role? : any
}

class subAdmincont{
    async subAdmin(req:Request<{},{},subAdminRequest>,res:Response):Promise<void>{
        try {
            const { to, from, date, searchVal } = req.body;
            let sqlAllCount =
              "select count (*) as Total from tbl_login WHERE group_id != 1";
            let sqCountDate =
              "select count (*) as Total from tbl_login where DATE(created_on) = ?";
            let sqlToFromCount =
              "select count (*) as Total from tbl_login where DATE(created_on)  >= ? AND DATE(created_on) <= ?";
            let sqlSearchCount = "SELECT COUNT(*) as Total FROM tbl_login WHERE ((firstname LIKE '%" + searchVal + "%') OR (lastname LIKE '%" + searchVal + "%') OR (email LIKE '%" + searchVal + "%'))";
        
            let result = await mysqlcon(
                date
              ? sqCountDate
              : to && from
              ? sqlToFromCount
              : searchVal
              ? sqlSearchCount
              : sqlAllCount,
              date ? [date] : to && from ? [from, to] : ""
            );
            let total = result[0].Total;
            let page = req.body.pageNumber ? Number(req.body.pageNumber) : 1;
            let limit = req.body.limit ? Number(req.body.limit) : 10;
            let { start, numOfPages } = Pagination.pagination(
              result[0].Total,
              page,
              limit
            );
        
            let sql =
              "select tbl_login.*, DATE_FORMAT(last_login_date,'%Y-%m-%d %H:%i:%s') AS last_login_date, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_login WHERE group_id != 1 ORDER BY created_on DESC limit ?,?";
            let sqlDate =
              "select tbl_login.*, DATE_FORMAT(last_login_date,'%Y-%m-%d %H:%i:%s') AS last_login_date, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_login where DATE(created_on) = ? ORDER BY created_on DESC limit ?,?";
            let sqlToFrom =
              "select tbl_login.*, DATE_FORMAT(last_login_date,'%Y-%m-%d %H:%i:%s') AS last_login_date, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_login where DATE(created_on)  >= ? AND DATE(created_on) <= ? ORDER BY created_on DESC limit ?,?";
            let sqlSearch = "select tbl_login.*, DATE_FORMAT(last_login_date,'%Y-%m-%d %H:%i:%s') AS last_login_date, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on from tbl_login where ((firstname LIKE '%" + searchVal + "%') OR (lastname LIKE '%" + searchVal + "%') OR (email LIKE '%" + searchVal + "%')) ORDER BY created_on DESC limit ?,?";
        
            const data = await mysqlcon(
              date ? sqlDate : to && from ? sqlToFrom : searchVal ? sqlSearch : sql,
              date
                ? [date, start, limit]
                : to && from
                ? [from, to, start, limit]
                : [start, limit]
            );
        
            let startRange = start + 1;
            let endRange = start + data.length;
            res.status(200).json({
              message: data.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "NO DATA",
              numOfPages,
              result: data,
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong", error });
        }
    }

    async toggleSubAdmin(req:Request<{},{},toogleRequest>,res:Response):Promise<void>{
         try {
           let { status, id } = req.body;
           
           if (status !== "0" && status !== "1") {
                res.status(201).json({
                message: "Status Not Updated",
                });
            }
       
           let sql = "UPDATE tbl_login SET status = ? WHERE user_id = ?";
           let result = await mysqlcon(sql, [status, id]);
       
           if (result.affectedRows > 0) {
                res.status(200).json({
                    message: `Status ${status === "1" ? "Enabled" : "Disabled"} Successfully `,
                    data: result,
                });
            } else {
                res.status(201).json({
                    message: "Error while Changing Status",
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

    async deleteSubAdmin(req:Request<{},{},deleteRequest>,res:Response):Promise<void>{
          try {
            let { id } = req.body;
        
            let sql = "DELETE FROM tbl_login WHERE user_id = ?";
            let result = await mysqlcon(sql, [id]);
        
            if (result.affectedRows > 0) {
                res.status(200).json({
                    message: "SubAdmin Deleted",
                    data: result,
                });
            } else {
                res.status(201).json({
                    message: "Error while Deleting",
                });
            }
        } catch (error) {
            res.status(500).json({
              message: "error occurered",
              error: error,
            });
        }
    }

    async createSubAdmin(req:Request<{},{},createRequest>,res:Response):Promise<void>{
        try {        
            let { fname, lname, email, password, role } = req.body;
        
            let emailCheckSql = "SELECT email FROM tbl_login WHERE email = ?";
            let emailCheckResult = await mysqlcon(emailCheckSql, [email]);
        
            if (emailCheckResult.length > 0) {
                res.status(201).json({
                    message: "Email already exists!!!",
                });
            }
            
            password = md5(password);
        
            let details = {
                firstname: fname,
                lastname: lname,
                email: email,
                password: password,
                role: role,
                group_id: 2,
                created_on: formattedIST,
                updated_on: formattedIST
            };
        
            let sql = "INSERT INTO tbl_login SET ?";
            let result = await mysqlcon(sql, [details]);
        
            if (result.affectedRows > 0) {
                res.status(200).json({
                    message: `${
                        role === "1" ? "SubAdmin" : role === "2" ? "Settlement" : role === "3" ? "Payout" : role === "4" ? "Commission" : "" } Created Successfully`,
                    data: result,
                });
            } else {
                res.status(201).json({
                    message: `Error in Creating`,
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

    async getRole(req:Request,res:Response):Promise<void>{
        try {

            let sql = "SELECT * FROM tbl_role";
            let result = await mysqlcon(sql);
    
            if(result.length !== 0){
                res.status(200).json({
                    message:"Role are",
                    data:result
                })
            }
            else{
                res.status(201).json({
                    message:"No Record Found",
                    data:result
                })
            } 
        } catch (error) {
            res.status(500).json({
                message: "error occurered",
                error: error
            })
        }  
    }

    async getPermissionDetails(req:Request<{},{},getpermissionReq>,res:Response):Promise<void>{
          try {
            let { id } = req.body;
        
            let modules = [
              "Sub Admin Module",
              "PG Module",
              "MID Module",
              "Chinese bank Module",
              "Bankcode BankConnect Module",
              "Bankcode Module",
              "Merchant Module",
              "Transaction Module",
              "SandBox Module",
              "Banner Module",
              "Settlement Module",
              "Activity Logs",
              "Contact Module",
              "CMS Module",
              "Meta Module",
              "Setting Module",
              "Change Password",
            ];
        
            let settlementmodules = [
              "Bank Deposit Received",
              "Local Payouts",
              "Add Funds",
              "Local Settlement",
              "International Settlement",
              "Dispute/Chargebacks",
              "Refunds",
              "Reports",
              "SettlementChangePassword",
            ]
        
            let sql1 = "SELECT firstname,lastname,email, role FROM tbl_login WHERE user_id = ?";
            let result1 = await mysqlcon(sql1, [id]);
            let userRole = result1[0].role
            let sql = "SELECT module,m_add,m_edit,m_delete,m_view,status FROM tbl_module_action WHERE user_id = ?";
        
            let result = await mysqlcon(sql, [id]);
        
            let output = [];
        
            if(userRole === -1 || userRole === 1){
              for (let i = 0; i < modules.length; i++) {
                var j = 0;
          
                for (j = 0; j < result.length; j++) {
                  if (result[j].module === modules[i]) {
                    output.push(result[j]);
                    break;
                  }
                }
                if (j === result.length) {
                  output.push({
                    module: modules[i],
                    m_add: 0,
                    m_edit: 0,
                    m_delete: 0,
                    m_view: 0,
                    status: 0,
                  });
                }
              }
            } else if(userRole === 2){
              for (let i = 0; i < settlementmodules.length; i++) {
                var j = 0;
          
                for (j = 0; j < result.length; j++) {
                  if (result[j].module === settlementmodules[i]) {
                    output.push(result[j]);
                    break;
                  }
                }
                if (j === result.length) {
                  output.push({
                    module: settlementmodules[i],
                    m_add: 0,
                    m_edit: 0,
                    m_delete: 0,
                    m_view: 0,
                    status: 0,
                  });
                }
              }
            }
        
            if (result1.length !== 0) {
                res.status(200).json({
                    message: `Take Permission`,
                    details: result1,
                    permissions: output,
                });
            } else {
                res.status(201).json({
                    message: `No SubAdmin Found`,
                    details: result1,
                    permissions: output,
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
    
    async updateSubAdmin(req: Request<{}, {}, updateRequest>,res: Response): Promise<void> {
        try {
          let { id, fname, lname, email, role, password } = req.body;
    
          let details: any = {
            firstname: fname,
            lastname: lname,
            email,
            role,
            updated_on: formattedIST,
          };
    
          if (password) {
            details.password = md5(password);
          }
    
          let sql = 'UPDATE tbl_login SET ? WHERE user_id = ?';
          let result = await mysqlcon(sql, [details, id]);
    
          if (result.affectedRows > 0) {
            res.status(200).json({
              message: `SubAdmin Data Updated✅`,
              data: result,
            });
          } else {
            res.status(201).json({
              message: `Error While Updating`,
              data: result,
            });
          }
        } catch (error) {
          console.log(error);
          res.status(500).json({
            message: 'error occurered',
            error: error,
          });
        }
    }

    async getViewSubAdmin(req:Request,res:Response):Promise<void>{
        try {
            let {id} = req.body;
            let sql = "SELECT * FROM tbl_login WHERE user_id = ?";
            let result = await mysqlcon(sql,[id]);
        
            if(result.length !== 0){
                res.status(200).json({
                    message:`Data for id = ${id}`,
                    data:result
                })
            }
            else{
                res.status(201).json({
                    message:`No Record Found`,
                    data:result
                })
            }
        } catch (error) {
            res.status(500).json({
                message: "error occurered",
                error: error
            })
        }
    }

    async permissionSubAdmin(req:Request<{},{},permissionSubRequest>,res:Response):Promise<void>{
          try {
            let { id, actionData, role } = req.body;
            let modules = [
              "Sub Admin Module",
              "PG Module",
              "MID Module",
              "Chinese bank Module",
              "Bankcode BankConnect Module",
              "Bankcode Module",
              "Merchant Module",
              "Transaction Module",
              "SandBox Module",
              "Banner Module",
              "Settlement Module",
              "Activity Logs",
              "Contact Module",
              "CMS Module",
              "Meta Module",
              "Setting Module",
              "Change Password",
            ];
        
            let settlementmodules = [
              "Bank Deposit Received",
              "Local Payouts",
              "Add Funds",
              "Local Settlement",
              "International Settlement",
              "Dispute/Chargebacks",
              "Refunds",
              "Reports",
              "SettlementChangePassword",
            ]
            actionData = JSON.parse(actionData);
            let result;
        
            if(role === 1){
              for (let i = 0; i < actionData.length; i++) {
                let name = modules[actionData[i].moduleName];
          
                if (actionData[i].status === 0) {
                  let sqlCheck =
                    "SELECT * FROM tbl_module_action WHERE user_id = ? AND module = ?";
                  let resultCheck = await mysqlcon(sqlCheck, [id, name]);
          
                  let sql = "";
          
                  if (resultCheck.length !== 0) {
                    sql +=
                      "UPDATE tbl_module_action SET ? WHERE user_id = ? AND module = ?";
                  } else {
                    sql += "INSERT INTO tbl_module_action SET ?";
                  }
          
                  let details = {
                    user_id: id,
                    module: name,
                    m_add: 0,
                    m_edit: 0,
                    m_delete: 0,
                    m_view: 0,
                    status: actionData[i].status,
                  };
          
                  if (resultCheck.length !== 0) {
                    result = await mysqlcon(sql, [details, id, name]);
                  } else {
                    result = await mysqlcon(sql, [details]);
                  }
                } else {
                  let sqlCheck =
                    "SELECT * FROM tbl_module_action WHERE user_id = ? AND module = ?";
                  let resultCheck = await mysqlcon(sqlCheck, [id, name]);
          
                  let sql = "";
          
                  if (resultCheck.length !== 0) {
                    sql +=
                      "UPDATE tbl_module_action SET ? WHERE user_id = ? AND module = ?";
                  } else {
                    sql += "INSERT INTO tbl_module_action SET ?";
                  }
          
                  let detail = {
                    user_id: id,
                    module: name,
                    m_add: actionData[i].m_add,
                    m_edit: actionData[i].m_edit,
                    m_delete: actionData[i].m_delete,
                    m_view: actionData[i].m_view,
                    status: actionData[i].status,
                  };
          
                  if (resultCheck.length !== 0) {
                    result = await mysqlcon(sql, [detail, id, name]);
                  } else {
                    result = await mysqlcon(sql, [detail]);
                  }
                }
              }
            } else if(role === 2) {
              for (let i = 0; i < actionData.length; i++) {
                let name = settlementmodules[actionData[i].moduleName];
          
                if (actionData[i].status === 0) {
                  let sqlCheck =
                    "SELECT * FROM tbl_module_action WHERE user_id = ? AND module = ?";
                  let resultCheck = await mysqlcon(sqlCheck, [id, name]);
          
                  let sql = "";
          
                  if (resultCheck.length !== 0) {
                    sql +=
                      "UPDATE tbl_module_action SET ? WHERE user_id = ? AND module = ?";
                  } else {
                    sql += "INSERT INTO tbl_module_action SET ?";
                  }
          
                  let details = {
                    user_id: id,
                    module: name,
                    m_add: 0,
                    m_edit: 0,
                    m_delete: 0,
                    m_view: 0,
                    status: actionData[i].status,
                  };
          
                  if (resultCheck.length !== 0) {
                    result = await mysqlcon(sql, [details, id, name]);
                  } else {
                    result = await mysqlcon(sql, [details]);
                  }
                } else {
                  let sqlCheck =
                    "SELECT * FROM tbl_module_action WHERE user_id = ? AND module = ?";
                  let resultCheck = await mysqlcon(sqlCheck, [id, name]);
          
                  let sql = "";
          
                  if (resultCheck.length !== 0) {
                    sql +=
                      "UPDATE tbl_module_action SET ? WHERE user_id = ? AND module = ?";
                  } else {
                    sql += "INSERT INTO tbl_module_action SET ?";
                  }
          
                  let detail = {
                    user_id: id,
                    module: name,
                    m_add: actionData[i].m_add,
                    m_edit: actionData[i].m_edit,
                    m_delete: actionData[i].m_delete,
                    m_view: actionData[i].m_view,
                    status: actionData[i].status,
                  };
          
                  if (resultCheck.length !== 0) {
                    result = await mysqlcon(sql, [detail, id, name]);
                  } else {
                    result = await mysqlcon(sql, [detail]);
                  }
                }
              }
            }
        
            if (result.affectedRows > 0) {
            res.status(200).json({
                message: "Subadmin Permission Updated",
                data: result,
              });
            } else {
            res.status(201).json({
                message: "Error while Creating/Updating",
                data: result,
              });
            }
          } catch (error) {
            console.log(error)
            res.status(500).json({
              message: "error occurered",
              error: error,
            });
          }
    }
}

export default new subAdmincont
import { Request, Response } from 'express';
import mysqlcon from "../config/db_connection";
import { AuthenticatedRequest } from './userInterface';
import send_mail from "../helper/send-mail";
import md5 from 'md5';
import otpGenerator from "otp-generator";
import emailvalidator from 'email-validator';

interface FilterRequestBody {
  id?: string;
  searchText?: string;
  to?: string;
  from?: string;
  To?: string;
  From?: string;
  page?: number;
  limit?: number;
}

interface CreateEmployeeBody {
  id?: number;
  email: string;
  mobile_no: string;
  fname: string;
  lname: string;
  usercode: number;
}

interface GetTeamDetailsBody {
  id: number;
}

interface TeamEditDetailsBody {
  id: number;
  fname?: string;
  lname?: string;
  email?: string;
  mobile_no?: string;
  usercode?: string;
}

interface DeleteTeamRequestBody {
  id: number;
}

interface VerifyTeamRequestBody {
  id: number;
}

interface GetEmployeePermissionRequestBody {
  id: number;
}

interface EmployeePermission {
  module: string;
  m_add: number;
  m_edit: number;
  m_delete: number;
  m_view: number;
  m_download: number;
  status: number;
}

interface EmployeeDetails {
  name: string;
  email: string;
  firstname?: string;
  lastname?: string;
}

interface Permission {
  add: boolean;
  edit: boolean;
  view: boolean;
  delete: boolean;
  download: boolean;
}

interface ActionItem {
  id: string;
  permissions: Permission;
  enabled: boolean;
}

interface PermissionRequestBody {
  id: number;
  actionData: ActionItem[];
}

const MerchantTeam = {
    default : async(req: AuthenticatedRequest, res: Response):Promise<void> =>{
        const user = req.user!;
        const { id, searchText, to, from, From, To, page = 1, limit = 10 } = req.body as FilterRequestBody;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        try {
            const merchantIdArray = id ? id.split(',') : [ID];
            const pagination = (total: number, page: number, limit: number) => {
                const numOfPages = Math.ceil(total / limit);
                const start = (page - 1) * limit;
                return { limit, start, numOfPages };
            };
            const formattedDateFields = `DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(updated_on, '%Y-%m-%d %H:%i:%s') AS updated_on`;
            let baseQuery = `SELECT *, ${formattedDateFields} FROM tbl_user WHERE account_type = 3 AND parent_id IN (${merchantIdArray.map(() => '?').join(', ')})`;
            let countQuery = `SELECT COUNT(*) AS Total FROM tbl_user WHERE account_type = 3 AND parent_id IN (${merchantIdArray.map(() => '?').join(', ')})`;
            const queryValues: any[] = [...merchantIdArray];
            const conditions: string[] = [];
            if (to && from) {
                conditions.push('DATE(created_on) BETWEEN ? AND ?');
                queryValues.push(from, to);
            }
            if (To && From) {
                conditions.push('DATE(updated_on) BETWEEN ? AND ?');
                queryValues.push(From, To);
            }
            if (searchText) {
                conditions.push('(order_no LIKE ? OR txn_id LIKE ?)');
                queryValues.push(`%${searchText}%`, `%${searchText}%`);
            }
            if (conditions.length > 0) {
                const conditionStr = ' AND ' + conditions.join(' AND ');
                baseQuery += conditionStr;
                countQuery += conditionStr;
            }
            const countResult = await mysqlcon(countQuery, queryValues);
            const total = countResult[0].Total;
            const { start, numOfPages } = pagination(total, page, limit);
            baseQuery += ` ORDER BY created_on DESC LIMIT ?, ?`;
            const finalQueryValues = [...queryValues, start, limit];
            const resultData = await mysqlcon(baseQuery, finalQueryValues);
            const startRange = start + 1;
            const endRange = Math.min(start + limit, total);
            res.json({
                message: resultData.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}`: 'NO DATA',
                currentPage: page,
                totalPages: numOfPages || 1,
                pageLimit: limit,
                data: resultData,
                userRefund: user.refund,
            });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({
                message: 'Server Error',
                error: error.message || error,
           });
        }
    },

    createEmployee : async(req: AuthenticatedRequest, res: Response):Promise<void> =>{
        try {
            const currentUTC = new Date();
            const istTime = new Date(currentUTC.getTime() + 5.5 * 60 * 60 * 1000);
            const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');
            const user = req.user!;
            const parentID = user.account_type === 3 ? user.parent_id : user.id;
            const {id = parentID, email, mobile_no, fname, lname,usercode,} = req.body as CreateEmployeeBody;
            if (!email || !emailvalidator.validate(email)) {
                res.status(201).json({ message: "Email Not Valid/Correct" });
            }
            const emailCheckQuery = `SELECT email FROM tbl_user WHERE parent_id = ? AND email = ? AND account_type = 3`;
            const existingEmail = await mysqlcon(emailCheckQuery, [id, email]);
            if (existingEmail.length > 0) {
                res.status(201).json({ message: "Employee Email Already Exist" });
            }
            const mobileCheckQuery = `SELECT mobile_no FROM tbl_user WHERE parent_id = ? AND mobile_no = ? AND account_type = 3`;
            const existingMobile = await mysqlcon(mobileCheckQuery, [id, mobile_no]);
            if (existingMobile.length > 0) {
                res.status(201).json({ message: "Employee Mobile Number Already Exist" });
            }
            const defaultPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = md5(defaultPassword);
            const verification_token = otpGenerator.generate(8, {upperCaseAlphabets: true, specialChars: false,});
            const name = `${fname} ${lname}`;
            const newEmployee = {
            email,
            fname,
            lname,
            mobile_no,
            name,
            created_on: formattedIST,
            updated_on: formattedIST,
            parent_id: id,
            usercode,
            status: 0,
            password: hashedPassword,
            account_type: 3,
            complete_profile: 1,
            verification_token,
            };
            const insertQuery = "INSERT INTO tbl_user SET ?";
            const insertResult = await mysqlcon(insertQuery, newEmployee);
            if (!insertResult) {
            res.status(201).json({ message: "Error in Adding Employee" });
            }
            const roleNames: Record<number, string> = {
            1: "Administrator",
            2: "Manager",
            3: "Cashier",
            4: "Reporter",
            };
            const roleName = roleNames[usercode] || "Employee";
            send_mail.mail(
            {
                email,
                mobile_no,
                name,
                usercode: roleName,
                password: defaultPassword,
                subject: "Team Create",
            },
            'employee'
            );
            res.status(200).json({ message: "Employee Added. Please Wait...." });

        } catch (error: any) {
            console.error(error);
            res.status(500).json({
                message: "An error occurred",
                error: error.message || error
            });
        }
    },

    getTeamDetails : async(req: AuthenticatedRequest, res: Response):Promise<void> => {
        try {
            const { id } = req.body as GetTeamDetailsBody;
            const sql = "SELECT * FROM tbl_user WHERE id = ?";
            const result = await mysqlcon(sql, [id]);
            res.status(200).json({
            result: result[0] || null
            });

        } catch (error: any) {
            console.error(error);
            res.status(500).json({
            message: "error occurred",
            error: error.message || error
            });
        }
    },

    teamEditDetails : async(req: AuthenticatedRequest, res: Response):Promise<void> =>{
        try {
            const {id,fname = '',lname = '', email = '', mobile_no = '',usercode = '', } = req.body as TeamEditDetailsBody;
            if (!id) {
              res.status(400).json({ message: "User ID is required." });
            }

            const currentUTC = new Date();
            const istTime = new Date(currentUTC.getTime() + 5.5 * 60 * 60 * 1000);
            const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');
            const updated_on = formattedIST;
            const name = `${fname} ${lname}`.trim();
            const updateData = {fname,lname,email,mobile_no,usercode,updated_on,name,};
            const sql = "UPDATE tbl_user SET ? WHERE id = ?";
            const result: any = await mysqlcon(sql, [updateData, id]);
            if (result.affectedRows > 0) {
            res.status(200).json({
                message: "Employee details updated successfully.",
                data: result,
            });
            } else {
            res.status(404).json({
                message: "No matching record found to update.",
                data: result,
            });
            }
        } catch (error: any) {
            console.error("Update Error:", error);
            res.status(500).json({
                message: "An error occurred while updating team details.",
                error: error.message || error,
            });
        }
    },

    deleteTeam : async(req: AuthenticatedRequest, res: Response):Promise<void> =>{
        try {
            const { id } = req.body as DeleteTeamRequestBody;
            if (!id) {
                res.status(400).json({ message: "ID is required." });
            }
            const sql = "DELETE FROM tbl_user WHERE id = ?";
            const result: any = await mysqlcon(sql, [id]);
            if (result?.affectedRows > 0) {
              res.status(200).json({
                message: "Team Member Deleted Successfully✅",
              });
            } else {
                res.status(404).json({
                 message: "No matching record found to delete.",
                });
            }
        } catch (error: any) {
            res.status(500).json({
            message: "An error occurred during deletion.",
            error: error.message || error,
            });
        }
    },

    verifyTeam : async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        try {
            const { id } = req.body as VerifyTeamRequestBody;
            if (!id) {
                res.status(400).json({ message: "ID is required." });
            }
            const sql = "UPDATE tbl_user SET status = 1 WHERE id = ?";
            const result: any = await mysqlcon(sql, [id]);
            if (result?.affectedRows > 0) {
                res.status(200).json({
                    message: "Team Member Verified Successfully",
                });
            } else {
                res.status(404).json({
                    message: "No matching team member found to verify.",
                });
            }
        } catch (error: any) {
            console.error("Verification Error:", error);
            res.status(500).json({
                message: "An error occurred during verification.",
                error: error.message || error,
            });
        }
    },

    getEmployeePermission: async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
        try {
            const { id } = req.body;
            const modules: Record<string, string> = {
                submerchant: "Sub Merchant",
                deposits: "Deposits",
                payouts: "Payouts",
                refund_chargebacks: "Refunds/Chargebacks",
                single_payout: "Single Payout",
                settlements: "Settlements",
                wallet_logs: "Wallet Logs",
                reports: "Reports",
                sandbox: "SandBox Module",
                statements: "Statements",
                teams: "Teams",
                buisness_setting: "Buisness Setting",
            };
            const sql1 = "SELECT name, email FROM tbl_user WHERE id = ?";
            const userDetails: EmployeeDetails[] = await mysqlcon(sql1, [id]);
            const sql2 = `SELECT module, m_add, m_edit, m_delete, m_view, m_download, status FROM tbl_employee_action WHERE user_id = ?`;
            const permissions: EmployeePermission[] = await mysqlcon(sql2, [id]);
            const output: EmployeePermission[] = [];
            const moduleNames = Object.values(modules);
            for (const module of moduleNames) {
                const match = permissions.find((perm) => perm.module === module);
                if (match) {
                    output.push(match);
                } else {
                    output.push({
                        module,
                        m_add: 0,
                        m_edit: 0,
                        m_delete: 0,
                        m_view: 0,
                        m_download: 0,
                        status: 0,
                    });
                }
            }
            if (userDetails.length > 0) {
                res.status(200).json({
                    message: `Permission for ${userDetails[0].name}`,
                    details: userDetails,
                    permissions: output,
                });
            } else {
                res.status(404).json({
                    message: "No SubAdmin Found",
                    details: [],
                    permissions: output,
               });
            }
        } catch (error: any) {
            console.error("Permission Error:", error);
            res.status(500).json({
            message: "An error occurred while fetching permissions.",
            error: error.message || error,
            });
        }
    },

    permissionEmployee: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
        try {
            const { id, actionData } = req.body as PermissionRequestBody;
            const modules: Record<string, string> = {
                submerchant: "Sub Merchant",
                deposits: "Deposits",
                payouts: "Payouts",
                refund_chargebacks: "Refunds/Chargebacks",
                single_payout: "Single Payout",
                settlements: "Settlements",
                wallet_logs: "Wallet Logs",
                reports: "Reports",
                sandbox: "SandBox Module",
                statements: "Statements",
                teams: "Teams",
                buisness_setting: "Buisness Setting",
            };
            let result: any;
            for (const action of actionData) {
                const moduleName = modules[action.id];
                if (!moduleName) continue;
                const details = {
                    user_id: id,
                    module: moduleName,
                    m_add: action.permissions.add ? 1 : 0,
                    m_edit: action.permissions.edit ? 1 : 0,
                    m_view: action.permissions.view ? 1 : 0,
                    m_delete: action.permissions.delete ? 1 : 0,
                    m_download: action.permissions.download ? 1 : 0,
                    status: action.enabled ? 1 : 0,
                };  
                const sqlCheck = "SELECT * FROM tbl_employee_action WHERE user_id = ? AND module = ?";
                const resultCheck = await mysqlcon(sqlCheck, [id, moduleName]);
                if (resultCheck.length > 0) {
                    const sqlUpdate = "UPDATE tbl_employee_action SET ? WHERE user_id = ? AND module = ?";
                    result = await mysqlcon(sqlUpdate, [details, id, moduleName]);
                } else {
                    const sqlInsert = "INSERT INTO tbl_employee_action SET ?";
                    result = await mysqlcon(sqlInsert, [details]);
                }
            }
            if (result && result.affectedRows > 0) {
                res.status(200).json({
                    message: "Employee Permission Updated",
                    data: result,
                });
            } else {
                res.status(400).json({
                    message: "Error while Creating/Updating",
                    data: result,
                });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({
                message: "An error occurred",
                error: error.message || error,
            });
        }
    }

}

export default MerchantTeam
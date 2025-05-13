import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';
const currentUTC = new Date();
const istOffset = 5.5 * 60 * 60 * 1000; 
const istTime = new Date(currentUTC.getTime() + istOffset);
const formattedIST = istTime.toISOString().slice(0, 19).replace('T', ' ');

interface defaultRequest{
    searchText?: string;
    message?: string
    data? :any
    error? : any
    currentPage? : any
    totalPages?: any
    pageLimit?:any
}

interface createRequest{
    name?: string, 
    sec_key?: string, 
    salt?: string, 
    percentage?: string, 
    mid?: string, 
    merchant_ids?: string
    message?: string
    data? :any
    error? : any
}

interface readoneRequest{
    id?: string
    message?: string
    data? :any
    error? : any
}

interface editRequest{
    id?: string
    name?: string, 
    sec_key?: string, 
    salt?: string, 
    percentage?: string, 
    mid?: string, 
    merchant_ids?: string
    message?: string
    data? :any
    error? : any
}


class subMerchant{

    async defaultSubmerchant(req:Request,res:Response<defaultRequest>):Promise<void>{
          let pagination = (total: number, page: number, limit: number) => {
            let numOfPages = Math.ceil(total / limit);
            let start = page * limit - limit;
            return { limit, start, numOfPages };
          };
        
          try {
            let searchItem = req.body.searchItem;
            let sql = "select count (*) as Total from tbl_merchant_child";
            let sqlCount =
              "select count (*) as Total FROM tbl_merchant_child WHERE page_title  LIKE '%" +
              searchItem +
              "%'";
        
            let result = await mysqlcon(searchItem ? sqlCount : sql);
            let total = result[0].Total;
            let page = req.body.page ? Number(req.body.page) : 1;
            let limit = req.body.limit ? Number(req.body.limit) : 10;
            let { start, numOfPages } = pagination(total, page, limit);
        
            let sql1 = "SELECT *, DATE_FORMAT(tbl_merchant_child.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_merchant_child.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_merchant_child ORDER BY created_on DESC LIMIT ?,?";
            let sql2 =
              "SELECT *, DATE_FORMAT(tbl_merchant_child.created_on,'%Y-%m-%d %H:%i:%s') AS created_on, DATE_FORMAT(tbl_merchant_child.updated_on,'%Y-%m-%d %H:%i:%s') AS updated_on FROM tbl_merchant_child WHERE page_title  LIKE '%" +
              searchItem +
              "%' ORDER BY created_on LIMIT ?,?";
        
            let result1 = await mysqlcon(searchItem ? sql2 : sql1, [start, limit]);
            let startRange = start + 1;
            let endRange = start + result1.length;
        
             res.status(200).json({
              message: result1.length > 0 ? `Showing ${startRange} to ${endRange} data from ${total}` : "Showing 0 data from 0",
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

    async createSubmerchant(req:Request,res:Response<createRequest>):Promise<void>{
          try {
            let { name, sec_key, salt, percentage, mid, merchant_ids } = req.body;
        
            let details = {
              name,
              sec_key,
              salt,
              percentage,
              mid,
              merchant_ids,
              created_on : formattedIST,
              updated_on: formattedIST
            };
        
            let sql = "INSERT INTO tbl_merchant_child SET ? , created_on = NOW() , updated_on = NOW()";
        
            let result = await mysqlcon(sql, [details]);
        
            if (result) {
               res.status(200).json({
                message: "Sub Merchant Created Successfully ✅",
              });
            } else {
               res.status(201).json({
                message: "Error While Creating",
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

    async readOneSubmerchant(req:Request,res:Response<readoneRequest>):Promise<void>{
          try {
            let { id } = req.body;
            let sql = "SELECT * FROM tbl_merchant_child WHERE id = ?";
            let result = await mysqlcon(sql, [id]);
            res.json(result[0]);
          } catch (error) {
             res.status(500).json({
              message: "error occurered",
              error: error,
            });
          }
    }

    async editSubmerchant(req:Request,res:Response<editRequest>):Promise<void>{
          try {
            let { id, name, sec_key, salt, percentage, mid, merchant_ids } = req.body;
         
            let details = {
              name,
              sec_key,
              salt,
              percentage,
              mid,
              merchant_ids,
              updated_on: formattedIST
            };
        
            if (id) {
              let sql = "UPDATE tbl_merchant_child SET ? where id = ?";
              let result = await mysqlcon(sql, [details, id]);
              if (result) {
                 res.status(200).json({
                  message: "Sub Merchant Edited Successfully ✅",
                });
              } else {
                 res.status(201).json({
                  message: "Error while updating",
                });
              }
            } else {
               res.status(205).json({
                message: "Kindly Provide Id",
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

export default new subMerchant
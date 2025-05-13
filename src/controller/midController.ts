import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';

interface readRequest{
    searchItem? :string
    limit? :string
    page? :string
}

interface updateRequest{
    title? :string, 
    mid? :string, 
    sec_key? :string, 
    iv? :string, 
    merchant_url? :string, 
    merchant_otherurl? :string, 
    id? :string
}

interface createRequest{
    title? :string, 
    mid? :string, 
    sec_key? :string, 
    iv? :string, 
    merchant_url? :string, 
    merchant_otherurl? :string, 
}

interface deleteRequest{
    id? : string
}

interface readUPdateRequest{
    id? : string
}

class midController{
    async readMid(req:Request<{},{},readRequest>,res:Response):Promise<void>{
        let pagination = (total: number, page: number, limit: number) => {
            let numOfPages = Math.ceil(total / limit);
            let start = page * limit - limit;
            return { limit, start, numOfPages };
        };
        try {
            let searchItem = req.body.searchItem;
            let sql = "select count (*) as Total from tbl_ingenico_mid";
            let sqlCount =
            "select count (*) as Total FROM tbl_ingenico_mid WHERE sec_key  LIKE '%" +
            searchItem +
            "%' OR  mid  LIKE '%" +
            searchItem +
            "%' or  iv  LIKE '%" +
            searchItem +
            "%' or  merchant_url  LIKE '%" +
            searchItem +
            "%' or  merchant_otherurl  LIKE '%" +
            searchItem +
            "%' or  title  LIKE '%" +
            searchItem +
            "%'";
            
        
            let result = await mysqlcon(searchItem ? sqlCount:sql);
            let total = result[0].Total;
            let page = req.body.page ? Number(req.body.page) : 1;
            let limit = req.body.limit ? Number(req.body.limit) : 10;
            let { start, numOfPages } = pagination(total, page, limit);
        

            let sql1 = "SELECT * FROM tbl_ingenico_mid ORDER BY id DESC LIMIT ?,?";
            let sql2 =
            "SELECT * FROM tbl_ingenico_mid WHERE sec_key LIKE '%" +
            searchItem +
            "%' OR  mid  LIKE '%" +
            searchItem +
            "%' or  iv  LIKE '%" +
            searchItem +
            "%' or  merchant_url  LIKE '%" +
            searchItem +
            "%' or  merchant_otherurl  LIKE '%" +
            searchItem +
            "%' or  title  LIKE '%" +
            searchItem +
            "%' LIMIT ?,?";

            let result1 = await mysqlcon(searchItem ? sql2 : sql1, [start, limit]);

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
            console.log(error)
            res.status(500).json({
            message: "error occurered",
            error: error,
            });
        }
    }

    async updateMid(req:Request<{},{},updateRequest>,res:Response):Promise<void>{
          try {
            let { title, mid, sec_key, iv, merchant_url, merchant_otherurl, id } = req.body;
        
            let details = {
              title,
              mid,
              sec_key,
              iv,
              merchant_url,
              merchant_otherurl,
            };
        
            if (id) {
              let sql = "UPDATE tbl_ingenico_mid SET ? where id = ?";
              let result = await mysqlcon(sql, [details, id]);
              if (result) {
                res.status(200).json({
                  message: "MID Updated ✅",
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
            res.status(500).json({
              message: "error occurered",
              error: error,
            });
          }
    }

    async createMid(req:Request<{},{},createRequest>,res:Response):Promise<void>{
          try {
            let { title, mid, sec_key, iv, merchant_url, merchant_otherurl } = req.body;
        
            let details = {
              title,
              mid,
              sec_key,
              iv,
              merchant_url,
              merchant_otherurl
            };
        
            let sql = "INSERT INTO tbl_ingenico_mid SET ?";
        
            let result = await mysqlcon(sql, [details]);
        
            if (result) {
            res.status(200).json({
                message: "New MID Created✅",
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

    async deleteMid(req:Request<{},{},deleteRequest>,res:Response):Promise<void>{
          try {
            let { id } = req.body;
        
            let sql = "DELETE FROM tbl_ingenico_mid WHERE id = ?";
            let result = await mysqlcon(sql, [id]);
        
            if (result) {
                res.status(200).json({
                    message: "MID Deleted Successfully✅",
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

    async readUpdateMid(req:Request<{},{},readUPdateRequest>,res:Response):Promise<void>{
        try {
            let { id } = req.body;
            let sql = "SELECT * FROM tbl_ingenico_mid WHERE id = ?";
            let result = await mysqlcon(sql, [id]);
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
}

export default new midController
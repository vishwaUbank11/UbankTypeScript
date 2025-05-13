import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';

interface contactRequest{
    searchItem? :string
    limit? :string
    page? :string
}

interface readRequest{
    id? : string
}

interface deleteRequest{
    id? : string
}


class contact{
    async Contact(req:Request<{},{},contactRequest>,res:Response):Promise<void>{
        let pagination = (total: number, page: number, limit: number) => {
            let numOfPages = Math.ceil(total / limit);
            let start = page * limit - limit;
            return { limit, start, numOfPages };
        };

        try {
            let searchItem = req.body.searchItem;
            let sql = "select count (*) as Total from tbl_contact_us";
            let sqlCount =
            "select count (*) as Total FROM tbl_contact_us WHERE name  LIKE '%" +
            searchItem +
            "%' OR  mobile  LIKE '%" +
            searchItem +
            "%' OR  email  LIKE '%" +
            searchItem +
            "%' OR  message  LIKE '%" +
            searchItem +
            "%' OR  created_on  LIKE '%" +
            searchItem +
            "%'";

            let result = await mysqlcon(searchItem ? sqlCount : sql);
            let total = result[0].Total;
            let page = req.body.page ? Number(req.body.page) : 1;
            let limit = req.body.limit ? Number(req.body.limit) : 10;
            let { start, numOfPages } = pagination(total, page, limit);
            

            let sql1 = "SELECT *, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on FROM tbl_contact_us LIMIT ?,?";
            let sql2 =
            "SELECT *, DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on FROM tbl_contact_us WHERE name  LIKE '%" +
            searchItem +
            "%' OR  mobile  LIKE '%" +
            searchItem +
            "%' OR  email  LIKE '%" +
            searchItem +
            "%' OR  message  LIKE '%" +
            searchItem +
            "%' OR  created_on  LIKE '%" +
            searchItem +
            "%'  LIMIT ?,?";

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
            res.status(500).json({
            message: "error occurered",
            error: error,
            });
        }
    }

    async readContact(req:Request<{},{},readRequest>,res:Response):Promise<void>{
        try {
            let { id } = req.body;
            let sql = "SELECT * FROM tbl_contact_us WHERE id = ?";
            let result = await mysqlcon(sql, [id]);
            res.status(200).json({
                message: "Data Fetched Successfully✅",
                data: result[0],
            });
        } catch (error) {
            res.status(500).json({
                message: "error occurered",
                error: error,
            });
        }
    }

    async deleteContact(req:Request<{},{},deleteRequest>,res:Response):Promise<void>{
        try {
            let { id } = req.body;

            let sql = "DELETE FROM tbl_contact_us WHERE id = ?";
            let result = await mysqlcon(sql, [id]);


            if (result) {
                res.status(200).json({
                    message: "Delete Successfully✅",
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
}

export default new contact
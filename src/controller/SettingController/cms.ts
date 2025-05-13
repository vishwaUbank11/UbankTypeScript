import { Request, Response } from 'express';
import mysqlcon from '../../config/db_connection';
let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;

interface Cms{
id: number

}

interface CMSUpdateRequest {
  page_title: string;
  content: string;
  id: number;
  created_on:string;
  updated_on:string;
}
interface CMSViewRequest {
  id: number;
}

interface DefaultCMS {
  id?: number;
  page_title?: string;
  created_on?: string;
  updated_on?: string;
  searchItem?: string;
  page?: number;
  limit?: number;
}
class CmsControoler{
async readonce (req: Request, res: Response): Promise<void> {

try {
    let { id } :Cms = req.body;
    let sql = "SELECT * FROM tbl_pages WHERE id = ?";
    let result = await mysqlcon(sql, [id]);

    res.json(result[0]);
  } catch (error) {
     res.json({
message: "Error occurred",
     })
     
  }

}
async updateCMS(req: Request, res: Response): Promise<void> {
  try {
    const { page_title, content, id }: CMSUpdateRequest = req.body;

    if (!id) {
      res.status(400).json({ message: "Kindly provide ID" });
      return;
    }

    const details = {
      page_title,
      content,
      created_on: dateTime,
      updated_on: dateTime
    };

    const sql = `UPDATE tbl_pages SET page_title = ?, content = ?  WHERE id = ? `;

    const result = await mysqlcon(sql, [page_title, content, id]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Row Updated ✅" ,
        data:details
       
      });
    } else {
      res.status(404).json({ message: "No row found to update" });
    }

  } catch (error) {
    res.status(500).json({
      message: "Error occurred",
      error
    });
  }
}
async viewCMS(req: Request, res: Response): Promise<void> {
  try {
    const { id }: CMSViewRequest = req.body;

    const sql = `
      SELECT page_title, content, created_on, updated_on 
      FROM tbl_pages 
      WHERE id = ?
    `;

    const result = await mysqlcon(sql, [id]);

    res.status(200).json({
      message: "Data  fetch Successfully✅",
      data: result
    });

  } catch (error) {
    res.status(500).json({
      message: "Error occurred",
      error
    });
  }
}
async defaultCMS(req: Request, res: Response): Promise<void> {
  const paginate = (total: number, page: number, limit: number) => {
    const numOfPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    return { limit, start, numOfPages };
  };

  try {
    const { searchItem = '', page = 1, limit = 10 }: DefaultCMS = req.body;
    const currentPage = Number(page);
    const pageLimit = Number(limit);

    const baseCountQuery = `SELECT COUNT(*) AS Total FROM tbl_pages`;
    const searchCountQuery = `SELECT COUNT(*) AS Total FROM tbl_pages WHERE page_title LIKE ?`;

    const countParams = [`%${searchItem}%`];
    const countResult = await mysqlcon(
      searchItem ? searchCountQuery : baseCountQuery,
      searchItem ? countParams : []
    );

    const total: number = countResult[0].Total;
    const { start, numOfPages } = paginate(total, currentPage, pageLimit);

    const baseDataQuery = `
      SELECT id, page_title, created_on, updated_on 
      FROM tbl_pages 
      LIMIT ?, ?
    `;
    const searchDataQuery = `
      SELECT id, page_title, created_on, updated_on 
      FROM tbl_pages 
      WHERE page_title LIKE ? 
      LIMIT ?, ?
    `;

    const dataParams = [`%${searchItem}%`, start, pageLimit];
    const dataResult: DefaultCMS[] = await mysqlcon(
      searchItem ? searchDataQuery : baseDataQuery,
      searchItem ? dataParams : [start, pageLimit]
    );

    const statusCode = dataResult.length === 0 ? 201 : 200;
    res.status(statusCode).json({
      message: `Showing ${dataResult.length} from ${total} data`,
      currentPage,
      totalPages: numOfPages,
      pageLimit,
      data: dataResult,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error occurred",
      error,
    });
  }
}


}





export default new CmsControoler
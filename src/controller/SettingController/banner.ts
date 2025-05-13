import { Request, Response } from 'express';
import mysqlcon from '../../config/db_connection';
 // Adjust path as needed
interface Banner {
  searchItem?: string;
  page?: number;
  limit?: number;
  title?: string;
  image?: string;
  status?: number;
  rate:number;
  deposit_currency:string;
  settled_currency:string;
}

class banners{

async createBanner  (req: Request, res: Response): Promise<void>  {
  try {
    const { title } = req.body;
    const image = req.file?.filename;

    
    if (!image) {
      res.status(400).json({ message: "Image is required!" });
      return;
    }
    const details = {
      title,
      image
    };

    const sql = "INSERT INTO tbl_banner SET ?";
    const result = await mysqlcon(sql, [details]);

    if (result) {
      res.status(200).json({
        message: "Data Inserted Successfully ✅",
        imageUrl: `/uploads/images/${image}`
      });
    } else {
      res.status(500).json({ message: "Error While Creating ❌" });
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
};



// async defaultBanner (req: Request, res: Response): Promise<void> {
  
//   const paginate = (total: number, page: number, limit: number) => {
//     const numOfPages = Math.ceil(total / limit);
//     const start = (page - 1) * limit;
//     return { limit, start, numOfPages };
//   };

//   try {
//     const { searchItem, page = 1, limit = 10 } = req.body;
//     const currentPage = Number(page);
//     const pageLimit = Number(limit);

//     const baseCountQuery = `SELECT COUNT(*) AS Total FROM tbl_banner`;
//     const searchCountQuery = `
//       SELECT COUNT(*) AS Total 
//       FROM tbl_banner 
//       WHERE title LIKE ? OR deposit_currency LIKE ?`;

//     const countParams = [`%${searchItem}%`, `%${searchItem}%`];

//     const countResult = await mysqlcon(
//       searchItem ? searchCountQuery : baseCountQuery,
//       searchItem ? countParams : []
//     );

//     const total: number = countResult[0].Total;
//     const { start, numOfPages } = paginate(total, currentPage, pageLimit);

//     const baseDataQuery = `SELECT title, image, status FROM tbl_banner LIMIT ?, ?`;
//     const searchDataQuery = `
//       SELECT title, image, status 
//       FROM tbl_banner 
//       WHERE title LIKE ? OR deposit_currency LIKE ? OR settled_currency LIKE ? 
//       LIMIT ?, ?`;

//     const dataParams = [`%${searchItem}%`, `%${searchItem}%`, `%${searchItem}%`, start, pageLimit];

//     const dataResult = await mysqlcon(
//       searchItem ? searchDataQuery : baseDataQuery,
//       searchItem ? dataParams : [start, pageLimit]
//     );

//     const statusCode = dataResult.length === 0 ? 201 : 200;
//     res.status(statusCode).json({
//       message: `Showing ${dataResult.length} from ${total} data`,
//       currentPage,
//       totalPages: numOfPages,
//       pageLimit,
//       data: dataResult,
//     });

//   } catch (error) {
//     res.status(500).json({
//       message: 'Error occurred',
//       error,
//     });
//   }
// };
async  defaultBanner(req: Request, res: Response): Promise<void> {

  const paginate = (total: number, page: number, limit: number) => {
    const numOfPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    return { limit, start, numOfPages };
  };

  try {
    const { searchItem = '', page = 1, limit = 10 }: Banner = req.body;
    const currentPage = Number(page);
    const pageLimit = Number(limit);

    const baseCountQuery = `SELECT COUNT(*) AS Total FROM tbl_banner`;
    const searchCountQuery = `
      SELECT COUNT(*) AS Total 
      FROM tbl_banner 
      WHERE title LIKE ? OR deposit_currency LIKE ?`;

    const countParams = [`%${searchItem}%`, `%${searchItem}%`];

    // Get the total count of banners
    const countResult = await mysqlcon(
      searchItem ? searchCountQuery : baseCountQuery,
      searchItem ? countParams : []
    );

    const total: number = countResult[0].Total;
    const { start, numOfPages } = paginate(total, currentPage, pageLimit);

    const baseDataQuery = `SELECT title, image, status FROM tbl_banner LIMIT ?, ?`;
    const searchDataQuery = `
      SELECT title, image, status 
      FROM tbl_banner 
      WHERE rate LIKE ? OR title LIKE ? OR deposit_currency LIKE ? OR settled_currency LIKE ? 
      LIMIT ?, ?`;

    const dataParams = [
      `%${searchItem}%`,
      `%${searchItem}%`,
      `%${searchItem}%`,
      `%${searchItem}%`, // fixed parameter for 'settled_currency'
      start,
      pageLimit
    ];

    // Get the data based on the search and pagination
    const dataResult: Banner[] = await mysqlcon(
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
      message: 'Error occurred',
      error,
    });
  }
}


}
export default new banners
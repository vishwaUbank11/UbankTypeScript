import { Request, Response } from 'express';
import mysqlcon from '../../config/db_connection';
let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;


interface CountryParams {
  searchItem?: string;
  page?: number;
  limit?: number;
  id?: number;
  name?: string;
  code?: string;
  rate?: number;
  deposit_currency?: string;
  settled_currency?: string;
  status?: string;
  [key: string]: any; // For flexibility on other fields
}
interface deleteapi {
  id: string;
}
interface CountryInput {
  name: string;
  currency: string;
  sortname: string;
  symbol: string;
}


class Countries {
  async defaultCountries(req: Request, res: Response): Promise<void> {
    const pagination = (total: number, page: number, limit: number) => {
      const numOfPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      return { limit, start, numOfPages };
    };
  
    try {
      const { searchItem = '', page = 1, limit = 10 }: CountryParams = req.body;
  
      const pageNumber = Number(page);
      const limitNumber = Number(limit);
      const searchQuery = `%${searchItem}%`;
  
      console.log("🔍 Search Term:", searchItem);
  
      let total = 0;
      let countResult: any[] = [];
      let result: any[] = [];
  
      // Count the total records
      if (searchItem && searchItem.trim() !== '') {
        const sqlCount = `SELECT COUNT(*) as Total FROM countries WHERE rate LIKE ? OR deposit_currency LIKE ? OR settled_currency LIKE ?`;
        countResult = await mysqlcon(sqlCount, [searchQuery, searchQuery, searchQuery]);
      } else {
        const sqlCount = `SELECT COUNT(*) as Total FROM countries`;
        countResult = await mysqlcon(sqlCount);
      }
  
      total = countResult[0]?.Total || 0;
      const { start, numOfPages } = pagination(total, pageNumber, limitNumber);
  
      // Fetch the data based on search criteria
      if (searchItem && searchItem.trim() !== '') {
        const sqlData = `SELECT * FROM countries WHERE rate LIKE ? OR deposit_currency LIKE ? OR settled_currency LIKE ? LIMIT ?, ?`;
        result = await mysqlcon(sqlData, [searchQuery, searchQuery, searchQuery, start, limitNumber]);
      } else {
        const sqlData = `SELECT * FROM countries LIMIT ?, ?`;
        result = await mysqlcon(sqlData, [start, limitNumber]);
      }
  
      // Return the results with pagination info
      res.status(result.length > 0 ? 200 : 201).json({
        message: `Showing ${result.length} from ${total} data`,
        currentPage: pageNumber,
        totalPages: numOfPages,
        pageLimit: limitNumber,
        data: result
      });
  
    } catch (error) {
      console.error('❌ Error in defaultCountries:', error);
      res.status(500).json({
        message: 'Error occurred',
        error
      });
    }
  }


  async deleteApiii(req: Request, res: Response): Promise<void> {
    try {
      const { id }: deleteapi = req.body;

      // if (!id || typeof id !== 'number') {
      //   res.status(400).json({ message: "Invalid or missing ID" });
      // }

      console.log("Attempting to delete ID:", id);

      const sql = "DELETE FROM countries WHERE id = ?";
      const result = await mysqlcon(sql, [id]);

      console.log("Delete result:", result);

      if (result.affectedRows > 0) {
        res.status(200).json({
          message: "Row deleted successfully",
          data: result,
        });
      } else {
        res.status(404).json({
          message: `No row found with ID ${id}`,
          data: result,
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({
        message: 'Error occurred',
        error,
      });
    }
  }

  async addCountry(req: Request, res: Response): Promise<void> {
    try {
      const { name, currency, sortname, symbol }: CountryInput = req.body;

      const details = {
        name,
        currency,
        sortname,
        symbol
      };

      const sql = "INSERT INTO countries SET ?";
      const result = await mysqlcon(sql, [details]);

      if (result && result.affectedRows > 0) {
        res.status(200).json({
          message: "Data Inserted Successfully ✅",
          data: details
        });
      } else {
        res.status(201).json({
          message: "Error While Creating ❌"
        });
      }
    } catch (error) {
      res.status(500).json({
        message: "An error occurred",
        error
      });
    }
  };


}


export default new Countries();

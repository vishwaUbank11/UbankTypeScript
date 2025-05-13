import { Request, Response } from 'express';
import mysqlcon from '../config/db_connection';

interface Pagination {
    limit: number;
    start: number;
    numOfPages: number;
}
  
  interface CustomRequestBody {
    from?: string;
    to?: string;
    merchantName?: string;
    searchText?: string | number;
    page?: number;
    limit?: number;
    status?: string;
    id?: string;
  }

  interface toogleResponse{
    status?: string;
    id?: string;
  }
  
  const pagination = (total: number, page: number, limit: number): Pagination => {
    const numOfPages = Math.ceil(total / limit);
    const start = page * limit - limit;
    return { limit, start, numOfPages };
  };


class transMEOD {
    async defaultMEOD(req:Request,res:Response):Promise<void>{
        try {
            let { from, to, merchantName, searchText } = req.body;

            if (['Update', 'update', 'UPDATE'].includes(searchText as string)) searchText = 0;
            if (['Updated', 'updated', 'UPDATED'].includes(searchText as string)) searchText = 1;

            let sqld = '';

            if (from && to) {
            sqld += ` AND DATE(tbl_per_day_payin_records.created_on) >= '${from}' AND DATE(tbl_per_day_payin_records.created_on) <= '${to}'`;
            if (merchantName) {
                sqld += ` AND tbl_per_day_payin_records.users_id = '${merchantName}'`;
            }
            } else if (merchantName) {
            sqld += ` AND tbl_per_day_payin_records.users_id = '${merchantName}'`;
            }

            const sqlM = 'SELECT id, name FROM tbl_user WHERE status = 1 AND complete_profile = 1';
            const resultM = await mysqlcon(sqlM);

            let sql = 'SELECT COUNT(*) as Total FROM tbl_user INNER JOIN tbl_per_day_payin_records ON tbl_user.id = tbl_per_day_payin_records.users_id WHERE tbl_user.status = 1 AND tbl_user.complete_profile = 1';
            if (from || to || merchantName) sql += sqld;

            if (searchText === 0 || searchText === 1) {
            sql += ` AND (tbl_per_day_payin_records.wallet_status = ${searchText})`;
            } else if (searchText) {
            sql += ` AND ((tbl_per_day_payin_records.date LIKE '%${searchText}%') OR (tbl_per_day_payin_records.no_of_trx LIKE '%${searchText}%') OR (DATE(tbl_per_day_payin_records.created_on) LIKE '%${searchText}%') OR (DATE(tbl_per_day_payin_records.updated_on) LIKE '%${searchText}%'))`;
            }

            const result = await mysqlcon(sql);
            const total = result[0].Total;
            const Page = req.body.page ? Number(req.body.page) : 1;
            const limit = req.body.limit ? Number(req.body.limit) : 10;
            const page = pagination(total, Page, limit);

            let sql1 = 'SELECT tbl_user.name, tbl_per_day_payin_records.* FROM tbl_user INNER JOIN tbl_per_day_payin_records ON tbl_user.id = tbl_per_day_payin_records.users_id WHERE tbl_user.status = 1 AND tbl_user.complete_profile = 1';
            if (from || to || merchantName) sql1 += sqld;

            if (searchText === 0 || searchText === 1) {
            sql1 += ` AND (tbl_per_day_payin_records.wallet_status = ${searchText})`;
            } else if (searchText) {
            sql1 += ` AND ((tbl_per_day_payin_records.date LIKE '%${searchText}%') OR (tbl_per_day_payin_records.no_of_trx LIKE '%${searchText}%') OR (DATE(tbl_per_day_payin_records.created_on) LIKE '%${searchText}%') OR (DATE(tbl_per_day_payin_records.updated_on) LIKE '%${searchText}%'))`;
            }

            sql1 += ' ORDER BY created_on DESC LIMIT ?, ?';

            const result1 = await mysqlcon(sql1, [page.start, page.limit]);

            if (result1.length === 0) {
            res.status(201).json({ message: 'No Record Found', data: result1 });
            return;
            }

            const baseResponse = {
            currentPage: Page,
            totalPages: page.numOfPages,
            pageLimit: page.limit,
            merchants: resultM,
            data: result1,
            };

            if (from && to) {
            const message = merchantName
                ? `All Records are ${total} from date ${from} to ${to} for merchant id ${merchantName}`
                : `All Records are ${total} from date ${from} to ${to}`;
            res.status(200).json({ message, ...baseResponse });
            return;
            } else if (merchantName) {
            res.status(200).json({
                message: `All Records are ${total} for merchant id ${merchantName}`,
                ...baseResponse,
            });
            return;
            }

            res.status(200).json({ message: `All Records are ${total}`, ...baseResponse });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Error occurred', error });
        }
    }

    async toggleStatusMEOD(req: Request<toogleResponse>, res: Response): Promise<void>{
        try {
          const { status, id } = req.body;
      
          const sql = 'UPDATE tbl_per_day_payin_records SET wallet_status = ? WHERE id = ?';
          const result = await mysqlcon(sql, [status, id]);
      
          if (result.affectedRows > 0) {
            res.status(200).json({
              message: `Status ${status === '1' ? 'Updated' : 'Update'} Successfully`,
            });
          } else {
            res.status(201).json({ message: 'Error while Changing Status' });
          }
        } catch (error) {
          res.status(500).json({ message: 'Error occurred', error });
        }
      };
}

export default new transMEOD





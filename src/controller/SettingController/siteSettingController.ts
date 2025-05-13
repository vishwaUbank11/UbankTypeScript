import { Request, Response } from 'express';
import mysqlcon from '../../config/db_connection';

let today = new Date();
let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
let time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
let dateTime = date + ' ' + time;

interface SiteSettingUpdateRequest {
  contact_no: string;
  email: string;
  skype: string;
  copyright: string;
  full_address: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  google_plus: string;
  id: number; // The ID of the setting being updated
}

class sitesettingclass{

  async siteSetting(req: Request, res: Response): Promise<void>  {
    try {
      const sql: string = "SELECT * FROM tbl_setting";
      const result = await mysqlcon(sql);  
  
      if (result.length === 0) {
         res.status(201).json({
          message: "No Data Found",
          data: result[0],  
        });
      } else {
         res.status(200).json({
          message: "Data Fetched Successfully✅",
          data: result 
        });
      }
    } catch (error) {
       res.status(500).json({
        message: "error occurred",
        error: error instanceof Error ? error.message : error,  
      });
    }




} 
async readUpdateSiteSetting(req: Request, res: Response): Promise<void>  {
  try {
    const { id }: { id: number } = req.body; 

    const sql: string = "SELECT * FROM tbl_setting WHERE id = ?";
    const result = await mysqlcon(sql, [id]);  

    if (result.length === 0) {
       res.status(404).json({
        message: "Data Not Found",
        data: null,
      });
    }

     res.status(200).json({
      message: "Data Fetched Successfully✅",
      data: result 
    });
  } catch (error) {
     res.status(500).json({
      message: "Error occurred",
      error: error instanceof Error ? error.message : error,  // Ensure error is returned properly
    });
  }


}
async updateSiteSettin(req: Request, res: Response): Promise<void> {
  try {
    const {contact_no, email,skype,copyright,full_address,facebook, twitter, linkedin, google_plus, id,}: SiteSettingUpdateRequest = req.body; 

    const details = {
      contact_no,
      email,
      skype,
      copyright,
      full_address,
      facebook,
      twitter,
      linkedin,
      google_plus,
    };

    if (id) {
      const sql: string = "UPDATE tbl_setting SET ? WHERE id = ?";
      const result: any = await mysqlcon(sql, [details, id]); 

      if (result.affectedRows > 0) {
         res.status(200).json({
          message: "Site Updated ✅",
          data:details
        });
      } else {
         res.status(400).json({
          message: "Error while updating",
        });
      }
    } else {
       res.status(400).json({
        message: "Kindly Provide Id",
      });
    }
  } catch (error) {
     res.status(500).json({
      message: "Error occurred",
      error: error instanceof Error ? error.message : error, 
    });
  }


}

}
export default new sitesettingclass
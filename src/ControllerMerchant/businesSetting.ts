import { Request, Response } from 'express';
import mysqlcon from "../config/db_connection";
import nodemailer from 'nodemailer';
import { AuthenticatedRequest } from './userInterface'; 
import path from 'path';
const filepath = path.join(__dirname, '../uploads/documents'); // or wherever your uploaded files are stored


  interface TabMapEntry {
    sql: string;
    message: string;
  }

  interface MysqlResult {
    changedRows: number;
  }

  interface Country {
    id: number;
    name: string;
    sortname: string;
    support_payment_method: string;
    methods?: PaymentMethod[];
  }
  
  interface PaymentMethod {
    id: number;
    name: string;
    type: string;
  }

  interface File {
    originalname: string;
  }
  
  interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
  }
  
  interface Files {
    image: UploadedFile[];
    image1: UploadedFile[];
    image2: UploadedFile[];
    image3: UploadedFile[];
  }
  
  interface DocumentData {
    merchant_id: string;
    llp_business_identity?: string;
    llp_business_existence?: string;
    llp_business_owners?: string;
    llp_business_working?: string;
    prtnr_business_identity?: string;
    prtnr_business_existence?: string;
    prtnr_business_working?: string;
    prtnr_business_owners?: string;
    sole_business_identity_existence?: string;
    sole_business_working?: string;
    sole_business_owners?: string;
    sole_address_owner?: string;
    ngo_business_identity?: string;
    ngo_business_existence?: string;
    ngo_business_working?: string;
    ngo_business_owners?: string;
  }

const BusinesSetting = {
  default: async (req: AuthenticatedRequest, res: Response):Promise<void> =>{
  try {
    const user = req.user!;
    console.log(user);
    
    const ID = user.account_type === 3 ? user.parent_id! : user.id;
    const { tab }: { tab: string } = req.body;

    const getResult = async (sql: string, params: any[] = [ID]) => (await mysqlcon(sql, params))[0];

    switch (tab) {
      case "1": {
        const userQuery = `
          SELECT bname, trading_dba, blocation, busines_Code, busines_Country,
                 fname, lname, main_contact_email, company_website_target_live_date, payoutCountries
          FROM tbl_user WHERE id = ?
        `;
        const [result] = await Promise.all([
          mysqlcon(userQuery, [ID]),
        ]);

        res.status(200).json({
          success: true,
          message: "Company Profile",
          result: result[0],
        });
      }

      case "2": {
        const sql = `
          SELECT solution_apply_for_country, mode_of_solution
          FROM tbl_user WHERE id = ?
        `;
        const result = await getResult(sql);

        const modes = result.mode_of_solution
          .split(",")
          .map((mode: string) => mode.split(".")[1]);

        const groupMap: { [key: string]: string } = {
          "1": "1",
          "2": "2,3,4,5",
          "3": "2,3,4,5",
          "4": "2,3,4,5",
          "5": "2,3,4,5",
          "10": "10",
          "11": "11",
          "12": "12",
        };

        const groupedModes = [...new Set(modes.map((mode: string) => groupMap[mode]).filter((value: string | undefined): value is string => typeof value === 'string'))].join(',');
        res.status(200).json({
          success: true,
          message: "Solution Apply for Country",
          solution_apply_for_country: result.solution_apply_for_country,
          mode_of_solution: groupedModes,
        });
      }

      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8": {
        const tabMap: { [key: string]: TabMapEntry } = {
          "3": {
            sql: `SELECT director1_name, director1_dob, director1_nationality,
                         director2_name, director2_dob, director2_nationality FROM tbl_user WHERE id = ?`,
            message: "Director's Info",
          },
          "4": {
            sql: `SELECT shareholder1_name, shareholder1_dob, shareholder1_nationality,
                         shareholder2_name, shareholder2_dob, shareholder2_nationality FROM tbl_user WHERE id = ?`,
            message: "Shareholder Info",
          },
          "5": {
            sql: `SELECT comp_officer_name, comp_officer_phone,
                         comp_officer_address, comp_officer_email FROM tbl_user WHERE id = ?`,
            message: "Compliance Officer Info",
          },
          "6": {
            sql: `SELECT website, job_title, company_estimated_monthly_volume,
                         company_avarage_ticket_size FROM tbl_user WHERE id = ?`,
            message: "Business Info",
          },
          "7": {
            sql: `SELECT settle_currency, wallet_url FROM tbl_user WHERE id = ?`,
            message: "Settlement Info",
          },
          "8": {
            sql: `SELECT id, secretkey FROM tbl_user WHERE id = ?`,
            message: "Keys",
          },
        };

        const { sql, message } = tabMap[tab];
        const result = await getResult(sql);
        res.status(200).json({ success: true, message, result });
      }

      case "9": {
        const questionsSql = `
          SELECT q.question, a.answer 
          FROM tbl_login_security q
          JOIN tbl_merchnat_answer a ON q.id = a.question 
          WHERE a.user_id = ?
        `;
        const statusSql = `SELECT security_status FROM tbl_user WHERE id = ?`;

        const [questions, [toggle]] = await Promise.all([
          mysqlcon(questionsSql, [ID]),
          mysqlcon(statusSql, [ID]),
        ]);

         res.status(200).json({
          success: true,
          message: "Q&A",
          result: questions,
          toggle,
        });
      }

      case "10": {
        const sql = `
          SELECT merchant_id, upi_id, status, create_on, update_on
          FROM tbl_upi_block WHERE merchant_id = ?
        `;
        const result = await mysqlcon(sql, [ID]);
        res.status(200).json({
          success: true,
          message: "UPI Block Info",
          result,
        });
      }

      case "11": {
        try {
          const mode = user.mode_of_solution!
            .split(",")
            .map((item) => item.split("."));

          const countryIds = mode.map((item) => item[0]);
          const modeIds = mode.map((item) => item[1]);

          const [countries, paymentMethods] = await Promise.all([
            mysqlcon("SELECT id, name, sortname, support_payment_method FROM countries WHERE id IN (?)", [countryIds]),
            mysqlcon("SELECT id as mode, name, type FROM payment_method WHERE id IN (?)", [modeIds]),
          ]);

          const data: {
            country: string;
            sortname: string;
            name: string;
            type: string;
          }[] = [];

          countries.forEach((country: any) => {
            const supportedModes = country.support_payment_method.split(",");
            paymentMethods.forEach((method: any) => {
              if (supportedModes.includes(method.mode)) {
                data.push({
                  country: country.name,
                  sortname: country.sortname,
                  name: method.name,
                  type: method.type,
                });
              }
            });
          });

           res.status(200).json({ data });
        } catch (error) {
          console.error(error);
          res.status(500).json({
            message: "An error occurred",
            error,
          });
        }
      }

      default:
        res.status(400).json({
          success: false,
          message: "Invalid tab value or something went wrong.",
        });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err,
    });
  }
  },

  toggleQNA: async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    try {
      const user = req.user!;
      const ID = user.account_type === 3 ? user.parent_id : user.id;
      const { toggle } = req.body as { toggle?: string };
      if (!toggle) {
        res.status(400).json({ message: "Error in Toggle" });
      }
      const sqlToggle = "UPDATE tbl_user SET security_status = ? WHERE id = ?";
      await mysqlcon(sqlToggle, [toggle, ID]);
      res.status(200).json({
        success: true,
        result: "Authentication successfully changed"
      });
      }catch (error) {
        res.status(500).json({
          success: false,
          message: "somthing went wrong",
          error
        });
      } 
  },

  blockToggle: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
    try {
      const { status, id } = req.body;
  
      if (status === undefined || !id) {
        res.status(400).json({ message: "Error in Status change" });
        return;
      }
  
      const sqlToggle = "UPDATE tbl_upi_block SET status = ?, create_on = NOW() WHERE upi_id = ?";
      const result: MysqlResult = await mysqlcon(sqlToggle, [status, id]);
  
      res.status(200).json({
        success: true,
        result: result.changedRows === 0 ? "No Change" : "Successfully Changed"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Something went wrong",
        error
      });
    }
  },

  download: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const user = req.user!;
    const ID = user.account_type === 3 ? user.parent_id : user.id;
    try {
      const { mode_of_solution } = user;
      // const mode = mode_of_solution.split(",").map((item) => item.split("."));
      const mode = (mode_of_solution ?? "").split(",").map((item) => item.split("."));
      const sqlCountries = "SELECT id,name, sortname,support_payment_method FROM countries WHERE id IN (?)";
      const country_method: Country[] = await mysqlcon(sqlCountries, [mode.map((item) => item[0])]);
      const sqlPayment_method = "SELECT id,name,type FROM `payment_method` WHERE status = 1";
      const payment_result: PaymentMethod[] = await mysqlcon(sqlPayment_method);
      for (let i = 0; i < country_method.length; i++) 
      {
        const method_arr = country_method[i].support_payment_method.split(",");
        const loc_arr = payment_result.filter((pm) => method_arr.includes(pm.id.toString()));
        country_method[i].methods = loc_arr;
      }
      const defaultSql = `SELECT name, email, complete_profile, id, secretkey, bname, trading_dba, blocation, busines_Code, fname, lname,main_contact_email, director1_name, director1_dob, director1_nationality, director2_name, director2_dob, director2_nationality, shareholder1_name, shareholder1_dob, shareholder1_nationality, shareholder2_name,shareholder2_dob, shareholder2_nationality, website, job_title, company_estimated_monthly_volume,company_avarage_ticket_size, settle_currency, wallet_url FROM tbl_user WHERE id = ?`;

      const bcountrySql = `SELECT countries.name FROM countries INNER JOIN tbl_user ON countries.id = tbl_user.busines_Country WHERE tbl_user.id = ?`;
      const defaultResult = await mysqlcon(defaultSql, [ID]);
      const bcountryResult = await mysqlcon(bcountrySql, [ID]);
      res.status(200).json({
        default: defaultResult,
        buisness_country: bcountryResult,
        countryResult: country_method,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Something went wrong in reports",
      });
    }
  },

  uploadDocument: async(req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const { id } = req.body;
  const filterType: number = req.body.filterType ? Number(req.body.filterType) : 1;

  // Ensure that req.files is typed correctly
  const files = req.files as unknown as Files;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'kr.manjeet319@gmail.com',
      pass: 'mfvadlyccsgukabu',
    },
  });

  const mailOptions = {
    from: 'kr.manjeet319@gmail.com',
    to: 'anisha16rawat@gmail.com',
    subject: 'Send Attachment',
    html: '<h1>Hello, This is Attachment !!</h1><p>This is test mail..!</p>',
    attachments: [
      { filename: files.image[0].originalname, path: filepath + "/" + files.image[0].originalname },
      { filename: files.image1[0].originalname, path: filepath + "/" + files.image1[0].originalname },
      { filename: files.image2[0].originalname, path: filepath + "/" + files.image2[0].originalname },
      { filename: files.image3[0].originalname, path: filepath + "/" + files.image3[0].originalname },
    ],
  };

  const llp: DocumentData = {
    merchant_id: id,
    llp_business_identity: files.image[0].originalname,
    llp_business_existence: files.image1[0].originalname,
    llp_business_owners: files.image2[0].originalname,
    llp_business_working: files.image3[0].originalname,
  };

  const prtnr: DocumentData = {
    merchant_id: id,
    prtnr_business_identity: files.image[0].originalname,
    prtnr_business_existence: files.image1[0].originalname,
    prtnr_business_working: files.image2[0].originalname,
    prtnr_business_owners: files.image3[0].originalname,
  };

  const sole: DocumentData = {
    merchant_id: id,
    sole_business_identity_existence: files.image[0].originalname,
    sole_business_working: files.image1[0].originalname,
    sole_business_owners: files.image2[0].originalname,
    sole_address_owner: files.image3[0].originalname,
  };

  const ngo: DocumentData = {
    merchant_id: id,
    ngo_business_identity: files.image[0].originalname,
    ngo_business_existence: files.image1[0].originalname,
    ngo_business_working: files.image2[0].originalname,
    ngo_business_owners: files.image3[0].originalname,
  };

  try {
    const sql = 'SELECT kyc_type FROM tbl_user WHERE id = ?';
    const result = await mysqlcon(sql, [id]);
    const test = result[0].kyc_type;

    if (test !== 0) {
      const updateQuery = (type: string, data: DocumentData) => {
        const updateSql = 'UPDATE kyc_document SET ?, created_on = now(), modified_on = now() WHERE merchant_id = ?';
        return mysqlcon(updateSql, [data, id]);
      };

      if (test === 'llp') {
        await updateQuery('llp', llp);
      } else if (test === 'prtnr') {
        await updateQuery('prtnr', prtnr);
      } else if (test === 'sole') {
        await updateQuery('sole', sole);
      } else if (test === 'ngo') {
        await updateQuery('ngo', ngo);
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.status(500).json({ message: 'Error' });
        } else {
          res.status(200).json({ message: 'Documents Uploaded' });
        }
      });

    } else {
      const insertQuery = (type: string, data: DocumentData) => {
        const insertSql = 'INSERT INTO kyc_document SET ?, created_on = now(), modified_on = now()';
        const userSql = `UPDATE tbl_user SET kyc_type = ? WHERE id = ?`;
        return mysqlcon(insertSql, [data]).then(() =>
          mysqlcon(userSql, [type, id])
        );
      };

      if (filterType === 1) {
        await insertQuery('llp', llp);
      } else if (filterType === 2) {
        await insertQuery('prtnr', prtnr);
      } else if (filterType === 3) {
        await insertQuery('sole', sole);
      } else if (filterType === 4) {
        await insertQuery('ngo', ngo);
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.status(500).json({ message: 'Error' });
        } else {
          res.status(200).json({ message: 'Documents Uploaded' });
        }
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error' });
  }
  },





}
export default BusinesSetting;


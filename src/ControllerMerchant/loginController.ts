import { Request, Response } from 'express';
import emailvalidator from 'email-validator';
import md5 from 'md5';
import mysqlcon from '../config/db_connection';
import config from '../config/config';
import otpGenerator from 'otp-generator';
import path from 'path';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

const formatted_date = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
const webhookUrl = 'https://hooks.slack.com/services/your/hook/url'

const loginAttempts = new Map<string, number>();

interface RegisterRequest extends Request {
  body: {
    email: string;
    confirm_email: string;
    password: string;
    confirm_password: string;
    user_id?: number;
  };
}

interface RegisterResponse {
  status: boolean;
  message: string;
  data: any[];
}

// interface AuthenticatedRequest extends Request {
//   user?: any; // You can define proper user type here if available
// }

interface CompanyProfileRequest {
  company_name: string;
  trading_dba: string;
  registered_address: string;
  company_registration_no: string;
  country_of_incorporation: string;
  main_contact_person: string;
  main_contact_email: string;
}

interface SolutionApplyRequest {
  solution_apply_for_country: string;
  mode_of_solution: string;
}

export interface DirectorInfoRequest {
  director1_name: string;
  director1_dob: string;
  director1_nationality: string;
  director2_name?: string;
  director2_dob?: string;
  director2_nationality?: string;
  main_contact_email?: string;
}

export interface SaveShareholder_info{
  shareholder1_name: string,
  shareholder1_dob: string,
  shareholder1_nationality: string,
  shareholder2_name: string,
  shareholder2_dob: string,
  shareholder2_nationality: string,
  main_contact_email: string,
}

export interface SaveBusiness_info{
  website: string,
  job_title: string,
  company_estimated_monthly_volume:string,
  company_avarage_ticket_size: string,
}

export interface SaveSettelment_info{
  settle_currency: string,
  wallet_url: string,
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

interface QuestionAnswerRequest {
  question_id1?: number;
  answer1?: string;
  question_id2?: number;
  answer2?: string;
  question_id3?: number;
  answer3?: string;
}

interface ForgotPasswordRequest extends Request {
  body: {
    newpassword: string;
    confirmPassword: string;
    userVerificationToken: string;
  };
}

interface UploadedFile extends File {
  originalname: string;
  path: string;
  filename: string;
}

export interface KycRequest extends Request {
  body: {
    filterType?: string;
  };
  files?: {
    image?: Express.Multer.File[];
    image1?: Express.Multer.File[];
    image2?: Express.Multer.File[];
    image3?: Express.Multer.File[];
  };
}

export interface User {
    id: number;
    email: string;
    password: string;
    complete_profile: number;
    status: number;
    account_type: number;
    token?: string;
    [key: string]: any; // for other dynamic fields
}

const loginCont = {
  register: async function (req: RegisterRequest, res: Response<RegisterResponse>): Promise<void> {
    try {
      const { email, confirm_email, password, confirm_password, user_id } = req.body;

      if (!email || !password || !confirm_email || !confirm_password) {
        res.status(201).json({
          status: false,
          message: 'Enter a valid email id and password',
          data: [],
        });
        return;
      }

      if (!emailvalidator.validate(email)) {
        res.status(201).json({
          status: false,
          message: 'Enter a valid email id',
          data: [],
        });
        return;
      }

      if (email !== confirm_email) {
        res.status(201).json({
          status: false,
          message: 'Email and confirm email do not match',
          data: [],
        });
        return;
      }

      if (password !== confirm_password) {
        res.status(201).json({
          status: false,
          message: 'Password and confirm password do not match',
          data: [],
        });
        return;
      }

      let sql = 'SELECT id, email FROM tbl_user WHERE ?';
      let params: any = { email };

      if (user_id) {
        sql = 'SELECT id, email FROM tbl_user WHERE email = ? AND id != ?';
        params = [email, user_id];
      }

      const dbquery: any[] = await mysqlcon(sql, params);

      if (dbquery[0]) {
        res.status(202).json({
          status: false,
          message: 'Email ID already exists',
          data: [],
        });
        return;
      }

      if (user_id) {
        const updateData = {
          email,
          password: md5(password),
          updated_on: formatted_date,
        };

        const updateResult = await mysqlcon('UPDATE tbl_user SET ? WHERE id = ?', [updateData, user_id]);

        if (!updateResult) {
          res.status(201).json({
            status: false,
            message: 'Error updating profile',
            data: [],
          });
        } else {
          res.status(200).json({
            status: true,
            message: 'Profile saved successfully',
            data: [updateResult.insertId],
          });
        }
      } else {
        const secret_key = otpGenerator.generate(8, { upperCaseAlphabets: true, specialChars: false });
        const test_secret_key = otpGenerator.generate(8, { upperCaseAlphabets: true, specialChars: false });
        const verification_token = otpGenerator.generate(8, { upperCaseAlphabets: true, specialChars: false });

        const newUser = {
          parent_id: 0,
          account_type: 1,
          email,
          password: md5(password),
          status: 0,
          secretkey: secret_key,
          test_secretkey: test_secret_key,
          created_on: formatted_date,
          updated_on: formatted_date,
          verification_token,
        };

        const result = await mysqlcon('INSERT INTO tbl_user SET ?', newUser);

        if (!result) {
          res.status(201).json({
            status: false,
            message: 'Error creating profile',
            data: [],
          });
        } else {
          jwt.sign(
            { id: result.insertId },
            config.JWT_SECRET,
            {
                expiresIn:  config.JWT_EXPIRY as jwt.SignOptions['expiresIn']
              },
            (err, token) => {
              if (err || !token) {
                throw err;
              }

              const response = {
                id: result.insertId,
                user_id: result.insertId,
                token,
              };

              const page_path = path.join(__dirname, '../views/signup.ejs');
              console.log(page_path);

            //   send_mail.mail(
            //     { email, password, subject: 'Verification Email' },
            //     'signup'
            //   );

              res.status(200).json({
                status: true,
                message: 'Profile created successfully',
                data: [response],
              });
            }
          );
        }
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({
        status: false,
        message: 'Error completing the task.',
        data: [],
      });
    }
  },

  company_profile: async function (req: AuthenticatedRequest, res: Response): Promise<void>{
    const user = req.user;

  if (!user) {
    res.status(401).json({ status: false, message: 'Unauthorized', data: [] });
    return;
  }

  try {
    const request: Partial<CompanyProfileRequest> = req.body;

    const validateFields: (keyof CompanyProfileRequest)[] = [
      "company_name",
      "trading_dba",
      "registered_address",
      "company_registration_no",
      "country_of_incorporation",
      "main_contact_person",
      "main_contact_email"
    ];

    let missingFields: string[] = [];
    let messageStr = "";

    for (const field of validateFields) {
      if (!request[field]) {
        missingFields.push(field);
        messageStr += `<p>${field} is required</p>`;
      }
    }

    if (missingFields.length > 0) {
      res.status(400).json({ status: false, message: messageStr, data: missingFields });
      return;
    }

    // const formatted_date = moment().format('YYYY-MM-DD HH:mm:ss');

    const companyData = {
      bname: request.company_name,
      trading_dba: request.trading_dba,
      blocation: request.registered_address,
      busines_Code: request.company_registration_no,
      busines_Country: request.country_of_incorporation,
      name: request.main_contact_person,
      main_contact_email: request.main_contact_email,
      fname: request.main_contact_person,
      lname: request.main_contact_person,
      updated_on: formatted_date
    };

    const sql = "UPDATE tbl_user SET ? WHERE id = ?";
    const result = await mysqlcon(sql, [companyData, user.id]);

    if (result) {
      res.status(200).json({ status: true, message: "Saved successfully", data: [] });
    }

  } catch (error) {
    console.error("Error updating company profile:", error);
    res.status(500).json({ status: false, message: "Error to complete task.", data: [] });
  }

  },

  save_country_solution_apply: async function (req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user;

  if (!user) {
    res.status(401).json({ status: false, message: 'Unauthorized', data: [] });
    return;
  }

  try {
    const request: Partial<SolutionApplyRequest> = req.body;

    const requiredFields: (keyof SolutionApplyRequest)[] = ['solution_apply_for_country', 'mode_of_solution'];

    let missingFields: string[] = [];
    let errorMessage = '';

    for (const field of requiredFields) {
      if (!request[field]) {
        errorMessage += `${field} is required. `;
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      res.status(400).json({ status: false, message: errorMessage, data: missingFields });
      return;
    }

    const companyData = {
      solution_apply_for_country: request.solution_apply_for_country,
      mode_of_solution: request.mode_of_solution
    };

    const sql = 'UPDATE tbl_user SET ? WHERE id = ?';
    const dbquery = await mysqlcon(sql, [companyData, user.id]);

    if (dbquery) {
      res.status(200).json({ status: true, message: 'Saved successfully', data: [] });
    } else {
      res.status(500).json({ status: false, message: 'Database update failed', data: [] });
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: false, message: 'Error to complete task.', data: [] });
  }
  },

  save_director_info: async function (req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
  
      if (!user || !user.id) {
        res.status(401).json({ status: false, message: "Unauthorized user" });
        return;
      }
  
      const request = req.body as DirectorInfoRequest;
  
      const requiredFields = [
        "director1_name",
        "director1_dob",
        "director1_nationality",
      ];
  
      let missingFields: string[] = [];
      let messageStr = "";
  
      for (const field of requiredFields) {
        if (!request[field as keyof DirectorInfoRequest]) {
          messageStr += `<p>${field} is required</p>`;
          missingFields.push(field);
        }
      }
  
      if (missingFields.length > 0) {
        res.status(201).json({
          status: false,
          message: messageStr,
          data: missingFields,
        });
        return;
      }
  
      const user_id = req.user?.id;;
  
      const director_info = {
        director1_name: request.director1_name,
        director1_dob: request.director1_dob,
        director1_nationality: request.director1_nationality,
        director2_name: request.director2_name,
        director2_dob: request.director2_dob,
        director2_nationality: request.director2_nationality,
        main_contact_email: request.main_contact_email,
        updated_on: formatted_date,
      };
  
      const sql = "UPDATE tbl_user SET ? WHERE id = ?";
      const dbquery = await mysqlcon(sql, [director_info, user_id]);
  
      if (dbquery) {
        res.status(200).json({
          status: true,
          message: "Saved successfully",
          data: dbquery,
        });
      } else {
        res.status(500).json({
          status: false,
          message: "Database update failed",
          data: [],
        });
      }
    } catch (e) {
      res.status(500).json({
        status: false,
        message: "Error to complete task.",
        data: [],
      });
    }
  },

  save_shareholder_info: async function (req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
  
      if (!user || !user.id) {
        res.status(401).json({ status: false, message: "Unauthorized user" });
        return;
      }
  
      const request = req.body as SaveShareholder_info;
  
      const requiredFields = [
        "shareholder1_name",
        "shareholder1_dob",
        "shareholder1_nationality",
      ];
  
      let missingFields: string[] = [];
      let messageStr = "";
  
      for (const field of requiredFields) {
        if (!request[field as keyof SaveShareholder_info]) {
          messageStr += `<p>${field} is required</p>`;
          missingFields.push(field);
        }
      }
  
      if (missingFields.length > 0) {
        res.status(201).json({
          status: false,
          message: messageStr,
          data: missingFields,
        });
        return;
      }
  
      const user_id =  req.user?.id;
  
      const shareholder_info = {
        shareholder1_name: request.shareholder1_name,
        shareholder1_dob: request.shareholder1_dob,
        shareholder1_nationality: request.shareholder1_nationality,
        shareholder2_name: request.shareholder2_name || null,
        shareholder2_dob: request.shareholder2_dob || null,
        shareholder2_nationality: request.shareholder2_nationality || null,
        main_contact_email: request.main_contact_email || null,
        updated_on: formatted_date,
      };
  
      const sql = "UPDATE tbl_user SET ? WHERE id = ?";
      const dbquery = await mysqlcon(sql, [shareholder_info, user_id]);
  
      if (dbquery) {
        res.status(200).json({
          status: true,
          message: "Saved successfully",
          data: [],
        });
      } else {
        res.status(500).json({
          status: false,
          message: "Database update failed",
          data: [],
        });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({
        status: false,
        message: "Error to complete task.",
        data: [],
      });
    }
  },

  save_business_info: async function(req: AuthenticatedRequest, res: Response): Promise<void> {
    let user = req.user;
    
    var bconnect = {};
    try {
      const request = req.body as SaveBusiness_info;

    const requiredFields: (keyof SaveBusiness_info)[] = [
      "website",
      "job_title",
      "company_estimated_monthly_volume",
      "company_avarage_ticket_size",
    ];

    let reqStr = "";
    let reqArr: string[] = [];

    for (const field of requiredFields) {
      if (!request[field]) {
        reqStr += `<p>${field} is required</p>`;
        reqArr.push(field);
      }
    }

    if (reqArr.length > 0) {
      res.status(201).json({
        status: false,
        message: reqStr,
        data: reqArr,
      });
      return;
    }

    const business_info = {
      website: request.website,
      job_title: request.job_title || null,
      company_estimated_monthly_volume: request.company_estimated_monthly_volume,
      company_avarage_ticket_size: request.company_avarage_ticket_size,
      updated_on: formatted_date,
    };
    const user_id = req.user?.id;
    const sql = "UPDATE tbl_user SET ? WHERE id = ?";
    const dbquery = await mysqlcon(sql, [business_info, user_id]);

    if (dbquery) {
      res.status(200).json({
        status: true,
        message: "Saved successfully",
        data: [],
      });
    } else {
      res.status(500).json({
        status: false,
        message: "Failed to save business info",
        data: [],
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: false,
      message: "Error to complete task.",
      data: [],
    });
  }
  },

  save_settelment_info: async function(req: AuthenticatedRequest, res: Response): Promise<void> {
    let user = req.user;
    // res.send(users);
    var bconnect = {};
    try {
      const request = req.body as SaveSettelment_info;
      console.log(request);
      const requiredFields: (keyof SaveSettelment_info)[] = [
        "settle_currency",
        "wallet_url",
      ];

      let reqStr = "";
    let reqArr: string[] = [];

    for (const field of requiredFields) {
      if (!request[field]) {
        reqStr += `<p>${field} is required</p>`;
        reqArr.push(field);
      }
    }

    if (reqArr.length > 0) {
      res.status(201).json({
        status: false,
        message: reqStr,
        data: reqArr,
      });
      return;
    }

    const user_id = req.user?.id;
    const settelment_info = {
          settle_currency: request.settle_currency,
          wallet_url: request.wallet_url,
          complete_profile: 1,
          updated_on: formatted_date,
    };
    
    const sql = "UPDATE tbl_user SET ? WHERE id = ? ";
    const dbquery = await mysqlcon(sql, [settelment_info, user_id]);
    if (dbquery) {
      res.status(200).json({ 
        status: true, 
        resmessage: "Saved successfully", 
        data: [] 
      });
    }else {
      res.status(201).json({
        status: false,
        message: "Settelment informations are required",
        data: [],
      });
    }
    } catch (e) {
      res.status(500).json({ 
        status: false, 
        message: "Error to complete task.", 
        data: [] 
      });
    } 
  },

  login: async function (req: Request, res: Response): Promise<void> {
    const request = req.body;
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      'unknown';

    if (!request) {
      res.status(201).json({
        status: false,
        message: 'Enter valid email and password',
        data: [],
      });
      return;
    }

    try {
      if (!request.email || !emailvalidator.validate(request.email)) {
        res.status(201).json({
          status: false,
          message: 'Enter a valid email id',
          data: [],
        });
        return;
      }

      const password = request.password;
      if (!password) {
        res.status(201).json({
          status: false,
          message: 'Enter a valid password',
          data: [],
        });
        return;
      }

      const sql = 'SELECT * FROM tbl_user WHERE email = ? AND password = ?';
      const dbquery: User[] = await mysqlcon(sql, [
        request.email,
        md5(password),
      ]);

      if (dbquery[0]) {
        const user = dbquery[0];

        if (user.complete_profile === 1) {
          if (user.status === 1) {
            const sqlCheck = 'SELECT * FROM tbl_merchnat_answer WHERE user_id = ?';
            const resultCheck = await mysqlcon(sqlCheck, [user.id]);

            const questionAnswer = [];

            for (const answer of resultCheck) {
              const sqlExtract = 'SELECT * FROM tbl_login_security WHERE id = ?';
              const resultExtract = await mysqlcon(sqlExtract, [answer.question]);
              questionAnswer.push({
                id: answer.question,
                question: resultExtract[0]?.question || '',
                answer: answer.answer,
              });
            }

            const token = jwt.sign(
              { id: user.id },
              config.JWT_SECRET as string,
              {
                expiresIn:  config.JWT_EXPIRY as jwt.SignOptions['expiresIn']
              },
            );

            user.token = token;

            res.status(200).json({
              status: true,
              is_complete: 1,
              message: 'Login successfully',
              questionAnswer,
              data: user,
              account_Type: user.account_type,
            });
          } else {
            res.status(201).json({
              status: false,
              message:
                'Your profile is active now, It is in under-review wait 24 hours.',
              data: [],
            });
          }
        } else {
          const token = jwt.sign(
            { id: user.id },
            config.JWT_SECRET as string,
            {
                expiresIn:  config.JWT_EXPIRY as jwt.SignOptions['expiresIn']
              },
          );
          user.token = token;
          res.status(200).json({
            status: false,
            is_complete: 2,
            message: 'Your profile is not complete.',
            data: user,
          });
        }
      } else {
        const attempts = loginAttempts.get(request.email) || 0;
        
        // Increment and update
        loginAttempts.set(request.email, attempts + 1);

        // Check if attempts >= 3
        if (attempts + 1 >= 3){
          await axios.post(webhookUrl, {
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '*:rotating_light: Fake Login Attempt Detected :rotating_light:*',
                },
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Email:* \`${request.email}\`\n*IP:* \`${ip}\`\n*Time:* \`${formatted_date}\``,
                },
              },
            ],
            text: 'Fake Login Attempt Detected',
          });

          loginAttempts.set(request.email, 0); // ✅ reset 
        }

        res.status(201).json({
          status: false,
          message: 'You entered wrong credentials.',
          data: [],
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: false,
        message: 'Error to complete task.',
        data: [],
      });
    }
  },

  get_countries: async function (req : AuthenticatedRequest, res: Response): Promise<void> {
    // console.log('solution : ', req.user);
    try {
        const users = req.user;
    
        if (users) {
          const sql = "SELECT * FROM countries WHERE 1 ORDER BY name ASC";
          const dbquery = await mysqlcon(sql);
    
          if (dbquery) {
            res.status(200).json({
              status: true, // Changed to true if success
              message: "Country list fetched successfully",
              data: dbquery,
            });
          } else {
            res.status(404).json({
              status: false,
              message: "No countries found.",
              data: [],
            });
          }
        } else {
          res.status(401).json({
            status: false,
            message: "Authentication Failed.",
            data: [],
          });
        }
      } catch (e) {
        console.log(e);
        res.status(500).json({
          status: false,
          message: "Error to complete task.",
          data: [],
        });
      }
  },

  get_solution_apply: async function (req : AuthenticatedRequest, res: Response): Promise<void> {
        // console.log('solution : ', req.user);
        try {
            const user = req.user;
            if (!user) {
              res.status(201).json({
                status: false,
                message: "Authentication Failed.",
                data: [],
              });
              return;
            }
        
            // Get active countries
            const countries: any[] = await mysqlcon("SELECT * FROM countries WHERE status = 1");
        
            if (!countries || countries.length === 0) {
              res.status(201).json({
                status: false,
                message: "Solution apply countries not found",
                data: [],
              });
              return;
            }
        
            // Get active payment methods
            const paymentMethods: any[] = await mysqlcon("SELECT * FROM payment_method WHERE status = 1");
        
            for (const country of countries) {
              const supportedIds = country.support_payment_method?.split(",") || [];
              const support_method = paymentMethods.filter((method) =>
                supportedIds.includes(String(method.id))
              );
              country.support_method = support_method;
            }
        
            res.status(200).json({
              status: true,
              message: "Solution Countries and solution apply are get successfully",
              data: countries,
            });
          } catch (e) {
            res.status(500).json({
              status: false,
              message: "Error to complete task.",
              data: [],
            });
          }
  },

  qusAns: async function (req : AuthenticatedRequest, res: Response): Promise<void> {
        try {
          let id = req.user?.id;
         const { question_id1, answer1, question_id2, answer2, question_id3, answer3 } =
      req.body as QuestionAnswerRequest;
      if (question_id1 || answer1 || question_id2 || answer2 || question_id3 || answer3) {
        // Check if all required fields are present
        if (question_id1 && answer1 && question_id2 && answer2 && question_id3 && answer3) { 
              let sqlForAns =
                "INSERT INTO tbl_merchnat_answer  (user_id,question,answer) VALUES ?";
              let values = [
                [id, question_id1, answer1],
                [id, question_id2, answer2],
                [id, question_id3, answer3],
              ];
              let result = await mysqlcon(sqlForAns, [values]);
              if (result) {
                res.status(200).json({
                  status: true,
                  database: true,
                  message: "Answer added successfully✅",
                });
              } else {
                res.status(201).json({
                  status: false,
                  message: "Answer not added ❌",
                });
              }
            } else {
              res.status(201).json({
                status: false,
                message: "Please answer all questions ⚠️",
              });
            }
          } else {
            let sqlForQus = "SELECT id,question  From tbl_login_security";
            let result = await mysqlcon(sqlForQus);
            if (result) {
              res.status(200).json({
                status: true,
                message: "Question get successfully",
                data: result,
              });
            } else {
              res.status(201).json({
                status: false,
                message: "Question not found",
              });
            }
          }
        } catch (err) {
          console.log(err);
          res.status(500).json({
            message: "Internal server error ❌",
            error: err,
          });
        }
  },

  forgotPassword: async function (req : ForgotPasswordRequest, res: Response): Promise<void>{
        try {
            const { newpassword, confirmPassword, userVerificationToken } = req.body;
        
            if (!newpassword || !confirmPassword || !userVerificationToken) {
               res.status(400).json({
                message:
                  "Please provide password, confirmPassword, and userVerificationToken.",
              });
            }
        
            if (newpassword !== confirmPassword) {
              res.status(400).json
              ({ message: "Password and confirmPassword do not match." });
            }
        
            const sql = "SELECT verification_token FROM tbl_user WHERE verification_token = ?";
            const dbResult = await mysqlcon(sql, [userVerificationToken]);
        
            if (dbResult.length === 0) {
              res.status(404).json({ message: "User not found." });
            }
        
            const dbVerificationToken = dbResult[0].verification_token;
        
            if (userVerificationToken !== dbVerificationToken) {
              res.status(400).json
              ({ message: "Verification tokens do not match." });
            }
        
            const hashedPassword = md5(newpassword);
            const updateSQL = "UPDATE tbl_user SET ? WHERE verification_token = ?";
            const result = await mysqlcon(updateSQL, [
              { password: hashedPassword },
              userVerificationToken,
            ]);
        
            if (result.affectedRows === 0) {
              res.status(500).json({ message: "Password change failed. Please try again." });
            }
        
             res.status(200).json({ message: "Password changed successfully." });
        
          } catch (error) {
            res.status(500).json({
              message: "An error occurred.",
              error: error,
            });
          }
  },

  Kyc: async function(req  : KycRequest, res: Response): Promise<void>{
    try {
      const filterType = req.body.filterType ? Number(req.body.filterType) : 1;
  
      const { image, image1, image2, image3 } = req.files || {};
  
      // Validate required files
      if (!image?.[0] || !image1?.[0] || !image2?.[0] || !image3?.[0]) {
        res.status(400).json({ message: 'All required images are not provided' });
      return; // <- This fixes the TS error
      }
  
      const img = image[0];
      const img1 = image1[0];
      const img2 = image2[0];
      const img3 = image3[0];
  
      const filepath = path.resolve(__dirname, '../../uploads');
  
      const mailOptions = {
        from: 'kr.manjeet319@gmail.com',
        to: 'anisha16rawat@gmail.com',
        subject: 'Send Attachment',
        html: '<h1>Hello, This is Attachment !!</h1><p>This is a test mail..!</p>',
        attachments: [
          { filename: img.originalname, path: `${filepath}/${img.originalname}` },
          { filename: img1.originalname, path: `${filepath}/${img1.originalname}` },
          { filename: img2.originalname, path: `${filepath}/${img2.originalname}` },
          { filename: img3.originalname, path: `${filepath}/${img3.originalname}` },
        ],
      };
  
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'kr.manjeet319@gmail.com',
          pass: 'mfvadlyccsgukabu',
        },
      });
  
      const docPayload = {
        1: {
          llp_business_identity: img.originalname,
          llp_business_existence: img1.originalname,
          llp_business_owners: img2.originalname,
          llp_business_working: img3.originalname,
        },
        2: {
          prtnr_business_identity: img.originalname,
          prtnr_business_existence: img1.originalname,
          prtnr_business_working: img2.originalname,
          prtnr_business_owners: img3.originalname,
        },
        3: {
          sole_business_identity_existence: img.originalname,
          sole_business_working: img1.originalname,
          sole_business_owners: img2.originalname,
          sole_address_owner: img3.originalname,
        },
        4: {
          ngo_business_identity: img.originalname,
          ngo_business_existence: img1.originalname,
          ngo_business_working: img2.originalname,
          ngo_business_owners: img3.originalname,
        },
      }[filterType];
  
      if (!docPayload) {
        res.status(400).json({ message: 'Invalid filterType' });
        return
      }
  
      const sql = 'INSERT INTO kyc_document SET ?, created_on = NOW(), modified_on = NOW()';
      await mysqlcon(sql, [docPayload]);
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ message: 'Error sending email' });
        }
        return res.status(200).json({ message: 'Documents Uploaded and Email Sent' });
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

export default loginCont;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const email_validator_1 = __importDefault(require("email-validator"));
const md5_1 = __importDefault(require("md5"));
const db_connection_1 = __importDefault(require("../config/db_connection"));
const config_1 = __importDefault(require("../config/config"));
const otp_generator_1 = __importDefault(require("otp-generator"));
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const date_fns_1 = require("date-fns");
const formatted_date = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd HH:mm:ss');
const webhookUrl = 'https://hooks.slack.com/services/your/hook/url';
const loginAttempts = new Map();
const loginCont = {
    register: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                if (!email_validator_1.default.validate(email)) {
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
                let params = { email };
                if (user_id) {
                    sql = 'SELECT id, email FROM tbl_user WHERE email = ? AND id != ?';
                    params = [email, user_id];
                }
                const dbquery = yield (0, db_connection_1.default)(sql, params);
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
                        password: (0, md5_1.default)(password),
                        updated_on: formatted_date,
                    };
                    const updateResult = yield (0, db_connection_1.default)('UPDATE tbl_user SET ? WHERE id = ?', [updateData, user_id]);
                    if (!updateResult) {
                        res.status(201).json({
                            status: false,
                            message: 'Error updating profile',
                            data: [],
                        });
                    }
                    else {
                        res.status(200).json({
                            status: true,
                            message: 'Profile saved successfully',
                            data: [updateResult.insertId],
                        });
                    }
                }
                else {
                    const secret_key = otp_generator_1.default.generate(8, { upperCaseAlphabets: true, specialChars: false });
                    const test_secret_key = otp_generator_1.default.generate(8, { upperCaseAlphabets: true, specialChars: false });
                    const verification_token = otp_generator_1.default.generate(8, { upperCaseAlphabets: true, specialChars: false });
                    const newUser = {
                        parent_id: 0,
                        account_type: 1,
                        email,
                        password: (0, md5_1.default)(password),
                        status: 0,
                        secretkey: secret_key,
                        test_secretkey: test_secret_key,
                        created_on: formatted_date,
                        updated_on: formatted_date,
                        verification_token,
                    };
                    const result = yield (0, db_connection_1.default)('INSERT INTO tbl_user SET ?', newUser);
                    if (!result) {
                        res.status(201).json({
                            status: false,
                            message: 'Error creating profile',
                            data: [],
                        });
                    }
                    else {
                        jsonwebtoken_1.default.sign({ id: result.insertId }, config_1.default.JWT_SECRET, {
                            expiresIn: config_1.default.JWT_EXPIRY
                        }, (err, token) => {
                            if (err || !token) {
                                throw err;
                            }
                            const response = {
                                id: result.insertId,
                                user_id: result.insertId,
                                token,
                            };
                            const page_path = path_1.default.join(__dirname, '../views/signup.ejs');
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
                        });
                    }
                }
            }
            catch (e) {
                console.error(e);
                res.status(500).json({
                    status: false,
                    message: 'Error completing the task.',
                    data: [],
                });
            }
        });
    },
    company_profile: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.user;
            if (!user) {
                res.status(401).json({ status: false, message: 'Unauthorized', data: [] });
                return;
            }
            try {
                const request = req.body;
                const validateFields = [
                    "company_name",
                    "trading_dba",
                    "registered_address",
                    "company_registration_no",
                    "country_of_incorporation",
                    "main_contact_person",
                    "main_contact_email"
                ];
                let missingFields = [];
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
                const result = yield (0, db_connection_1.default)(sql, [companyData, user.id]);
                if (result) {
                    res.status(200).json({ status: true, message: "Saved successfully", data: [] });
                }
            }
            catch (error) {
                console.error("Error updating company profile:", error);
                res.status(500).json({ status: false, message: "Error to complete task.", data: [] });
            }
        });
    },
    save_country_solution_apply: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = req.user;
            if (!user) {
                res.status(401).json({ status: false, message: 'Unauthorized', data: [] });
                return;
            }
            try {
                const request = req.body;
                const requiredFields = ['solution_apply_for_country', 'mode_of_solution'];
                let missingFields = [];
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
                const dbquery = yield (0, db_connection_1.default)(sql, [companyData, user.id]);
                if (dbquery) {
                    res.status(200).json({ status: true, message: 'Saved successfully', data: [] });
                }
                else {
                    res.status(500).json({ status: false, message: 'Database update failed', data: [] });
                }
            }
            catch (error) {
                console.error('Error:', error);
                res.status(500).json({ status: false, message: 'Error to complete task.', data: [] });
            }
        });
    },
    save_director_info: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const user = req.user;
                if (!user || !user.id) {
                    res.status(401).json({ status: false, message: "Unauthorized user" });
                    return;
                }
                const request = req.body;
                const requiredFields = [
                    "director1_name",
                    "director1_dob",
                    "director1_nationality",
                ];
                let missingFields = [];
                let messageStr = "";
                for (const field of requiredFields) {
                    if (!request[field]) {
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
                const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                ;
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
                const dbquery = yield (0, db_connection_1.default)(sql, [director_info, user_id]);
                if (dbquery) {
                    res.status(200).json({
                        status: true,
                        message: "Saved successfully",
                        data: dbquery,
                    });
                }
                else {
                    res.status(500).json({
                        status: false,
                        message: "Database update failed",
                        data: [],
                    });
                }
            }
            catch (e) {
                res.status(500).json({
                    status: false,
                    message: "Error to complete task.",
                    data: [],
                });
            }
        });
    },
    save_shareholder_info: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const user = req.user;
                if (!user || !user.id) {
                    res.status(401).json({ status: false, message: "Unauthorized user" });
                    return;
                }
                const request = req.body;
                const requiredFields = [
                    "shareholder1_name",
                    "shareholder1_dob",
                    "shareholder1_nationality",
                ];
                let missingFields = [];
                let messageStr = "";
                for (const field of requiredFields) {
                    if (!request[field]) {
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
                const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
                const dbquery = yield (0, db_connection_1.default)(sql, [shareholder_info, user_id]);
                if (dbquery) {
                    res.status(200).json({
                        status: true,
                        message: "Saved successfully",
                        data: [],
                    });
                }
                else {
                    res.status(500).json({
                        status: false,
                        message: "Database update failed",
                        data: [],
                    });
                }
            }
            catch (e) {
                console.error(e);
                res.status(500).json({
                    status: false,
                    message: "Error to complete task.",
                    data: [],
                });
            }
        });
    },
    save_business_info: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let user = req.user;
            var bconnect = {};
            try {
                const request = req.body;
                const requiredFields = [
                    "website",
                    "job_title",
                    "company_estimated_monthly_volume",
                    "company_avarage_ticket_size",
                ];
                let reqStr = "";
                let reqArr = [];
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
                const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const sql = "UPDATE tbl_user SET ? WHERE id = ?";
                const dbquery = yield (0, db_connection_1.default)(sql, [business_info, user_id]);
                if (dbquery) {
                    res.status(200).json({
                        status: true,
                        message: "Saved successfully",
                        data: [],
                    });
                }
                else {
                    res.status(500).json({
                        status: false,
                        message: "Failed to save business info",
                        data: [],
                    });
                }
            }
            catch (e) {
                console.error(e);
                res.status(500).json({
                    status: false,
                    message: "Error to complete task.",
                    data: [],
                });
            }
        });
    },
    save_settelment_info: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let user = req.user;
            // res.send(users);
            var bconnect = {};
            try {
                const request = req.body;
                console.log(request);
                const requiredFields = [
                    "settle_currency",
                    "wallet_url",
                ];
                let reqStr = "";
                let reqArr = [];
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
                const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const settelment_info = {
                    settle_currency: request.settle_currency,
                    wallet_url: request.wallet_url,
                    complete_profile: 1,
                    updated_on: formatted_date,
                };
                const sql = "UPDATE tbl_user SET ? WHERE id = ? ";
                const dbquery = yield (0, db_connection_1.default)(sql, [settelment_info, user_id]);
                if (dbquery) {
                    res.status(200).json({
                        status: true,
                        resmessage: "Saved successfully",
                        data: []
                    });
                }
                else {
                    res.status(201).json({
                        status: false,
                        message: "Settelment informations are required",
                        data: [],
                    });
                }
            }
            catch (e) {
                res.status(500).json({
                    status: false,
                    message: "Error to complete task.",
                    data: []
                });
            }
        });
    },
    login: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const request = req.body;
            const ip = req.headers['x-forwarded-for'] ||
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
                if (!request.email || !email_validator_1.default.validate(request.email)) {
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
                const dbquery = yield (0, db_connection_1.default)(sql, [
                    request.email,
                    (0, md5_1.default)(password),
                ]);
                if (dbquery[0]) {
                    const user = dbquery[0];
                    if (user.complete_profile === 1) {
                        if (user.status === 1) {
                            const sqlCheck = 'SELECT * FROM tbl_merchnat_answer WHERE user_id = ?';
                            const resultCheck = yield (0, db_connection_1.default)(sqlCheck, [user.id]);
                            const questionAnswer = [];
                            for (const answer of resultCheck) {
                                const sqlExtract = 'SELECT * FROM tbl_login_security WHERE id = ?';
                                const resultExtract = yield (0, db_connection_1.default)(sqlExtract, [answer.question]);
                                questionAnswer.push({
                                    id: answer.question,
                                    question: ((_a = resultExtract[0]) === null || _a === void 0 ? void 0 : _a.question) || '',
                                    answer: answer.answer,
                                });
                            }
                            const token = jsonwebtoken_1.default.sign({ id: user.id }, config_1.default.JWT_SECRET, {
                                expiresIn: config_1.default.JWT_EXPIRY
                            });
                            user.token = token;
                            res.status(200).json({
                                status: true,
                                is_complete: 1,
                                message: 'Login successfully',
                                questionAnswer,
                                data: user,
                                account_Type: user.account_type,
                            });
                        }
                        else {
                            res.status(201).json({
                                status: false,
                                message: 'Your profile is active now, It is in under-review wait 24 hours.',
                                data: [],
                            });
                        }
                    }
                    else {
                        const token = jsonwebtoken_1.default.sign({ id: user.id }, config_1.default.JWT_SECRET, {
                            expiresIn: config_1.default.JWT_EXPIRY
                        });
                        user.token = token;
                        res.status(200).json({
                            status: false,
                            is_complete: 2,
                            message: 'Your profile is not complete.',
                            data: user,
                        });
                    }
                }
                else {
                    const attempts = loginAttempts.get(request.email) || 0;
                    // Increment and update
                    loginAttempts.set(request.email, attempts + 1);
                    // Check if attempts >= 3
                    if (attempts + 1 >= 3) {
                        yield axios_1.default.post(webhookUrl, {
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
            }
            catch (error) {
                console.error(error);
                res.status(500).json({
                    status: false,
                    message: 'Error to complete task.',
                    data: [],
                });
            }
        });
    },
    get_countries: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log('solution : ', req.user);
            try {
                const users = req.user;
                if (users) {
                    const sql = "SELECT * FROM countries WHERE 1 ORDER BY name ASC";
                    const dbquery = yield (0, db_connection_1.default)(sql);
                    if (dbquery) {
                        res.status(200).json({
                            status: true, // Changed to true if success
                            message: "Country list fetched successfully",
                            data: dbquery,
                        });
                    }
                    else {
                        res.status(404).json({
                            status: false,
                            message: "No countries found.",
                            data: [],
                        });
                    }
                }
                else {
                    res.status(401).json({
                        status: false,
                        message: "Authentication Failed.",
                        data: [],
                    });
                }
            }
            catch (e) {
                console.log(e);
                res.status(500).json({
                    status: false,
                    message: "Error to complete task.",
                    data: [],
                });
            }
        });
    },
    get_solution_apply: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                const countries = yield (0, db_connection_1.default)("SELECT * FROM countries WHERE status = 1");
                if (!countries || countries.length === 0) {
                    res.status(201).json({
                        status: false,
                        message: "Solution apply countries not found",
                        data: [],
                    });
                    return;
                }
                // Get active payment methods
                const paymentMethods = yield (0, db_connection_1.default)("SELECT * FROM payment_method WHERE status = 1");
                for (const country of countries) {
                    const supportedIds = ((_a = country.support_payment_method) === null || _a === void 0 ? void 0 : _a.split(",")) || [];
                    const support_method = paymentMethods.filter((method) => supportedIds.includes(String(method.id)));
                    country.support_method = support_method;
                }
                res.status(200).json({
                    status: true,
                    message: "Solution Countries and solution apply are get successfully",
                    data: countries,
                });
            }
            catch (e) {
                res.status(500).json({
                    status: false,
                    message: "Error to complete task.",
                    data: [],
                });
            }
        });
    },
    qusAns: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                let id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { question_id1, answer1, question_id2, answer2, question_id3, answer3 } = req.body;
                if (question_id1 || answer1 || question_id2 || answer2 || question_id3 || answer3) {
                    // Check if all required fields are present
                    if (question_id1 && answer1 && question_id2 && answer2 && question_id3 && answer3) {
                        let sqlForAns = "INSERT INTO tbl_merchnat_answer  (user_id,question,answer) VALUES ?";
                        let values = [
                            [id, question_id1, answer1],
                            [id, question_id2, answer2],
                            [id, question_id3, answer3],
                        ];
                        let result = yield (0, db_connection_1.default)(sqlForAns, [values]);
                        if (result) {
                            res.status(200).json({
                                status: true,
                                database: true,
                                message: "Answer added successfully✅",
                            });
                        }
                        else {
                            res.status(201).json({
                                status: false,
                                message: "Answer not added ❌",
                            });
                        }
                    }
                    else {
                        res.status(201).json({
                            status: false,
                            message: "Please answer all questions ⚠️",
                        });
                    }
                }
                else {
                    let sqlForQus = "SELECT id,question  From tbl_login_security";
                    let result = yield (0, db_connection_1.default)(sqlForQus);
                    if (result) {
                        res.status(200).json({
                            status: true,
                            message: "Question get successfully",
                            data: result,
                        });
                    }
                    else {
                        res.status(201).json({
                            status: false,
                            message: "Question not found",
                        });
                    }
                }
            }
            catch (err) {
                console.log(err);
                res.status(500).json({
                    message: "Internal server error ❌",
                    error: err,
                });
            }
        });
    },
    forgotPassword: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { newpassword, confirmPassword, userVerificationToken } = req.body;
                if (!newpassword || !confirmPassword || !userVerificationToken) {
                    res.status(400).json({
                        message: "Please provide password, confirmPassword, and userVerificationToken.",
                    });
                }
                if (newpassword !== confirmPassword) {
                    res.status(400).json({ message: "Password and confirmPassword do not match." });
                }
                const sql = "SELECT verification_token FROM tbl_user WHERE verification_token = ?";
                const dbResult = yield (0, db_connection_1.default)(sql, [userVerificationToken]);
                if (dbResult.length === 0) {
                    res.status(404).json({ message: "User not found." });
                }
                const dbVerificationToken = dbResult[0].verification_token;
                if (userVerificationToken !== dbVerificationToken) {
                    res.status(400).json({ message: "Verification tokens do not match." });
                }
                const hashedPassword = (0, md5_1.default)(newpassword);
                const updateSQL = "UPDATE tbl_user SET ? WHERE verification_token = ?";
                const result = yield (0, db_connection_1.default)(updateSQL, [
                    { password: hashedPassword },
                    userVerificationToken,
                ]);
                if (result.affectedRows === 0) {
                    res.status(500).json({ message: "Password change failed. Please try again." });
                }
                res.status(200).json({ message: "Password changed successfully." });
            }
            catch (error) {
                res.status(500).json({
                    message: "An error occurred.",
                    error: error,
                });
            }
        });
    },
    Kyc: function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filterType = req.body.filterType ? Number(req.body.filterType) : 1;
                const { image, image1, image2, image3 } = req.files || {};
                // Validate required files
                if (!(image === null || image === void 0 ? void 0 : image[0]) || !(image1 === null || image1 === void 0 ? void 0 : image1[0]) || !(image2 === null || image2 === void 0 ? void 0 : image2[0]) || !(image3 === null || image3 === void 0 ? void 0 : image3[0])) {
                    res.status(400).json({ message: 'All required images are not provided' });
                    return; // <- This fixes the TS error
                }
                const img = image[0];
                const img1 = image1[0];
                const img2 = image2[0];
                const img3 = image3[0];
                const filepath = path_1.default.resolve(__dirname, '../../uploads');
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
                const transporter = nodemailer_1.default.createTransport({
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
                    return;
                }
                const sql = 'INSERT INTO kyc_document SET ?, created_on = NOW(), modified_on = NOW()';
                yield (0, db_connection_1.default)(sql, [docPayload]);
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).json({ message: 'Error sending email' });
                    }
                    return res.status(200).json({ message: 'Documents Uploaded and Email Sent' });
                });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });
    }
};
exports.default = loginCont;

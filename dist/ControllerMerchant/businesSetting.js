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
const db_connection_1 = __importDefault(require("../config/db_connection"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const path_1 = __importDefault(require("path"));
const filepath = path_1.default.join(__dirname, '../uploads/documents'); // or wherever your uploaded files are stored
const BusinesSetting = {
    default: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = req.user;
            console.log(user);
            const ID = user.account_type === 3 ? user.parent_id : user.id;
            const { tab } = req.body;
            const getResult = (sql_1, ...args_1) => __awaiter(void 0, [sql_1, ...args_1], void 0, function* (sql, params = [ID]) { return (yield (0, db_connection_1.default)(sql, params))[0]; });
            switch (tab) {
                case "1": {
                    const userQuery = `
          SELECT bname, trading_dba, blocation, busines_Code, busines_Country,
                 fname, lname, main_contact_email, company_website_target_live_date, payoutCountries
          FROM tbl_user WHERE id = ?
        `;
                    const [result] = yield Promise.all([
                        (0, db_connection_1.default)(userQuery, [ID]),
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
                    const result = yield getResult(sql);
                    const modes = result.mode_of_solution
                        .split(",")
                        .map((mode) => mode.split(".")[1]);
                    const groupMap = {
                        "1": "1",
                        "2": "2,3,4,5",
                        "3": "2,3,4,5",
                        "4": "2,3,4,5",
                        "5": "2,3,4,5",
                        "10": "10",
                        "11": "11",
                        "12": "12",
                    };
                    const groupedModes = [...new Set(modes.map((mode) => groupMap[mode]).filter((value) => typeof value === 'string'))].join(',');
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
                    const tabMap = {
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
                    const result = yield getResult(sql);
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
                    const [questions, [toggle]] = yield Promise.all([
                        (0, db_connection_1.default)(questionsSql, [ID]),
                        (0, db_connection_1.default)(statusSql, [ID]),
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
                    const result = yield (0, db_connection_1.default)(sql, [ID]);
                    res.status(200).json({
                        success: true,
                        message: "UPI Block Info",
                        result,
                    });
                }
                case "11": {
                    try {
                        const mode = user.mode_of_solution
                            .split(",")
                            .map((item) => item.split("."));
                        const countryIds = mode.map((item) => item[0]);
                        const modeIds = mode.map((item) => item[1]);
                        const [countries, paymentMethods] = yield Promise.all([
                            (0, db_connection_1.default)("SELECT id, name, sortname, support_payment_method FROM countries WHERE id IN (?)", [countryIds]),
                            (0, db_connection_1.default)("SELECT id as mode, name, type FROM payment_method WHERE id IN (?)", [modeIds]),
                        ]);
                        const data = [];
                        countries.forEach((country) => {
                            const supportedModes = country.support_payment_method.split(",");
                            paymentMethods.forEach((method) => {
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
                    }
                    catch (error) {
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
        }
        catch (err) {
            console.error(err);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: err,
            });
        }
    }),
    toggleQNA: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = req.user;
            const ID = user.account_type === 3 ? user.parent_id : user.id;
            const { toggle } = req.body;
            if (!toggle) {
                res.status(400).json({ message: "Error in Toggle" });
            }
            const sqlToggle = "UPDATE tbl_user SET security_status = ? WHERE id = ?";
            yield (0, db_connection_1.default)(sqlToggle, [toggle, ID]);
            res.status(200).json({
                success: true,
                result: "Authentication successfully changed"
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "somthing went wrong",
                error
            });
        }
    }),
    blockToggle: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { status, id } = req.body;
            if (status === undefined || !id) {
                res.status(400).json({ message: "Error in Status change" });
                return;
            }
            const sqlToggle = "UPDATE tbl_upi_block SET status = ?, create_on = NOW() WHERE upi_id = ?";
            const result = yield (0, db_connection_1.default)(sqlToggle, [status, id]);
            res.status(200).json({
                success: true,
                result: result.changedRows === 0 ? "No Change" : "Successfully Changed"
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Something went wrong",
                error
            });
        }
    }),
    download: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const ID = user.account_type === 3 ? user.parent_id : user.id;
        try {
            const { mode_of_solution } = user;
            // const mode = mode_of_solution.split(",").map((item) => item.split("."));
            const mode = (mode_of_solution !== null && mode_of_solution !== void 0 ? mode_of_solution : "").split(",").map((item) => item.split("."));
            const sqlCountries = "SELECT id,name, sortname,support_payment_method FROM countries WHERE id IN (?)";
            const country_method = yield (0, db_connection_1.default)(sqlCountries, [mode.map((item) => item[0])]);
            const sqlPayment_method = "SELECT id,name,type FROM `payment_method` WHERE status = 1";
            const payment_result = yield (0, db_connection_1.default)(sqlPayment_method);
            for (let i = 0; i < country_method.length; i++) {
                const method_arr = country_method[i].support_payment_method.split(",");
                const loc_arr = payment_result.filter((pm) => method_arr.includes(pm.id.toString()));
                country_method[i].methods = loc_arr;
            }
            const defaultSql = `SELECT name, email, complete_profile, id, secretkey, bname, trading_dba, blocation, busines_Code, fname, lname,main_contact_email, director1_name, director1_dob, director1_nationality, director2_name, director2_dob, director2_nationality, shareholder1_name, shareholder1_dob, shareholder1_nationality, shareholder2_name,shareholder2_dob, shareholder2_nationality, website, job_title, company_estimated_monthly_volume,company_avarage_ticket_size, settle_currency, wallet_url FROM tbl_user WHERE id = ?`;
            const bcountrySql = `SELECT countries.name FROM countries INNER JOIN tbl_user ON countries.id = tbl_user.busines_Country WHERE tbl_user.id = ?`;
            const defaultResult = yield (0, db_connection_1.default)(defaultSql, [ID]);
            const bcountryResult = yield (0, db_connection_1.default)(bcountrySql, [ID]);
            res.status(200).json({
                default: defaultResult,
                buisness_country: bcountryResult,
                countryResult: country_method,
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Something went wrong in reports",
            });
        }
    }),
    uploadDocument: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.body;
        const filterType = req.body.filterType ? Number(req.body.filterType) : 1;
        // Ensure that req.files is typed correctly
        const files = req.files;
        const transporter = nodemailer_1.default.createTransport({
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
        const llp = {
            merchant_id: id,
            llp_business_identity: files.image[0].originalname,
            llp_business_existence: files.image1[0].originalname,
            llp_business_owners: files.image2[0].originalname,
            llp_business_working: files.image3[0].originalname,
        };
        const prtnr = {
            merchant_id: id,
            prtnr_business_identity: files.image[0].originalname,
            prtnr_business_existence: files.image1[0].originalname,
            prtnr_business_working: files.image2[0].originalname,
            prtnr_business_owners: files.image3[0].originalname,
        };
        const sole = {
            merchant_id: id,
            sole_business_identity_existence: files.image[0].originalname,
            sole_business_working: files.image1[0].originalname,
            sole_business_owners: files.image2[0].originalname,
            sole_address_owner: files.image3[0].originalname,
        };
        const ngo = {
            merchant_id: id,
            ngo_business_identity: files.image[0].originalname,
            ngo_business_existence: files.image1[0].originalname,
            ngo_business_working: files.image2[0].originalname,
            ngo_business_owners: files.image3[0].originalname,
        };
        try {
            const sql = 'SELECT kyc_type FROM tbl_user WHERE id = ?';
            const result = yield (0, db_connection_1.default)(sql, [id]);
            const test = result[0].kyc_type;
            if (test !== 0) {
                const updateQuery = (type, data) => {
                    const updateSql = 'UPDATE kyc_document SET ?, created_on = now(), modified_on = now() WHERE merchant_id = ?';
                    return (0, db_connection_1.default)(updateSql, [data, id]);
                };
                if (test === 'llp') {
                    yield updateQuery('llp', llp);
                }
                else if (test === 'prtnr') {
                    yield updateQuery('prtnr', prtnr);
                }
                else if (test === 'sole') {
                    yield updateQuery('sole', sole);
                }
                else if (test === 'ngo') {
                    yield updateQuery('ngo', ngo);
                }
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                        res.status(500).json({ message: 'Error' });
                    }
                    else {
                        res.status(200).json({ message: 'Documents Uploaded' });
                    }
                });
            }
            else {
                const insertQuery = (type, data) => {
                    const insertSql = 'INSERT INTO kyc_document SET ?, created_on = now(), modified_on = now()';
                    const userSql = `UPDATE tbl_user SET kyc_type = ? WHERE id = ?`;
                    return (0, db_connection_1.default)(insertSql, [data]).then(() => (0, db_connection_1.default)(userSql, [type, id]));
                };
                if (filterType === 1) {
                    yield insertQuery('llp', llp);
                }
                else if (filterType === 2) {
                    yield insertQuery('prtnr', prtnr);
                }
                else if (filterType === 3) {
                    yield insertQuery('sole', sole);
                }
                else if (filterType === 4) {
                    yield insertQuery('ngo', ngo);
                }
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                        res.status(500).json({ message: 'Error' });
                    }
                    else {
                        res.status(200).json({ message: 'Documents Uploaded' });
                    }
                });
            }
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Error' });
        }
    }),
};
exports.default = BusinesSetting;

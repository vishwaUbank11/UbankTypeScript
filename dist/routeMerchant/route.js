"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const loginController_1 = __importDefault(require("../ControllerMerchant/loginController"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const changePassController_1 = require("../ControllerMerchant/changePassController");
const dashbordController_1 = __importDefault(require("../ControllerMerchant/dashbordController"));
const businesSetting_1 = __importDefault(require("../ControllerMerchant/businesSetting"));
const deposits_controller_1 = __importDefault(require("../ControllerMerchant/deposits_controller"));
const payoutController_1 = __importDefault(require("../ControllerMerchant/payoutController"));
const refund_1 = __importDefault(require("../ControllerMerchant/refund"));
const reportsController_1 = __importDefault(require("../ControllerMerchant/reportsController"));
const settlementController_1 = __importDefault(require("../ControllerMerchant/settlementController"));
const singlePayout_1 = __importDefault(require("../ControllerMerchant/singlePayout"));
const router = express_1.default.Router();
const uploads = (0, multer_1.default)(); // for parsing multipart/form-data
router.post('/register', uploads.none(), loginController_1.default.register);
router.post('/save-company-profile', uploads.none(), authMiddleware_1.default, loginController_1.default.company_profile);
router.post('/save_shareholder_info', uploads.none(), authMiddleware_1.default, loginController_1.default.save_shareholder_info);
router.post('/save_business_info', uploads.none(), authMiddleware_1.default, loginController_1.default.save_business_info);
router.post('/save_settelment_info', uploads.none(), authMiddleware_1.default, loginController_1.default.save_settelment_info);
router.post('/login-merchant', uploads.none(), loginController_1.default.login);
router.post('/country-list', uploads.none(), authMiddleware_1.default, loginController_1.default.get_countries);
router.post('/solution-apply', uploads.none(), authMiddleware_1.default, loginController_1.default.get_solution_apply);
router.post('/get_solution_apply', uploads.none(), authMiddleware_1.default, loginController_1.default.get_solution_apply);
router.post('/save-country-solution-apply', uploads.none(), authMiddleware_1.default, loginController_1.default.save_country_solution_apply);
router.post('/qusAns', uploads.none(), authMiddleware_1.default, loginController_1.default.qusAns);
router.post('/forgetPassword', uploads.none(), authMiddleware_1.default, loginController_1.default.forgotPassword);
// router.post('/Kyc', uploads.fields
//     ([
//       { name: 'image', maxCount: 1 },{ name: 'image1', maxCount: 1 },{ name: 'image2', maxCount: 1 },
//       { name: 'image3', maxCount: 1 },
//     ]), authMiddleware, 
//    loginCont.Kyc
// );
router.post('/changePassword-merchant', uploads.none(), authMiddleware_1.default, changePassController_1.changePassword);
// DashBoard Api //
router.post('/card_data', uploads.none(), authMiddleware_1.default, dashbordController_1.default.card_data);
router.post('/success_rate', uploads.none(), authMiddleware_1.default, dashbordController_1.default.success_rate);
router.post('/top_transaction_today', uploads.none(), authMiddleware_1.default, dashbordController_1.default.top_transaction_today);
router.post('/monthly_transaction', uploads.none(), authMiddleware_1.default, dashbordController_1.default.monthly_transaction);
router.post('/weekly_transaction', uploads.none(), authMiddleware_1.default, dashbordController_1.default.weekly_transaction);
router.post('/payment_type', uploads.none(), authMiddleware_1.default, dashbordController_1.default.payment_type);
router.post('/dbycurrency', uploads.none(), authMiddleware_1.default, dashbordController_1.default.dbycurrency);
// Business //
router.post('/defaultBusinesSettingData', uploads.none(), authMiddleware_1.default, businesSetting_1.default.default);
// Deposit Transaction API //
router.post('/downloadapi', uploads.none(), authMiddleware_1.default, deposits_controller_1.default.downloadapi);
router.post('/statusResult', uploads.none(), authMiddleware_1.default, deposits_controller_1.default.statusResult);
router.post('/searchDateFilter', uploads.none(), authMiddleware_1.default, deposits_controller_1.default.searchDateFilter);
router.post('/merchantChoosedCurrency', uploads.none(), authMiddleware_1.default, deposits_controller_1.default.merchantChoosedCurrency);
router.post('/merchantTransaction', uploads.none(), authMiddleware_1.default, deposits_controller_1.default.merchantTransaction);
router.post('/refundCBRData', uploads.none(), authMiddleware_1.default, deposits_controller_1.default.refundCBRData);
router.post('/downloadRefundCBRapi', uploads.none(), authMiddleware_1.default, deposits_controller_1.default.downloadRefundCBRapi);
router.post('/merchantWalletLogs', uploads.none(), authMiddleware_1.default, deposits_controller_1.default.merchantWalletLogs);
router.post('/merchantWalletLogsDownload', uploads.none(), authMiddleware_1.default, deposits_controller_1.default.merchantWalletLogsDownload);
// Payout Transaction API //
router.post('/filter', uploads.none(), authMiddleware_1.default, payoutController_1.default.filter);
router.post('/payoutheader', uploads.none(), authMiddleware_1.default, payoutController_1.default.payoutheader);
router.post('/viewDetails', uploads.none(), authMiddleware_1.default, payoutController_1.default.viewDetails);
router.post('/downloadReport', uploads.none(), authMiddleware_1.default, payoutController_1.default.downloadReport);
// Refund Transaction //
router.post('/merchantRefund', uploads.none(), authMiddleware_1.default, refund_1.default.merchantRefund);
// Reports //
router.post('/accountSummary', uploads.none(), authMiddleware_1.default, reportsController_1.default.accountSummary);
router.post('/depositTypeReport', uploads.none(), authMiddleware_1.default, reportsController_1.default.depositTypeReport);
router.post('/payoutTypeReport', uploads.none(), authMiddleware_1.default, reportsController_1.default.payoutTypeReport);
router.post('/settlementTypeReport', uploads.none(), authMiddleware_1.default, reportsController_1.default.settlementTypeReport);
router.post('/chargebackTypeReport', uploads.none(), authMiddleware_1.default, reportsController_1.default.chargebackTypeReport);
router.post('/refundTypeReport', uploads.none(), authMiddleware_1.default, reportsController_1.default.refundTypeReport);
// Settlement  //
//                 👇👇 International Settlement 👇👇
router.post('/internationalSettlement', uploads.none(), authMiddleware_1.default, settlementController_1.default.settlemetnt_Trans);
router.post('/internationalrequestSettlement', uploads.none(), authMiddleware_1.default, settlementController_1.default.requestSettlement);
router.post('/internationalcardDetails', uploads.none(), authMiddleware_1.default, settlementController_1.default.cardDetails);
router.post('/internationaldownloadReportsc', uploads.none(), authMiddleware_1.default, settlementController_1.default.downloadReportsc);
//                 👇👇 Domestic Settlement 👇👇
router.post('/localsettlement_Trans', uploads.none(), authMiddleware_1.default, settlementController_1.default.settlement_Trans);
router.post('/localrequestSettlement', uploads.none(), authMiddleware_1.default, settlementController_1.default.localrequestSettlement);
router.post('/localcardDetails', uploads.none(), authMiddleware_1.default, settlementController_1.default.localcardDetails);
router.post('/localdownloadReportsc', uploads.none(), authMiddleware_1.default, settlementController_1.default.localdownloadReportsc);
router.post('/exchangeRate', uploads.none(), authMiddleware_1.default, settlementController_1.default.exchangeRate);
router.post('/userWallet', uploads.none(), authMiddleware_1.default, settlementController_1.default.userWallet);
//                  👇👇 Single Payout 👇👇
router.post('/singlePayoutCurrency', uploads.none(), authMiddleware_1.default, singlePayout_1.default.singlePayoutCurrency);
router.post('/singlePayoutBankcodes', uploads.none(), authMiddleware_1.default, singlePayout_1.default.singlePayoutBankcodes);
router.post('/singlePayoutPayment', uploads.none(), authMiddleware_1.default, singlePayout_1.default.singlePayoutPayment);
exports.default = router;

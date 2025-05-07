import express from 'express';
import multer from 'multer';
import { RequestHandler } from 'express';
import  loginCont  from '../ControllerMerchant/loginController';
import authMiddleware from '../middleware/authMiddleware'
import  {changePassword}  from '../ControllerMerchant/changePassController';
import dashboardCount from '../ControllerMerchant/dashbordController';
import BusinesSetting from '../ControllerMerchant/businesSetting';
import DepositTransaction from '../ControllerMerchant/deposits_controller';
import PayoutTransaction from '../ControllerMerchant/payoutController';
import Refund from '../ControllerMerchant/refund';
import MerchantReports from '../ControllerMerchant/reportsController';
import SettlementTransaction from '../ControllerMerchant/settlementController';
import singlePayoutTransaction from '../ControllerMerchant/singlePayout';
import TransactionStatement from '../ControllerMerchant/statementController';
import SubMerchant from '../ControllerMerchant/subMerchant';

const router = express.Router();
const uploads = multer(); // for parsing multipart/form-data

router.post('/register', uploads.none(), loginCont.register);
router.post('/save-company-profile', uploads.none(), authMiddleware, loginCont.company_profile);
router.post('/save_shareholder_info', uploads.none(), authMiddleware, loginCont.save_shareholder_info);
router.post('/save_business_info', uploads.none(), authMiddleware, loginCont.save_business_info);
router.post('/save_settelment_info', uploads.none(), authMiddleware, loginCont.save_settelment_info);
router.post('/login-merchant', uploads.none(), loginCont.login);
router.post('/country-list',uploads.none(),authMiddleware,loginCont.get_countries);
router.post('/solution-apply', uploads.none(), authMiddleware, loginCont.get_solution_apply);
router.post('/get_solution_apply',uploads.none(),authMiddleware ,loginCont.get_solution_apply);
router.post('/save-country-solution-apply',uploads.none(),authMiddleware, loginCont.save_country_solution_apply);
router.post('/qusAns',uploads.none(),authMiddleware, loginCont.qusAns);
router.post('/forgetPassword',uploads.none(),authMiddleware, loginCont.forgotPassword);
// router.post('/Kyc', uploads.fields
//     ([
//       { name: 'image', maxCount: 1 },{ name: 'image1', maxCount: 1 },{ name: 'image2', maxCount: 1 },
//       { name: 'image3', maxCount: 1 },
//     ]), authMiddleware, 
//    loginCont.Kyc
// );
router.post('/changePassword-merchant',uploads.none(),authMiddleware, changePassword);

// DashBoard Api //
router.post('/card_data',uploads.none(),authMiddleware, dashboardCount.card_data);
router.post('/success_rate',uploads.none(),authMiddleware, dashboardCount.success_rate);
router.post('/top_transaction_today',uploads.none(),authMiddleware, dashboardCount.top_transaction_today);
router.post('/monthly_transaction',uploads.none(),authMiddleware, dashboardCount.monthly_transaction);
router.post('/weekly_transaction',uploads.none(),authMiddleware, dashboardCount.weekly_transaction);
router.post('/payment_type',uploads.none(),authMiddleware, dashboardCount.payment_type);
router.post('/dbycurrency',uploads.none(),authMiddleware, dashboardCount.dbycurrency);

// Business //
router.post('/defaultBusinesSettingData',uploads.none(),authMiddleware, BusinesSetting.default);

// Deposit Transaction API //
router.post('/downloadapi',uploads.none(),authMiddleware, DepositTransaction.downloadapi);
router.post('/statusResult',uploads.none(),authMiddleware, DepositTransaction.statusResult);
router.post('/searchDateFilter',uploads.none(),authMiddleware, DepositTransaction.searchDateFilter);
router.post('/merchantChoosedCurrency',uploads.none(),authMiddleware, DepositTransaction.merchantChoosedCurrency);
router.post('/merchantTransaction',uploads.none(),authMiddleware, DepositTransaction.merchantTransaction);
router.post('/refundCBRData',uploads.none(),authMiddleware, DepositTransaction.refundCBRData);
router.post('/downloadRefundCBRapi',uploads.none(),authMiddleware, DepositTransaction.downloadRefundCBRapi);
router.post('/merchantWalletLogs',uploads.none(),authMiddleware, DepositTransaction.merchantWalletLogs);
router.post('/merchantWalletLogsDownload',uploads.none(),authMiddleware, DepositTransaction.merchantWalletLogsDownload);

// Payout Transaction API //
router.post('/filter',uploads.none(),authMiddleware, PayoutTransaction.filter);
router.post('/payoutheader',uploads.none(),authMiddleware, PayoutTransaction.payoutheader);
router.post('/viewDetails',uploads.none(),authMiddleware, PayoutTransaction.viewDetails);
router.post('/downloadReport',uploads.none(),authMiddleware, PayoutTransaction.downloadReport);

// Refund Transaction //
router.post('/merchantRefund',uploads.none(),authMiddleware, Refund.merchantRefund);

// Reports //
router.post('/accountSummary',uploads.none(),authMiddleware, MerchantReports.accountSummary);
router.post('/depositTypeReport',uploads.none(),authMiddleware, MerchantReports.depositTypeReport);
router.post('/payoutTypeReport',uploads.none(),authMiddleware, MerchantReports.payoutTypeReport);
router.post('/settlementTypeReport',uploads.none(),authMiddleware, MerchantReports.settlementTypeReport);
router.post('/chargebackTypeReport',uploads.none(),authMiddleware, MerchantReports.chargebackTypeReport);
router.post('/refundTypeReport',uploads.none(),authMiddleware, MerchantReports.refundTypeReport);

// Settlement  //
//                 👇👇 International Settlement 👇👇
router.post('/internationalSettlement',uploads.none(),authMiddleware,SettlementTransaction.settlemetnt_Trans);
router.post('/internationalrequestSettlement',uploads.none(),authMiddleware,SettlementTransaction.requestSettlement);
router.post('/internationalcardDetails',uploads.none(),authMiddleware,SettlementTransaction.cardDetails);
router.post('/internationaldownloadReportsc',uploads.none(),authMiddleware,SettlementTransaction.downloadReportsc);
//                 👇👇 Domestic Settlement 👇👇
router.post('/localsettlement_Trans',uploads.none(),authMiddleware,SettlementTransaction.settlement_Trans);
router.post('/localrequestSettlement',uploads.none(),authMiddleware,SettlementTransaction.localrequestSettlement);
router.post('/localcardDetails',uploads.none(),authMiddleware,SettlementTransaction.localcardDetails);
router.post('/localdownloadReportsc',uploads.none(),authMiddleware,SettlementTransaction.localdownloadReportsc);
router.post('/exchangeRate',uploads.none(),authMiddleware,SettlementTransaction.exchangeRate);
router.post('/userWallet',uploads.none(),authMiddleware,SettlementTransaction.userWallet);

//                  👇👇 Single Payout 👇👇
router.post('/singlePayoutCurrency',uploads.none(),authMiddleware,singlePayoutTransaction.singlePayoutCurrency);
router.post('/singlePayoutBankcodes',uploads.none(),authMiddleware,singlePayoutTransaction.singlePayoutBankcodes);
router.post('/singlePayoutPayment',uploads.none(),authMiddleware,singlePayoutTransaction.singlePayoutPayment);

//                  👇👇 Statement 👇👇
router.post('/statement',uploads.none(),authMiddleware,TransactionStatement.statement);
router.post('/merchantStatement',uploads.none(),authMiddleware,TransactionStatement.merchantStatement);

//                  👇👇 Sub Merchant 👇👇
router.post('/SubMerchant',uploads.none(),authMiddleware,SubMerchant.subMerchant);
router.post('/getIdSubmerchant',uploads.none(),authMiddleware,SubMerchant.getIdSubmerchant);
router.post('/createMerchant',uploads.none(),authMiddleware,SubMerchant.createMerchant);






export default router;
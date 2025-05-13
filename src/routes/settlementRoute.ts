import helper from '../helper/jwt'
import express from 'express';
import multer from 'multer';

//Settlement Controller-
import  AddFund   from '../controller/SettlementController/addFund';
import  BankDeposit   from '../controller/SettlementController/bankDeposit';
import Commissions from '../controller/SettlementController/commissions';
import DisputesChargeBack from '../controller/SettlementController/disputesChargeback';
import InternationalSettlement from '../controller/SettlementController/internationalSettlement';
import LocalPayouts from '../controller/SettlementController/localPayouts';
import LocalSettlement from '../controller/SettlementController/localSettlement';
import Refunds from '../controller/SettlementController/refunds';
import ReportSettlement from '../controller/SettlementController/reportsettlemment';
//Dashboard Controller-
import AmountReqController from '../controller/SettlementController/Dashboard/amountreqController';
import CommissioController from '../controller/SettlementController/Dashboard/commissionController';
import DashboardTable from '../controller/SettlementController/Dashboard/dashboardTable';
import localSettlement from '../controller/SettlementController/Dashboard/localSettlementController';
import internationalSettlement from '../controller/SettlementController/Dashboard/internationalSettlementController';

const router = express.Router();
const uploads = multer();

//Settlement Controller started-------------------------------
//addFund
router.post('/defaultAddFund', AddFund.default);
router.post('/curMer', AddFund.curMer);
router.post('/murAndCurSelect', AddFund.murAndCurSelect);
router.post('/addFund',helper.verify, AddFund.addFund);
router.post('/updateFund', AddFund.updateFund);
//bankDeposit
router.post('/defaultBankDeposit', BankDeposit.default);
router.post('/createAndUpdate',helper.verify, BankDeposit.createAndUpdate);
router.post('/bankDepositDownload', BankDeposit.bankDepositDownload);
router.post('/bankDepositsCards', BankDeposit.bankDepositsCards);
//commissions
router.post('/defaultCommissions', Commissions.default);
//disputesChargeBack
router.post('/defaultDisputesChargeBack', DisputesChargeBack.default);
router.post('/createDisputes',helper.verify, DisputesChargeBack.createDisputes);
router.post('/updateDisputes', DisputesChargeBack.updateDisputes);
router.post('/getTrxData', DisputesChargeBack.getTrxData);
router.post('/DisputesChargebackCardData', DisputesChargeBack.DisputesChargebackCardData);
router.post('/downloadDisputeChargeback', DisputesChargeBack.downloadDisputeChargeback);
router.post('/getDisputeDetails', DisputesChargeBack.getDisputeDetails);
//internationalSettlement.ts
router.post('/defaultInternationalSettlement',helper.verify, InternationalSettlement.default);
router.post('/requestInternational',helper.verify, InternationalSettlement.requestInternational);
router.post('/editInternational', InternationalSettlement.editInternational);
router.post('/defaultInternationalDownload', InternationalSettlement.defaultInternationalDownload);
router.post('/toggleInternationalStatus',helper.verify, InternationalSettlement.toggleInternationalStatus);
router.post('/internationalCards', InternationalSettlement.internationalCards);
//localPayouts.ts
router.post('/defaultlocalPayouts', LocalPayouts.default);
router.post('/localPayoutsCards', LocalPayouts.localPayoutsCards);
router.post('/downloadLocalPayouts', LocalPayouts.downloadLocalPayouts);
//localSettlement.ts
router.post('/defaultlocalSettlement',helper.verify, LocalSettlement.default);
router.post('/requestLocalSettlement',helper.verify, LocalSettlement.requestLocalSettlement);
router.post('/editLocalSettlement', LocalSettlement.editLocalSettlement);
router.post('/getLocalData', LocalSettlement.getLocalData);
router.post('/toggleSettlementStatus', helper.verify, LocalSettlement.toggleSettlementStatus);
router.post('/userSettlementWallet', LocalSettlement.userSettlementWallet);
router.post('/userExchangeRate', LocalSettlement.userExchangeRate);
router.post('/settlementCards', LocalSettlement.settlementCards);
router.post('/defaultDownload', LocalSettlement.defaultDownload);
//refunds.ts
router.post('/defaultRefunds', Refunds.default);
// router.post('/newRefund', helper.verify, Refunds.newRefund);
router.post('/updateRefund', Refunds.updateRefund);
router.post('/getRefundData', Refunds.getRefundData);
router.post('/refundCardData', Refunds.refundCardData);
router.post('/settlementRefundDownload', Refunds.settlementRefundDownload);
router.post('/getRefundDetails', Refunds.getRefundDetails);
//reportssettlement.ts
router.post('/reportsettlement', ReportSettlement.reportSettlement);
//Settlement Controller ended--------------------------------------

//Dashboard Controller started------------------------------
//amountreqController.ts
router.post('/yesterday', AmountReqController.yesterday);
router.post('/weekly', AmountReqController.weekly);
router.post('/monthly', AmountReqController.monthly);
router.post('/yearly', AmountReqController.yearly);
//commissionController.ts
router.post('/yesterdayCommissions', CommissioController.yesterdayCommissions);
router.post('/weeklyCommissions', CommissioController.weeklyCommissions);
router.post('/monthlyCommissions', CommissioController.monthlyCommissions);
router.post('/yearlyCommissions', CommissioController.yearlyCommissions);
//dashboardTable.ts
router.post('/dashboardTable', DashboardTable.dashboardTable);
//localsettlement.ts
router.post('/yesterdaySettlement', uploads.none(), localSettlement.yesterdaySettlement)
router.post('/weeklySettlement', uploads.none(), localSettlement.weeklySettlement)
router.post('/monthlySettlement', uploads.none(), localSettlement.monthlySettlement)
router.post('/yearlySettlement', uploads.none(), localSettlement.yearlySettlement)
//internationalSettlement.ts
router.post('/yesterdayInternational', uploads.none(), internationalSettlement.yesterdayInternational)
router.post('/weeklyInternational', uploads.none(), internationalSettlement.weeklyInternational)
router.post('/monthlyInternational', uploads.none(), internationalSettlement.monthlyInternational)
router.post('/yearlyInternational', uploads.none(), internationalSettlement.yearlyInternational)
//Dashboard Controller ended--------------------------------

export default router;
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import helper from '../helper/jwt'
const router = express.Router();

import  adminLogin from '../controller/loginContoller';
import transactionMT from '../controller/transactionMTController' 
import dashboard from '../controller/dashboardController'
import payment from '../controller/paymentController'
import transactionMR from '../controller/transactionMRController'
import transactionMEOD from '../controller/transactionMEODController'
import activitiesLogs from '../controller/activityLogs'
import transactionPM from '../controller/transactionPMController'
import subMerchant from '../controller/submerchantController'
import sandboxDeposite from '../controller/sandboxDepositeController'
import sandboxPayout from '../controller/sandboxPayoutController'
import settlement from '../controller/settlementController'
import bankCodeController from '../controller/bankCodeController'
import bankcodeAkonto from '../controller/bankCodeAkontoController'
import changePassword from '../controller/changePassController'
import contactController from '../controller/contactController'
import midController from '../controller/midController';
import subAdmin from '../controller/subAdminController'
import merchantAdminController from '../controller/merchantAdminController';

import allUpi from '../controller/SettingController/allUpiController';
import Countries from '../controller/SettingController/countries'
import banner from '../controller/SettingController/banner'
import CmsControoler from '../controller/SettingController/cms';
import CronController from  '../controller/SettingController/cron'
import ExchangeController from '../controller/SettingController/exchangeController'
import IpWhiteList from '../controller/SettingController/ipwhitelist';
import Profit from '../controller/SettingController/netProfit'
import sitesettingclass from '../controller/SettingController/siteSettingController'
import DefaultSwap from '../controller/SettingController/merchantSwaping'
import LimitsTS from '../controller/SettingController/limit'




const imageUploadPath = path.join(__dirname, '../uploads/images');
if (!fs.existsSync(imageUploadPath)) {
  fs.mkdirSync(imageUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imageUploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  }
});

const uploads = multer(); // for text-only multipart/form-data
const uploadImage = multer({ storage }); // for image uploading


// login
router.post('/login', uploads.none(), adminLogin.login);
router.post('/modulePermission', uploads.none(), adminLogin.modulePermission);

// transactionMT
router.post('/defaultMT', uploads.none(), transactionMT.defaultMT);
router.post('/getIdMT', uploads.none(), transactionMT.getIdMT);
router.post('/cronMerchantLogs', uploads.none(), transactionMT.cronMerchantLogs);
router.post('/createMT', uploads.none(), transactionMT.createMT);
router.post('/getCurrencyMT', uploads.none(), transactionMT.getCurrencyMT);
router.post('/allMerchant', uploads.none(), transactionMT.allMerchant);
router.post('/exportMT', uploads.none(), transactionMT.exportMT);
router.post('/depositsCards', uploads.none(), transactionMT.depositsCards);
router.post('/toggleStatusMT', uploads.none(), transactionMT.toggleStatusMT);
router.post('/manualCallBack',helper.verify, uploads.none(), transactionMT.manualCallBack);

// dashboard
router.post('/dashboard_cardData', uploads.none(), dashboard.dashboard_cardData);
router.post('/piegraph_data', uploads.none(), dashboard.piegraph_data);
router.post('/currency_data', uploads.none(), dashboard.currency_data);
router.post('/vendorsData', uploads.none(), dashboard.vendorsData);
router.post('/getTypeDetails', uploads.none(), dashboard.getTypeDetails);

// paymentgateway
router.post('/paymentGateway', uploads.none(), payment.paymentGateway);
router.post('/getId', uploads.none(), payment.getId);
router.post('/create', uploads.none(), payment.create);
router.post('/edit', uploads.none(), payment.edit);
router.post('/delete', uploads.none(), payment.delete);
router.post('/togglePayment', uploads.none(), payment.togglePayment);

// transactionMR
router.post('/defaultMR', uploads.none(), transactionMR.defaultMR);
router.post('/downloadAdminRefund', uploads.none(), transactionMR.downloadAdminRefund);
router.post('/toggleMR', uploads.none(), transactionMR.toggleMR);


// transactionMEOD
router.post('/defaultMEOD', uploads.none(), transactionMEOD.defaultMEOD);
router.post('/toggleStatusMEOD', uploads.none(), transactionMEOD.toggleStatusMEOD);

// activitieslogs
router.post('/adminLogs',uploads.none(),activitiesLogs.adminLogs)
router.post('/merchantLogs',uploads.none(),activitiesLogs.merchantLogs)
router.post('/walletLogs',uploads.none(),activitiesLogs.walletLogs)
router.post('/walletexport',uploads.none(),activitiesLogs.walletexport)
router.post('/currencyRateLogs',uploads.none(),activitiesLogs.currencyRateLogs)
router.post('/allowPaymentsLogs',uploads.none(),activitiesLogs.allowPaymentsLogs)
router.post('/filterAdmin',uploads.none(),activitiesLogs.filterAdmin)


// transactionPM
router.post('/defaultPM',uploads.none(),transactionPM.defaultPM)
router.post('/exportPayouts',uploads.none(),transactionPM.exportPayouts)
router.post('/toggleStatusPM',uploads.none(),transactionPM.toggleStatusPM)
router.post('/createPM',uploads.none(),transactionPM.createPM)
router.post('/cronPayoutLogs',uploads.none(),transactionPM.cronPayoutLogs)
router.post('/getCurrency',uploads.none(),transactionPM.getCurrency)
router.post('/payoutCards',uploads.none(),transactionPM.payoutCards)

// submerchant
router.post('/defaultSubmerchant',uploads.none(),subMerchant.defaultSubmerchant)
router.post('/createSubmerchant',uploads.none(),subMerchant.createSubmerchant)
router.post('/readOneSubmerchant',uploads.none(),subMerchant.readOneSubmerchant)
router.post('/editSubmerchant',uploads.none(),subMerchant.editSubmerchant)

// sandboxDeposite
router.post('/defaultSandboxDeposits',uploads.none(),sandboxDeposite.defaultSandboxDeposits)
router.post('/downloadSandboxDeposits',uploads.none(),sandboxDeposite.downloadSandboxDeposits)
router.post('/depositsSandboxCards',uploads.none(),sandboxDeposite.depositsSandboxCards)
router.post('/changeSandboxDepositStatus',uploads.none(),sandboxDeposite.changeSandboxDepositStatus)


// sandboxPayout
router.post('/defaultSandboxpayout',uploads.none(),sandboxPayout.defaultSandboxpayout)
router.post('/toggleSandboxPayout',uploads.none(),sandboxPayout.toggleSandboxPayout)
router.post('/downloadSandboxPayout',uploads.none(),sandboxPayout.downloadSandboxPayout)
router.post('/sandboxPayoutCards',uploads.none(),sandboxPayout.sandboxPayoutCards)


// settlementcontroller
router.post('/defaultSettlement',helper.verify,uploads.none(),settlement.defaultSettlement)
router.post('/getById',helper.verify,uploads.none(),settlement.getById)
router.post('/createSettlement',helper.verify,uploads.none(),settlement.createSettlement)
router.post('/updateSettlement',uploads.none(),settlement.updateSettlement)
router.post('/detailSettlement',uploads.none(),settlement.detailSettlement)
router.post('/toggleSettlement',helper.verify,uploads.none(),settlement.toggleSettlement)

// bankcode
router.post('/readBankCode',uploads.none(),bankCodeController.readBankCode)
router.post('/merchantSelect',uploads.none(),bankCodeController.merchantSelect)
router.post('/readType1BankCode',uploads.none(),bankCodeController.readType1BankCode)
router.post('/readType2BankCode',uploads.none(),bankCodeController.readType2BankCode)
router.post('/updateBankCode',uploads.none(),bankCodeController.updateBankCode)
router.post('/readUpdateBankCode',uploads.none(),bankCodeController.readUpdateBankCode)
router.post('/deleteBankCode',uploads.none(),bankCodeController.deleteBankCode)
router.post('/createBankCode',uploads.none(),bankCodeController.createBankCode)
router.post('/toggleBankCode',uploads.none(),bankCodeController.toggleBankCode)
router.post('/merchantData',uploads.none(),bankCodeController.merchantData)
router.post('/update_gateway',uploads.none(),bankCodeController.update_gateway)
router.post('/toggleMerchantBankCodes',uploads.none(),bankCodeController.toggleMerchantBankCodes)


// bankcodeAkonto
router.post('/readBankCodeAkonto',uploads.none(),bankcodeAkonto.readBankCodeAkonto)
router.post('/updateBankCodeAkonto',uploads.none(),bankcodeAkonto.updateBankCodeAkonto)
router.post('/readUpdateBankCodeAkonto',uploads.none(),bankcodeAkonto.readUpdateBankCodeAkonto)
router.post('/deleteBankCodeAkonto',uploads.none(),bankcodeAkonto.deleteBankCodeAkonto)
router.post('/createBankCodeAkonto',uploads.none(),bankcodeAkonto.createBankCodeAkonto)
router.post('/toggleBankCodeAkonto',uploads.none(),bankcodeAkonto.toggleBankCodeAkonto)
router.post('/currencySelect',uploads.none(),bankcodeAkonto.currencySelect)


// changepassword
router.post('/changePassword',uploads.none(),changePassword.changePassword)

// contactcontroller
router.post('/Contact',uploads.none(),contactController.Contact)
router.post('/readContact',uploads.none(),contactController.readContact)
router.post('/deleteContact',uploads.none(),contactController.deleteContact)

// midcontroller
router.post('/readMid',uploads.none(),midController.readMid)
router.post('/createMid',uploads.none(),midController.createMid)
router.post('/updateMid',uploads.none(),midController.updateMid)
router.post('/deleteMid',uploads.none(),midController.deleteMid)
router.post('/readUpdateMid',uploads.none(),midController.readUpdateMid)

// subAdmin
router.post('/subAdmin',uploads.none(),subAdmin.subAdmin)
router.post('/toggleSubAdmin',uploads.none(),subAdmin.toggleSubAdmin)
router.post('/deleteSubAdmin',uploads.none(),subAdmin.deleteSubAdmin)
router.post('/createSubAdmin',uploads.none(),subAdmin.createSubAdmin)
router.post('/getRole',uploads.none(),subAdmin.getRole)
router.post('/getPermissionDetails',uploads.none(),subAdmin.getPermissionDetails)
router.post('/permissionSubAdmin',uploads.none(),subAdmin.permissionSubAdmin)
router.post('/getViewSubAdmin',uploads.none(),subAdmin.getViewSubAdmin)
router.post('/permissionSubAdmin',uploads.none(),subAdmin.permissionSubAdmin)

// merchantAdmin
router.post('/merchantAdmin',uploads.none(),merchantAdminController.merchantAdmin)
router.post('/updateSelectKey',uploads.none(),merchantAdminController.updateSelectKey)
router.post('/countryList',uploads.none(),merchantAdminController.countryList)
router.post('/updateMerchantAdmin',uploads.none(),merchantAdminController.updateMerchantAdmin)
router.post('/addBanks',uploads.none(),merchantAdminController.addBanks)
router.post('/readOneMerchantAdmin',uploads.none(),merchantAdminController.readOneMerchantAdmin)
router.post('/deleteMerchantAdmin',uploads.none(),merchantAdminController.deleteMerchantAdmin)
router.post('/createMerchantAdmin',uploads.none(),merchantAdminController.createMerchantAdmin)
router.post('/updateWallet',uploads.none(),merchantAdminController.updateWallet)
router.post('/updateSandboxWallet',uploads.none(),merchantAdminController.updateSandboxWallet)
router.post('/verifyProfile',uploads.none(),merchantAdminController.verifyProfile)
router.post('/completeProfile',uploads.none(),merchantAdminController.completeProfile)
router.post('/payinGateway',uploads.none(),merchantAdminController.payinGateway)
router.post('/payoutGateway',uploads.none(),merchantAdminController.payoutGateway)
router.post('/setPayinGateway',uploads.none(),merchantAdminController.setPayinGateway)
router.post('/assignPayinGateway',uploads.none(),merchantAdminController.assignPayinGateway)
router.post('/assignPayoutGateway',uploads.none(),merchantAdminController.assignPayoutGateway)
router.post('/default_inr',uploads.none(),merchantAdminController.default_inr)
router.post('/defautlSwitchingData',uploads.none(),merchantAdminController.defautlSwitchingData)
router.post('/update_inrInsert_inr',uploads.none(),merchantAdminController.update_inrInsert_inr)
router.post('/default_inr_netbankingEwallet',uploads.none(),merchantAdminController.default_inr_netbankingEwallet)
router.post('/default_bankUbankconnect',uploads.none(),merchantAdminController.default_bankUbankconnect)
router.post('/updateInsert_bankUbank_inr',uploads.none(),merchantAdminController.updateInsert_bankUbank_inr)
router.post('/NonINR',uploads.none(),merchantAdminController.NonINR)
router.post('/NonINRUpdate',uploads.none(),merchantAdminController.NonINRUpdate)
router.post('/updateMerchantCharges',uploads.none(),merchantAdminController.updateMerchantCharges)
router.post('/setPaymentMethod',uploads.none(),merchantAdminController.setPaymentMethod)
router.post('/merchantCurrency',uploads.none(),merchantAdminController.merchantCurrency)
router.post('/depositPayoutGateway',uploads.none(),merchantAdminController.depositPayoutGateway)


// banner.ts
router.post('/createBanner', uploadImage.single('image'), banner.createBanner);
router.post('/defaultBanner', uploads.none(), banner.defaultBanner)

//cms.ts
router.post('/readonce', uploads.none(), CmsControoler.readonce)
router.post('/updateCMS', uploads.none(), CmsControoler.updateCMS)
router.post('/viewCMS', uploads.none(), CmsControoler.viewCMS)
router.post('/defaultCMS', uploads.none(), CmsControoler.defaultCMS)

//cron.js
router.post('/defaultCron', uploads.none(), CronController.defaultCron)
router.post('/toggleCron', uploads.none(), CronController.toggleCron)
router.post('/toggleSwitch', uploads.none(), CronController.toggleSwitch)
router.post('/toggleON', uploads.none(), CronController.toggleON)
router.post('/updateAdditional', uploads.none(), CronController.updateAdditional)
router.post('/readOneCron', uploads.none(), CronController.readOneCron)
router.post('/SetLimit_SetLimitmodule',helper.verify, uploads.none(), CronController.SetLimit_SetLimitmodule)

// settingController

//AllUpiController.ts
router.post('/defaultAllUpi', uploads.none(),allUpi.defaultAllUpi)
router.post('/createAllUpi', uploads.none(), allUpi.createAllUpi)
router.post('/toggleUpi', uploads.none(), allUpi.toggleUpi)
router.post('/readUpi', uploads.none(), allUpi.readUpi)
router.post('/updateUpi', uploads.none(), allUpi.updateUpi)
router.post('/deleteApi', uploads.none(), allUpi.deleteApi)
//Countries.ts
router.post('/defaultCountries', uploads.none(), Countries.defaultCountries)
router.post('/deleteApiii', uploads.none(), Countries.deleteApiii)
router.post('/addCountry', uploads.none(), Countries.addCountry)

//exhangeController.ts
router.post('/defaultExchange', uploads.none(), ExchangeController.defaultExchange)
router.post('/updateExchange', uploads.none(), ExchangeController.updateExchange)
router.post('/readonceExchange', uploads.none(), ExchangeController.readonceExchange)
router.post('/deleteExchange', uploads.none(), ExchangeController.deleteExchange)
router.post('/createExchange', uploads.none(), ExchangeController.createExchange)

//ipwhitelist.ts
router.post('/createipwhitelist', uploads.none(), IpWhiteList.createipwhitelist)
router.post('/toggleIP', uploads.none(), IpWhiteList.toggleIP)
router.post('/editIP', uploads.none(), IpWhiteList.editIP)
router.post('/readOneIP', uploads.none(), IpWhiteList.readOneIP)
router.post('/defaultIPWhitelist', uploads.none(), IpWhiteList.defaultIPWhitelist)
router.post('/allGateway', helper.verify, uploads.none(), IpWhiteList.allGateway)

//netPorfit.ts
router.post('/defaultProfit' , uploads.none(), Profit.defaultProfit)

//siteSettingController.ts
router.post('/siteSetting', uploads.none(), sitesettingclass.siteSetting)
router.post('/readUpdateSiteSetting', uploads.none(),sitesettingclass.readUpdateSiteSetting )
router.post('/updateSiteSettin', uploads.none(), sitesettingclass.updateSiteSettin)

//merchantSwaping.ts
router.post('/fetchdefaultSwap', uploads.none(), DefaultSwap.fetchdefaultSwap)
router.post('/toggleSwap', uploads.none(), DefaultSwap.toggleSwap)
router.post('/createMerchantSwap', uploads.none(), DefaultSwap.createMerchantSwap)
router.post('/updateMerchantSwapGateway', uploads.none(), DefaultSwap.updateMerchantSwapGateway)
router.post('/getSwapDetails', uploads.none(), DefaultSwap.getSwapDetails)
router.post('/selectBankCode', uploads.none(), DefaultSwap.selectBankCode)
router.post('/deleteSwap', uploads.none(), DefaultSwap.deleteSwap)

//limit.ts
router.post('/readBankLimit', uploads.none(), LimitsTS.readBankLimit)
router.post('/toggleLimit', uploads.none(), LimitsTS.toggleLimit)
router.post('/selectBank', uploads.none(), LimitsTS.selectBank)
router.post('/allCurrency', uploads.none(), LimitsTS.allCurrency)
router.post('/readOneLimit', uploads.none(), LimitsTS.readOneLimit)
router.post('/editLimit', uploads.none(), LimitsTS.editLimit)
router.post('/updateBankLimit', helper.verify, uploads.none(), LimitsTS.updateBankLimit)
router.post('/createLimit',helper.verify, uploads.none(), LimitsTS.createLimit)
router.post('/defaultSetLimit', uploads.none(), LimitsTS.defaultSetLimit)


export default router;
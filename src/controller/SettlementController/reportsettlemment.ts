import { Request, Response } from 'express';
import mysqlcon from '../../config/db_connection';

interface reportRequest{
    buttonVal? : any
    from? :any
    to?:any
}

class reportSettle{
    async reportSettlement(req:Request<{},{},reportRequest>,res:Response):Promise<void>{
    const user = req.user;
    // const {id} = req.body;
    const { from, to } = req.body;
    // console.log(from, to)
    let value = Number(req.body.buttonVal);
    console.log(req.body)
    let currencies = ['INR', 'CNY', 'IDR', 'THB', 'VND', 'USD', 'PHP', 'MYR']
    
    let sqlMerchantSettlement = " SELECT user_id, merchant_name,SUM(requestedAmount) AS RequestedAmount,charges,net_amount_for_settlement,settlementAmount FROM tbl_settlement GROUP BY user_id ";
    let sqlPayoutCurrency = " SELECT users_id, uniqueid, utrnumber, trx_type, creditacc, ifsc, bank_name, amount, akonto_charge, gst_amount, currency, payee_name, remark, customer_name, address, city, state, country, email, status, contact, created_on, updated_on  FROM `tbl_icici_payout_transaction_response_details` GROUP BY currency ";
    let sqlSettlementCurrency = "SELECT user_id, merchant_name, settlementId, settlementType, fromCurrency, toCurrency, exchangeRate, walletAddress, accountNumber, bankName, branchName, city, zip_code, country, swiftCode, requestedAmount, charges, net_amount_for_settlement, settlementAmount, status, requested_time, settlement_mode, account_name, authorizer FROM tbl_settlement WHERE settlement_mode = 1";
    let sqlCommissionThroughInternationalSettlement = "SELECT user_id, merchant_name, settlementId, settlementType, fromCurrency, toCurrency, exchangeRate, walletAddress, accountNumber, bankName, branchName, city, zip_code, country, swiftCode, SUM(requestedAmount) AS requestedAmounts, SUM(charges) As charge, SUM(net_amount_for_settlement) AS NetSettlementAmount, SUM(settlementAmount) AS settlementAmounts, status, requested_time, settlement_mode, account_name, authorizer FROM tbl_settlement WHERE settlement_mode = 1 GROUP BY user_id";
    let sqlCommissionDeposite = "SELECT order_no, transaction_id, card_4_4, ammount, payin_charges, gst_charges, ammount_type, payment_type, i_country, status, created_on, updated_on FROM tbl_merchant_transaction";
    let sqlCommissionPayout = "SELECT uniqueid, utrnumber, trx_type, amount, akonto_charge, gst_amount, status, currency, created_on, updated_on FROM `tbl_icici_payout_transaction_response_details` ";
    let sqlCommissionChargeback = "SELECT order_no, transaction_id, card_4_4, ammount, payin_charges, gst_charges, ammount_type, payment_type, i_country, created_on, updated_on FROM tbl_merchant_transaction WHERE status = 5";
    let sqlCommissionChargebackMerchant = "SELECT user_id, ammount, payin_charges, gst_charges FROM tbl_merchant_transaction WHERE status = 5 GROUP BY user_id";
    let sqlCommissionByMerchantDeposite1 = "SELECT  tbl_merchant_transaction.user_id, tbl_user.name, SUM(ammount) As Amount, SUM(payin_charges) AS Paying_Charge, SUM(gst_charges) AS gst FROM tbl_merchant_transaction INNER JOIN tbl_user ON tbl_merchant_transaction.user_id = tbl_user.id GROUP BY tbl_merchant_transaction.user_id";
    let sqlCommissionByMerchantPayout2 = "SELECT tbl_icici_payout_transaction_response_details.users_id, tbl_user.name, SUM(amount) As Amount, SUM(akonto_charge) AS Charge, SUM(gst_amount) AS gst FROM tbl_icici_payout_transaction_response_details INNER JOIN tbl_user ON tbl_icici_payout_transaction_response_details.users_id = tbl_user.id GROUP BY tbl_icici_payout_transaction_response_details.users_id"
    let sqlCommissionByMerchantSettlement3 = "SELECT user_id, merchant_name,SUM(requestedAmount) AS RequestedAmount, SUM(charges) As charges, SUM(net_amount_for_settlement) AS net_amt_fsettlement, SUM(settlementAmount) AS SettlementAmt FROM tbl_settlement GROUP BY user_id";
    let sqlSettlementFromBankAcquirer = "SELECT IF(payment_gateway.gateway_name!='', payment_gateway.gateway_name, 'NA') AS bank_name, SUM(mt.ammount) As amount, SUM(mt.payin_charges) AS payin_charges, SUM(mt.gst_charges) As gst FROM tbl_merchant_transaction mt LEFT JOIN payment_gateway ON mt.gatewayNumber = payment_gateway.id GROUP BY mt.gatewayNumber";

    if (from) {
        sqlMerchantSettlement += " AND DATE(created_on) >= '" + from + "'"
        sqlPayoutCurrency += " AND DATE(created_on) >= '" + from + "'"
        sqlSettlementCurrency += " AND DATE(created_on) >= '" + from + "'"
        sqlCommissionThroughInternationalSettlement += " AND DATE(created_on) >= '" + from + "'"
        sqlCommissionDeposite += " AND DATE(created_on) >= '" + from + "'"
        sqlCommissionPayout += " AND DATE(created_on) >= '" + from + "'"
        sqlCommissionChargeback += " AND DATE(created_on) >= '" + from + "'"
        sqlCommissionChargebackMerchant += " AND DATE(created_on) >= '" + from + "'"
        sqlCommissionByMerchantDeposite1 += " AND DATE(created_on) >= '" + from + "'"
        sqlCommissionByMerchantPayout2 += " AND DATE(created_on) >= '" + from + "'"
        sqlCommissionByMerchantSettlement3 += " AND DATE(created_on) >= '" + from + "'"
        sqlSettlementFromBankAcquirer += " AND DATE(created_on) >= '" + from + "'"

        if (to) {
            sqlMerchantSettlement += " AND DATE(created_on) <= '" + to + "'"
            sqlPayoutCurrency += " AND DATE(created_on) <= '" + to + "'"
            sqlSettlementCurrency += " AND DATE(created_on) <= '" + to + "'"
            sqlCommissionThroughInternationalSettlement += " AND DATE(created_on) <= '" + to + "'"
            sqlCommissionDeposite += " AND DATE(created_on) <= '" + to + "'"
            sqlCommissionPayout += " AND DATE(created_on) <= '" + to + "'"
            sqlCommissionChargeback += " AND DATE(created_on) <= '" + to + "'"
            sqlCommissionChargebackMerchant += " AND DATE(created_on) <= '" + to + "'"
            sqlCommissionByMerchantDeposite1 += " AND DATE(created_on) <= '" + to + "'"
            sqlCommissionByMerchantPayout2 += " AND DATE(created_on) <= '" + to + "'"
            sqlCommissionByMerchantSettlement3 += " AND DATE(created_on) <= '" + to + "'"
            sqlSettlementFromBankAcquirer += " AND DATE(created_on) <= '" + to + "'"
        }
    }

    try{
        
        // Merchant Settlement
        switch (value) {
            case 1: {
                let resultMerchantSettlement = await mysqlcon(sqlMerchantSettlement);

                let merchantSettlement = resultMerchantSettlement.map((item: { user_id: any; merchant_name: any; RequestedAmount: any; charges: any; net_amount_for_settlement: any; settlementAmount: any; }, index: number) => ({

                    'Sr': index + 1,
                    'User Id': item.user_id,
                    'Merchant Name': item.merchant_name,
                    'Requested Amount': item.RequestedAmount,
                    'Charges': item.charges,
                    'Net Amount For Settlement': item.net_amount_for_settlement,
                    'Settlement Amount': item.settlementAmount,
                }))
                merchantSettlement.push({
                    'Sr': null,
                    'User Id': null,
                    'Merchant Name': null,
                    'Requested Amount': null,
                    'Charges': null,
                    'Net Amount For Settlement': null,
                    'Settlement Amount': null,
                }, {
                    'Sr': null,
                    'User Id': null,
                    'Merchant Name': null,
                    'Requested Amount': null,
                    'Charges': 'Settlement Merchant Wise',
                    'Net Amount For Settlement': null,
                    'Settlement Amount': null,
                })
                res.status(200).json({
                    status: true,
                    message: " Merchant Settlement ",
                    data: merchantSettlement
                });
            }

        // Payout Currency
            case 2: {
                let resultPayoutCurrency = await mysqlcon(sqlPayoutCurrency);
                
                let PayoutCurrency = resultPayoutCurrency.map((item: { users_id: any; uniqueid: any; utrnumber: any; trx_type: any; creditacc: any; ifsc: any; bank_name: any; amount: any; akonto_charge: any; gst_amount: any; currency: any; payee_name: any; remark: any; customer_name: any; address: any; city: any; state: any; country: any; email: any; status: any; contact: any; created_on: any; updated_on: any; }, index: number) => ({
                    'Sr': index + 1,
                    'User Id': item.users_id,
                    'Unique Id': item.uniqueid,
                    'UTR Number': item.utrnumber,
                    'Mode': item.trx_type,
                    'Account Number': item.creditacc,
                    'IFSC Code': item.ifsc,
                    'Bank Name': item.bank_name,
                    'Amount': item.amount,
                    'Charges': item.akonto_charge,
                    'GST Charges': item.gst_amount,
                    'Currency': item.currency,
                    'Payee Name': item.payee_name,
                    'Remarks': item.remark,
                    'Customer Name': item.customer_name,
                    'Address': item.address,
                    'City': item.city,
                    'State': item.state,
                    'Country': item.country,
                    'Email': item.email,
                    'Status': item.status,
                    'Contact Number': item.contact,
                    'Created_on': item.created_on,
                    'Updated_on': item.updated_on,
                }))
                PayoutCurrency.push({
                    'Sr': '',
                    'User Id': '',
                    'Unique Id': '',
                    'UTR Number': '',
                    'Mode': '',
                    'Account Number': '',
                    'IFSC Code': '',
                    'Bank Name': '',
                    'Amount': '',
                    'Charges': '',
                    'GST Charges': '',
                    'Currency': '',
                    'Payee Name': '',
                    'Remarks': '',
                    'Customer Name': '',
                    'Address': '',
                    'City': '',
                    'State': '',
                    'Country': '',
                    'Email': '',
                    'Status': '',
                    'Contact Number': '',
                    'Created_on': '',
                    'Updated_on': '', 
                },
                {
                    'Sr': '',
                    'User Id': '',
                    'Unique Id': '',
                    'UTR Number': '',
                    'Mode': '',
                    'Account Number': '',
                    'IFSC Code': '',
                    'Bank Name': '',
                    'Amount': '',
                    'Charges': '',
                    'GST Charges': '',
                    'Currency': '',
                    'Payee Name': '',
                    'Remarks': '',
                    'Customer Name': '',
                    'Address': '',
                    'City': '',
                    'State': '',
                    'Country': '',
                    'Email': '',
                    'Status': '',
                    'Contact Number': '',
                    'Created_on': '',
                    'Updated_on': '',  
                },
                {
                    'Sr': '',
                    'User Id': '',
                    'Unique Id': '',
                    'UTR Number': 'Currency',
                    'Mode': '',
                    'Account Number': 'Amount',
                    'IFSC Code': '',
                    'Bank Name': 'Commission',
                    'Amount': '',
                    'Charges': '',
                    'GST Charges': '',
                    'Currency': '',
                    'Payee Name': '',
                    'Remarks': '',
                    'Customer Name': '',
                    'Address': '',
                    'City': '',
                    'State': '',
                    'Country': '',
                    'Email': '',
                    'Status': '',
                    'Contact Number': '',
                    'Created_on': '',
                    'Updated_on': '', 
                },
                {
                    'Sr': '',
                    'User Id': '',
                    'Unique Id': '',
                    'UTR Number': 'INR',
                    'Mode': '',
                    'Account Number': resultPayoutCurrency.filter((item: { currency: string; }) => item.currency === 'INR').reduce((total: number, current: { amount: any; }) => { return total += Number(current.amount)}, 0),
                    'IFSC Code': '',
                    'Bank Name': resultPayoutCurrency.filter((item: { currency: string; }) => item.currency === 'INR').reduce((total: number, current: { akonto_charge: any; }) => { return total += Number(current.akonto_charge)}, 0),
                    'Amount': '',
                    'Charges': '',
                    'GST Charges': '',
                    'Currency': '',
                    'Payee Name': '',
                    'Remarks': '',
                    'Customer Name': '',
                    'Address': '',
                    'City': '',
                    'State': '',
                    'Country': '',
                    'Email': '',
                    'Status': '',
                    'Contact Number': '',
                    'Created_on': '',
                    'Updated_on': '', 
                },
                )
                res.status(200).json({
                    status: true,
                    message: " Payout Currency ",
                    data: PayoutCurrency 
                });
            }
            
        // Settlement By Currency
            case 3: {
                let resultSettlementCurrency = await mysqlcon(sqlSettlementCurrency);

                let SettlementCurrency = resultSettlementCurrency.map((item: { users_id: any; merchant_name: any; settlementId: any; settlementType: any; fromCurrency: any; toCurrency: any; exchangeRate: any; walletAddress: any; accountNumber: any; bankName: any; branchName: any; city: any; zip_code: any; country: any; swiftCode: any; requestedAmount: any; charges: any; net_amount_for_settlement: any; settlementAmount: any; status: any; requested_time: any; settlement_mode: any; account_name: any; authorizer: any; }, index: number) => ({
                    'Sr': index + 1,
                    'User Id': item.users_id,
                    'Merchant Name': item.merchant_name,
                    'Settlement Id': item.settlementId,
                    'Settlement Type': item.settlementType,
                    'From Currency': item.fromCurrency,    
                    'To Currency': item.toCurrency,
                    'Exchange Rate': item.exchangeRate,
                    'Wallet Address': item.walletAddress,
                    'Account Number': item.accountNumber,
                    'Bank Name': item.bankName,
                    'Branch Name': item.branchName,
                    'City': item.city,  
                    'Zip Code': item.zip_code,
                    'Country': item.country,
                    'Swiftcode': item.swiftCode,
                    'Request Amount': item.requestedAmount,
                    'Charges': item.charges,
                    'Net Amount For Settlement': item.net_amount_for_settlement,
                    'Settlement Amount': item.settlementAmount,     
                    'Status': item.status,
                    'Requested Time': item.requested_time,
                    'Settlement Mode': item.settlement_mode,
                    'Account Name': item.account_name,
                    'Authorizer': item.authorizer,
                }))
                SettlementCurrency.push({
                    'Sr': '',
                    'User Id': '',
                    'Merchant Name': '',
                    'Settlement Id': '',
                    'Settlement Type': '',
                    'From Currency': '',    
                    'To Currency': '',
                    'Exchange Rate': '',
                    'Wallet Address': '',
                    'Account Number': '',
                    'Bank Name': '',
                    'Branch Name': '',
                    'City': '',  
                    'Zip Code': '',
                    'Country': '',
                    'Swiftcode': '',
                    'Request Amount': '',
                    'Charges': '',
                    'Net Amount For Settlement': '',
                    'Settlement Amount': '',     
                    'Status': '',
                    'Requested Time': '',
                    'Settlement Mode': '',
                    'Account Name': '',
                    'Authorizer': '', 
                },
                {
                    'Sr': '',
                    'User Id': '',
                    'Merchant Name': '',
                    'Settlement Id': '',
                    'Settlement Type': '',
                    'From Currency': '',    
                    'To Currency': '',
                    'Exchange Rate': '',
                    'Wallet Address': '',
                    'Account Number': '',
                    'Bank Name': '',
                    'Branch Name': '',
                    'City': '',  
                    'Zip Code': '',
                    'Country': '',
                    'Swiftcode': '',
                    'Request Amount': '',
                    'Charges': '',
                    'Net Amount For Settlement': '',
                    'Settlement Amount': '',     
                    'Status': '',
                    'Requested Time': '',
                    'Settlement Mode': '',
                    'Account Name': '',
                    'Authorizer': '', 
                },
                {
                    'Sr': '',
                    'User Id': '',
                    'Merchant Name': '',
                    'Settlement Id': 'Currency',
                    'Settlement Type': '',
                    'From Currency': 'Request Amount',    
                    'To Currency': '',
                    'Exchange Rate': 'Commission',
                    'Wallet Address': '',
                    'Account Number': 'Net Amount For Settlement',
                    'Bank Name': '',
                    'Branch Name': 'Settlement Amount',
                    'City': '',  
                    'Zip Code': '',
                    'Country': '',
                    'Swiftcode': '',
                    'Request Amount': '',
                    'Charges': '',
                    'Net Amount For Settlement': '',
                    'Settlement Amount': '',     
                    'Status': '',
                    'Requested Time': '',
                    'Settlement Mode': '',
                    'Account Name': '',
                    'Authorizer': '', 
                },
                )
                for (const x in currencies) {
                    SettlementCurrency.push({
                    'Sr': '',
                    'User Id': '',
                    'Merchant Name': '',
                    'Settlement Id': currencies[x],
                    'Settlement Type': '',
                    'From Currency': resultSettlementCurrency.filter((item: { fromCurrency: string; }) => item.fromCurrency === currencies[x]).reduce((total: number, current: { requestedAmount: any; }) => { return total += Number(current.requestedAmount)}, 0),    
                    'To Currency': '',
                    'Exchange Rate': resultSettlementCurrency.filter((item: { fromCurrency: string; }) => item.fromCurrency === currencies[x]).reduce((total: number, current: { charges: any; }) => { return total += Number(current.charges)}, 0),
                    'Wallet Address': '',
                    'Account Number': resultSettlementCurrency.filter((item: { fromCurrency: string; }) => item.fromCurrency === currencies[x]).reduce((total: number, current: { net_amount_for_settlement: any; }) => { return total += Number(current.net_amount_for_settlement)}, 0),
                    'Bank Name': '',
                    'Branch Name': resultSettlementCurrency.filter((item: { fromCurrency: string; }) => item.fromCurrency === currencies[x]).reduce((total: number, current: { settlementAmount: any; }) => { return total += Number(current.settlementAmount)}, 0),
                    'City': '',  
                    'Zip Code': '',
                    'Country': '',
                    'Swiftcode': '',
                    'Request Amount': '',
                    'Charges': '',
                    'Net Amount For Settlement': '',
                    'Settlement Amount': '',     
                    'Status': '',
                    'Requested Time': '',
                    'Settlement Mode': '',
                    'Account Name': '',
                    'Authorizer': '', 
                })
            }

                 res.status(200).json({
                    status: true,
                    message: " SettlementCurrency ",
                    data: SettlementCurrency 
                });
            }
        
        // Settlement From Bank/Acquirer
            case 4:{
                let resultSettlementFromBankAcquirer = await mysqlcon(sqlSettlementFromBankAcquirer); 

                let SettlementFromBankAcquirer = resultSettlementFromBankAcquirer.map((item: { bank_name: any; amount: any; payin_charges: any; gst: any; }, index: number) => ({
                    'Sr': index + 1,
                    'Bank Name': item.bank_name,
                    'Amount': item.amount,
                    'Paying Charge': item.payin_charges,
                    'GST Charges': item.gst   
                }))
                SettlementFromBankAcquirer.push({
                    'Sr': '',
                    'Bank Name': '',
                    'Amount': '',
                    'Paying Charge': '',
                    'GST Charges': ''   
                })

                res.status(200).json({
                    status: true,
                    message: " Settlement From Bank/Acquirer ",
                    data: SettlementFromBankAcquirer 
                });
            }

        // Commission Through International Settlement
            case 5:{
                let resultCommissionThroughInternationalSettlement = await mysqlcon(sqlCommissionThroughInternationalSettlement);

                let CommissionThroughInternationalSettlement = resultCommissionThroughInternationalSettlement.map((item: { users_id: any; merchant_name: any; settlementId: any; settlementType: any; fromCurrency: any; toCurrency: any; exchangeRate: any; walletAddress: any; accountNumber: any; bankName: any; branchName: any; city: any; zip_code: any; country: any; swiftCode: any; requestedAmounts: any; charge: any; NetSettlementAmount: any; settlementAmounts: any; status: any; requested_time: any; settlement_mode: any; account_name: any; authorizer: any; }, index: number) => ({
                    'Sr': index + 1,
                    'User Id': item.users_id,
                    'Merchant Name': item.merchant_name,
                    'Settlement Id': item.settlementId,
                    'Settlement Type': item.settlementType,
                    'From Currency': item.fromCurrency,    
                    'To Currency': item.toCurrency,
                    'Exchange Rate': item.exchangeRate,
                    'Wallet Address': item.walletAddress,
                    'Account Number': item.accountNumber,
                    'Bank Name': item.bankName,
                    'Branch Name': item.branchName,
                    'City': item.city,  
                    'Zip Code': item.zip_code,
                    'Country': item.country,
                    'Swiftcode': item.swiftCode,
                    'Request Amount': item.requestedAmounts,
                    'Charges': item.charge,
                    'Net Amount For Settlement': item.NetSettlementAmount,
                    'Settlement Amount': item.settlementAmounts,     
                    'Status': item.status,
                    'Requested Time': item.requested_time,
                    'Settlement Mode': item.settlement_mode,
                    'Account Name': item.account_name,
                    'Authorizer': item.authorizer,
                }))
                CommissionThroughInternationalSettlement.push({
                    'Sr': '',
                    'User Id': '',
                    'Merchant Name': '',
                    'Settlement Id': '',
                    'Settlement Type': '',
                    'From Currency': '',    
                    'To Currency': '',
                    'Exchange Rate': '',
                    'Wallet Address': '',
                    'Account Number': '',
                    'Bank Name': '',
                    'Branch Name': '',
                    'City': '',  
                    'Zip Code': '',
                    'Country': '',
                    'Swiftcode': '',
                    'Request Amount': '',
                    'Charges': '',
                    'Net Amount For Settlement': '',
                    'Settlement Amount': '',     
                    'Status': '',
                    'Requested Time': '',
                    'Settlement Mode': '',
                    'Account Name': '',
                    'Authorizer': '', 
                },
                {
                    'Sr': '',
                    'User Id': '',
                    'Merchant Name': '',
                    'Settlement Id': '',
                    'Settlement Type': '',
                    'From Currency': '',    
                    'To Currency': '',
                    'Exchange Rate': '',
                    'Wallet Address': '',
                    'Account Number': '',
                    'Bank Name': '',
                    'Branch Name': '',
                    'City': '',  
                    'Zip Code': '',
                    'Country': '',
                    'Swiftcode': '',
                    'Request Amount': '',
                    'Charges': '',
                    'Net Amount For Settlement': '',
                    'Settlement Amount': '',     
                    'Status': '',
                    'Requested Time': '',
                    'Settlement Mode': '',
                    'Account Name': '',
                    'Authorizer': '', 
                },
                {
                    'Sr': '',
                    'User Id': '',
                    'Merchant Name': '',
                    'Settlement Id': '',
                    'Settlement Type': 'Request Amount',
                    'From Currency': '',    
                    'To Currency': 'Total Charges',
                    'Exchange Rate': '',
                    'Wallet Address': 'Net Amount For Settlement',
                    'Account Number': '',
                    'Bank Name': 'Settlement Amount',
                    'Branch Name': '',
                    'City': '',  
                    'Zip Code': '',
                    'Country': '',
                    'Swiftcode': '',
                    'Request Amount': '',
                    'Charges': '',
                    'Net Amount For Settlement': '',
                    'Settlement Amount': '',     
                    'Status': '',
                    'Requested Time': '',
                    'Settlement Mode': '',
                    'Account Name': '',
                    'Authorizer': '', 
                },
                {
                    'Sr': '',
                    'User Id': '',
                    'Merchant Name': '',
                    'Settlement Id': '',
                    'Settlement Type': resultCommissionThroughInternationalSettlement.filter((item: { requestedAmounts: any; }) => item.requestedAmounts).reduce((total: number, current: { requestedAmounts: any; }) => { return total += Number(current.requestedAmounts)}, 0),
                    'From Currency': '',    
                    'To Currency': resultCommissionThroughInternationalSettlement.filter((item: { charge: any; }) => item.charge).reduce((total: number, current: { charge: any; }) => { return total += Number(current.charge)}, 0),
                    'Exchange Rate': '',
                    'Wallet Address': resultCommissionThroughInternationalSettlement.filter((item: { NetSettlementAmount: any; }) => item.NetSettlementAmount).reduce((total: number, current: { NetSettlementAmount: any; }) => { return total += Number(current.NetSettlementAmount)}, 0),
                    'Account Number': '',
                    'Bank Name': resultCommissionThroughInternationalSettlement.filter((item: { settlementAmounts: any; }) => item.settlementAmounts).reduce((total: number, current: { settlementAmounts: any; }) => { return total += Number(current.settlementAmounts)}, 0),
                    'Branch Name': '',
                    'City': '',  
                    'Zip Code': '',
                    'Country': '',
                    'Swiftcode': '',
                    'Request Amount': '',
                    'Charges': '',
                    'Net Amount For Settlement': '',
                    'Settlement Amount': '',     
                    'Status': '',
                    'Requested Time': '',
                    'Settlement Mode': '',
                    'Account Name': '',
                    'Authorizer': '', 
                })
                res.status(200).json({
                    status: true,
                    message: " Commission Through International Settlement ",
                    data: CommissionThroughInternationalSettlement 
                });
            }
        
        // Commission By Merchant
            case 6:{
                let resultCommissionByMerchantSettlement3 = await mysqlcon(sqlCommissionByMerchantSettlement3);

                let CommissionByMerchantSettlement3 = resultCommissionByMerchantSettlement3.map((item: { user_id: any; merchant_name: any; RequestedAmount: any; charges: any; net_amt_fsettlement: any; SettlementAmt: any; }, index: number) => ({
                    'Sr': index + 1, 
                    'User Id': item.user_id,
                    'Merchant Name': item.merchant_name,
                    'Amount': item.RequestedAmount, 
                    'Charges': item.charges,    
                    'Gst Charges': item.net_amt_fsettlement,
                    'Settlement Amount': item.SettlementAmt
                }))
                CommissionByMerchantSettlement3.push({
                    'Sr': '', 
                    'User Id': '',
                    'Merchant Name': '',
                    'Amount': '', 
                    'Charges': '',    
                    'Gst Charges': '',
                    'Settlement Amount': ''
                },
                {
                    'Sr': '', 
                    'User Id': '',
                    'Merchant Name': '',
                    'Amount': '', 
                    'Charges': '',    
                    'Gst Charges': '',
                    'Settlement Amount': ''
                },
                {
                    'Sr': '', 
                    'User Id': '',
                    'Merchant Name': 'Commission By Merchant Payout',
                    'Amount': '', 
                    'Charges': '',    
                    'Gst Charges': '',
                    'Settlement Amount': ''
                },
                {
                    'Sr': '', 
                    'User Id': '',
                    'Merchant Name': '',
                    'Amount': '', 
                    'Charges': '',    
                    'Gst Charges': '',
                    'Settlement Amount': ''  
                },
                {
                    'Sr': 'Sr', 
                    'User Id': 'User Id',
                    'Merchant Name': 'Merchant Name',
                    'Amount': 'Amount', 
                    'Charges': 'Charges',    
                    'Gst Charges': 'Gst Charges',
                    'Settlement Amount': null
                })
                let resultCommissionByMerchantPayout2 = await mysqlcon(sqlCommissionByMerchantPayout2)

                let CommissionByMerchantPayout2 = resultCommissionByMerchantPayout2.map((item: { users_id: any; name: any; Amount: any; Charge: any; gst: any; }, index: number) => ({
                    'Sr': index + 1, 
                    'User Id': item.users_id,
                    'Merchant Name': item.name,
                    'Amount': item.Amount, 
                    'Charges': item.Charge,    
                    'Gst Charges': item.gst
                }))
                CommissionByMerchantPayout2.push({
                    'Sr': '', 
                    'User Id': '',
                    'Merchant Name': '',
                    'Amount': '', 
                    'Charges': '',    
                    'Gst Charges': ''
                },
                {
                    'Sr': '', 
                    'User Id': '',
                    'Merchant Name': '',
                    'Amount': '', 
                    'Charges': '',    
                    'Gst Charges': ''
                },
                {
                    'Sr': '', 
                    'User Id': '',
                    'Merchant Name': 'Commission By Merchant Deposits',
                    'Amount': '', 
                    'Charges': '',    
                    'Gst Charges': ''
                },
                {
                    'Sr': '', 
                    'User Id': '',
                    'Merchant Name': '',
                    'Amount': '', 
                    'Charges': '',    
                    'Gst Charges': ''
                },
                {
                    'Sr': 'Sr', 
                    'User Id': 'User Id',
                    'Merchant Name': 'Merchant Name',
                    'Amount': 'Amount', 
                    'Charges': 'Charge',    
                    'Gst Charges': 'GST Charges',

                })
                let resultCommissionByMerchantDeposite1 = await mysqlcon(sqlCommissionByMerchantDeposite1)

                let CommissionByMerchantDeposite1 = resultCommissionByMerchantDeposite1.map((item: { user_id: any; name: any; Amount: any; Paying_Charge: any; gst: any; }, index: number) => ({
                    'Sr': index + 1, 
                    'User Id': item.user_id,
                    'Merchant Name':item.name,
                    'Amount': item.Amount, 
                    'Charges': item.Paying_Charge,    
                    'Gst Charges': item.gst
                }))
                CommissionByMerchantDeposite1.push({
                    'Sr': '', 
                    'User Id': '',
                    'Merchant Name': '',
                    'Amount': '', 
                    'Charges': '',    
                    'Gst Charges': ''
                })
            
                let data = [...CommissionByMerchantSettlement3, ...CommissionByMerchantPayout2, ...CommissionByMerchantDeposite1]
                res.status(200).json({
                    status: true,
                    message: " Commissions By Merchant ",
                    data:  data 
                });

            }

        // Commission By Deposite    
            case 7:{
                let resultCommissionDeposite = await mysqlcon(sqlCommissionDeposite);
                
                let CommissionDeposite = resultCommissionDeposite.map((item: { order_no: any; transaction_id: any; card_4_4: any; ammount: any; payin_charges: any; gst_charges: any; ammount_type: any; payment_type: any; i_country: any; status: any; created_on: any; updated_on: any; }, index: number) => ({
                    'Sr': index + 1,
                    'Order No': item.order_no,
                    'Transaction': item.transaction_id,
                    'Card No': item.card_4_4,
                    'Amount': item.ammount,
                    'Paying Charge': item.payin_charges,    
                    'Gst': item.gst_charges,
                    'Currency': item.ammount_type,
                    'Method': item.payment_type,
                    'Country': item.i_country,
                    'Status': item.status,
                    'Created_on': item.created_on,
                    'Updated_on': item.updated_on,  
                })) 
                CommissionDeposite.push({
                    'Sr': '',
                    'Order No': '',
                    'Transaction': '',
                    'Card No': '',
                    'Amount': '',
                    'Paying Charge': '',    
                    'Gst': '',
                    'Currency': '',
                    'Method': '',
                    'Country': '',
                    'Status': '',
                    'Created_on': '',
                    'Updated_on': '',  
                },
                {
                    'Sr': '',
                    'Order No': '',
                    'Transaction': '',
                    'Card No': '',
                    'Amount': '',
                    'Paying Charge': '',    
                    'Gst': '',
                    'Currency': '',
                    'Method': '',
                    'Country': '',
                    'Status': '',
                    'Created_on': '',
                    'Updated_on': '', 
                },
                {
                    'Sr': '',
                    'Order No': '',
                    'Transaction': '',
                    'Card No': 'Total Amount',
                    'Amount': '',
                    'Paying Charge': 'Commission',    
                    'Gst': '',
                    'Currency': '',
                    'Method': '',
                    'Country': '',
                    'Status': '',
                    'Created_on': '',
                    'Updated_on': '', 
                },
                {
                    'Sr': '',
                    'Order No': '',
                    'Transaction': '',
                    'Card No': resultCommissionDeposite.filter((item: { ammount: any; }) => item.ammount).reduce((total: number, current: { ammount: any; }) => { return total += Number(current.ammount)}, 0),
                    'Amount': '',
                    'Paying Charge': resultCommissionDeposite.filter((item: { payin_charges: any; }) => item.payin_charges).reduce((total: number, current: { payin_charges: any; }) => { return total += Number(current.payin_charges)}, 0),    
                    'Gst': '',
                    'Currency': '',
                    'Method': '',
                    'Country': '',
                    'Status': '',
                    'Created_on': '',
                    'Updated_on': '', 
                })
                 res.status(200).json({
                    status: true,
                    message: " Commission By Deposite ",
                    data: CommissionDeposite 
                });
            }

        // Commission By Payout
            case 8:{
                let resultCommissionPayout = await mysqlcon(sqlCommissionPayout);
                
                let CommissionPayout = resultCommissionPayout.map((item: { uniqueid: any; utrnumber: any; trx_type: any; amount: any; akonto_charge: any; gst_amount: any; status: any; currency: any; created_on: any; updated_on: any; }, index: number) => ({
                    'Sr': index + 1,
                    'Transaction No': item.uniqueid,
                    'UTR No': item.utrnumber,
                    'Method': item.trx_type,
                    'Amount': item.amount,
                    'Payout Charge': item.akonto_charge,
                    'GST': item.gst_amount,
                    'Status': item.status,
                    'Currency': item.currency,
                    'Created_on': item.created_on,
                    'Updated_on': item.updated_on
                })) 
                CommissionPayout.push({
                    'Sr': '',
                    'Transaction No': '',
                    'UTR No': '',
                    'Method': '',
                    'Amount': '',
                    'Payout Charge': '',
                    'GST': '',
                    'Status': '',
                    'Currency': '',
                    'Created_on': '',
                    'Updated_on': ''
                },
                {
                    'Sr': '',
                    'Transaction No': '',
                    'UTR No': '',
                    'Method': '',
                    'Amount': '',
                    'Payout Charge': '',
                    'GST': '',
                    'Status': '',
                    'Currency': '',
                    'Created_on': '',
                    'Updated_on': ''
                },
                {
                    'Sr': '',
                    'Transaction No': '',
                    'UTR No': '',
                    'Method': 'Total Amount',
                    'Amount': '',
                    'Payout Charge': 'Commission',
                    'GST': '',
                    'Status': '',
                    'Currency': '',
                    'Created_on': '',
                    'Updated_on': ''
                },
                {
                    'Sr': '',
                    'Transaction No': '',
                    'UTR No': '',
                    'Method': resultCommissionPayout.filter((item: { amount: any; }) => item.amount).reduce((total: number, current: { amount: any; }) => { return total += Number(current.amount)}, 0),
                    'Amount': '',
                    'Payout Charge': resultCommissionPayout.filter((item: { akonto_charge: any; }) => item.akonto_charge).reduce((total: number, current: { akonto_charge: any; }) => { return total += Number(current.akonto_charge)}, 0),
                    'GST': '',
                    'Status': '',
                    'Currency': '',
                    'Created_on': '',
                    'Updated_on': ''
                })
                 res.status(200).json({
                    status: true,
                    message: " Commission By Payout ",
                    data: CommissionPayout 
                });
            }

        // Commission By Currency(commission part )
            // case 9:{
            //     let resultCommissionDeposite = await mysqlcon(sqlCommissionDeposite);
                
            //     let CommissionDeposites = resultCommissionDeposite.map((item, index) => ({
            //         'Sr': index + 1,
            //         'Order No': item.order_no,
            //         'Transaction': item.transaction_id,
            //         'Card No': item.card_4_4,
            //         'Amount': item.ammount,
            //         'Paying Charge': item.payin_charges,    
            //         'Gst': item.gst_charges,
            //         'Currency': item.ammount_type,
            //         'Method': item.payment_type,
            //         'Country': item.i_country,
            //         'Status': item.status,
            //         'Created_on': item.created_on,
            //         'Updated_on': item.updated_on 
            //     })) 
            //     CommissionDeposites.push({
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': '',    
            //         'Gst': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''  
            //     },
            //     {
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': '',    
            //         'Gst': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''
            //     },
            //     {
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': 'Currency',
            //         'Amount': '',
            //         'Paying Charge': 'Total Amount',    
            //         'Gst': '',
            //         'Currency': 'Total Commission',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''
            //     },
            //     )
            //       for (x in currencies) {
            //         CommissionDeposites.push({ 
            //             'Sr': '',
            //             'Order No': '',
            //             'Transaction': '',
            //             'Card No': currencies[x],
            //             'Amount': '',
            //             'Paying Charge': resultCommissionDeposite.filter((item) => item.ammount_type === currencies[x]).reduce((total, current) => { return total += Number(current.ammount)}, 0),    
            //             'Gst': '',
            //             'Currency': resultCommissionDeposite.filter((item) => item.ammount_type === currencies[x]).reduce((total, current) => { return total += Number(current.payin_charges)}, 0),
            //             'Method': '',
            //             'Country': '',
            //             'Status': '',
            //             'Created_on': '',
            //             'Updated_on': ''
            //         })
            //     }
            //       CommissionDeposites.push({
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': '',    
            //         'Gst': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''  
            //     },
            //     {
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': '',    
            //         'Gst': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''
            //     },
            //     {
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': 'Commissions By Currency Payout',    
            //         'Gst': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''  
            //     },
            //     {
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': '',    
            //         'Gst': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''
            //     },
            //     {
            //         'Sr': 'Sr',
            //         'Order No': 'Transaction No',
            //         'Transaction': 'UTR No',
            //         'Card No': 'Method',
            //         'Amount': 'Amount',
            //         'Paying Charge': 'Payout Charge',    
            //         'Gst': 'Gst',
            //         'Currency': 'Status',
            //         'Method': 'Currency',
            //         'Country': 'Created_on',
            //         'Status': 'Updated_on',
            //         'Created_on': '',
            //         'Updated_on': ''
            //     })
            //     let resultCommissionPayout = await mysqlcon(sqlCommissionPayout);
            //     let CommissionPayouts = resultCommissionPayout.map((item, index) => ({
            //         'Sr': index + 1,
            //         'Order No': item.uniqueid,
            //         'Transaction': item.utrnumber,
            //         'Card No': item.trx_type,
            //         'Amount': item.amount,
            //         'Paying Charge': item.akonto_charge,
            //         'GST': item.gst_amount,
            //         'Currency': item.status,
            //         'Method': item.currency,
            //         'Country': item.created_on,
            //         'Status': item.updated_on,
            //         'Created_on': '',
            //         'Updated_on': ''
            //     })) 
            //     CommissionPayouts.push({
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': '',
            //         'GST': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''
            //     },
            //     { 
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': '',
            //         'GST': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''
            //     },
            //     {
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': 'Currency',
            //         'Amount': '',
            //         'Paying Charge': 'Total Amount',    
            //         'Gst': '',
            //         'Currency': 'Total Commission',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''
                    
            //     })
            //     for (x in currencies) {
            //         CommissionPayouts.push({ 
            //             'Sr': '',
            //             'Order No': '',
            //             'Transaction': '',
            //             'Card No': currencies[x],
            //             'Amount': '',
            //             'Paying Charge': resultCommissionPayout.filter((item) => item.currency === currencies[x]).reduce((total, current) => { return total += Number(current.amount)}, 0),    
            //             'Gst': '',
            //             'Currency': resultCommissionPayout.filter((item) => item.currency === currencies[x]).reduce((total, current) => { return total += Number(current.akonto_charge)}, 0),
            //             'Method': '',
            //             'Country': '',
            //             'Status': '',
            //             'Created_on': '',
            //             'Updated_on': ''
            //         })
            //     }
            //     CommissionPayouts.push({
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': '',    
            //         'Gst': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''  
            //     },
            //     {
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': '',    
            //         'Gst': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''
            //     },
            //     {
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': 'Commissions By Currency Settlement',    
            //         'Gst': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''  
            //     },
            //     {
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': '',    
            //         'Gst': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''
            //     },
            //     {
            //         'Sr': 'Sr',
            //         'Order No': 'User Id',
            //         'Transaction': 'Settlement Id',
            //         'Card No': 'settlement Type',
            //         'Amount': 'From Currency',
            //         'Paying Charge': 'To Currency',    
            //         'Gst': 'Exchange Rate',
            //         'Currency': 'Requested Amount',
            //         'Method': 'Charges',
            //         'Country': 'Net Amount For Settlement',
            //         'Status': 'Status',
            //         'Created_on': 'Requested Time',
            //         'Updated_on': 'Settlement Mode'
            //     })
            //     let resultSettlementCurrency = await mysqlcon(sqlSettlementCurrency);

            //     let SettlementCurrencys = resultSettlementCurrency.map((item, index) => ({
            //         'Sr': index + 1,
            //         'Order No': item.users_id,
            //         'Transaction': item.settlementId,
            //         'Card No': item.settlementType,
            //         'Amount': item.fromCurrency,
            //         'Paying Charge': item.toCurrency,    
            //         'Gst': item.exchangeRate,
            //         'Currency': item.requestedAmount,
            //         'Method': item.charges,
            //         'Country': item.net_amount_for_settlement,
            //         'Status': item.status,
            //         'Created_on': item.requested_time,
            //         'Updated_on': item.settlement_mode
            //     }))
            //     SettlementCurrencys.push({
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': '',
            //         'GST': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''
            //     },
            //     { 
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': '',
            //         'Amount': '',
            //         'Paying Charge': '',
            //         'GST': '',
            //         'Currency': '',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''
            //     },
            //     {
            //         'Sr': '',
            //         'Order No': '',
            //         'Transaction': '',
            //         'Card No': 'Currency',
            //         'Amount': '',
            //         'Paying Charge': 'Total Amount',    
            //         'Gst': '',
            //         'Currency': 'Total Commission',
            //         'Method': '',
            //         'Country': '',
            //         'Status': '',
            //         'Created_on': '',
            //         'Updated_on': ''
            //     })
            //     for (x in currencies) {
            //         SettlementCurrencys.push({ 
            //             'Sr': '',
            //             'Order No': '',
            //             'Transaction': '',
            //             'Card No': currencies[x],
            //             'Amount': '',
            //             'Paying Charge': resultCommissionPayout.filter((item) => item.fromCurrency === currencies[x]).reduce((total, current) => { return total += Number(current.requestedAmount)}, 0),    
            //             'Gst': '',
            //             'Currency': resultCommissionPayout.filter((item) => item.fromCurrency === currencies[x]).reduce((total, current) => { return total += Number(current.charges)}, 0),
            //             'Method': '',
            //             'Country': '',
            //             'Status': '',
            //             'Created_on': '',
            //             'Updated_on': ''
            //         })
            //     }

            //     let data = [...CommissionDeposites, ...CommissionPayouts, ...SettlementCurrencys]
            //     return res.status(200).json({
            //         status: true,
            //         message: " Commission By Currency ",
            //         data: data
            //     });
            // }

        // Commission through ChargeBack/Disputes
            case 10:{
                let resultCommissionChargeback = await mysqlcon(sqlCommissionChargeback);

                let CommissionChargeback = resultCommissionChargeback.map((item: { order_no: any; transaction_id: any; card_4_4: any; ammount: any; payin_charges: any; gst_charges: any; ammount_type: any; payment_type: any; i_country: any; created_on: any; updated_on: any; }, index: number) => ({
                    'Sr': index + 1,
                    'Order No': item.order_no,
                    'Transaction': item.transaction_id,
                    'Card No': item.card_4_4,
                    'Amount': item.ammount,
                    'Paying Charge': item.payin_charges,    
                    'Gst': item.gst_charges,
                    'Currency': item.ammount_type,
                    'Method': item.payment_type,
                    'Country': item.i_country,
                    'Created_on': item.created_on,
                    'Updated_on': item.updated_on,  

                }))
                CommissionChargeback.push({
                    'Sr': '',
                    'Order No': '',
                    'Transaction': '',
                    'Card No': '',
                    'Amount': '',
                    'Paying Charge': '',    
                    'Gst': '',
                    'Currency': '',
                    'Method': '',
                    'Country': '',
                    'Created_on': '',
                    'Updated_on': '',  
                },
                {
                    'Sr': '',
                    'Order No': '',
                    'Transaction': '',
                    'Card No': '',
                    'Amount': '',
                    'Paying Charge': '',    
                    'Gst': '',
                    'Currency': '',
                    'Method': '',
                    'Country': '',
                    'Created_on': '',
                    'Updated_on': '', 
                },
                {
                    'Sr': '',
                    'Order No': '',
                    'Transaction': '',
                    'Card No': '',
                    'Amount': 'Total Amount',
                    'Paying Charge': '',    
                    'Gst': 'Commission',
                    'Currency': '',
                    'Method': '',
                    'Country': '',
                    'Created_on': '',
                    'Updated_on': '', 
                },
                {
                    'Sr': '',
                    'Order No': '',
                    'Transaction': '',
                    'Card No': '',
                    'Amount': resultCommissionChargeback.filter((item: { ammount: any; }) => item.ammount).reduce((total: number, current: { ammount: any; }) => { return total += Number(current.ammount)}, 0),
                    'Paying Charge': '',    
                    'Gst': resultCommissionChargeback.filter((item: { payin_charges: any; }) => item.payin_charges).reduce((total: number, current: { payin_charges: any; }) => { return total += Number(current.payin_charges)}, 0),
                    'Currency': '',
                    'Method': '',
                    'Country': '',
                    'Status': '',
                    'Created_on': '',
                    'Updated_on': '', 
                })
                 res.status(200).json({
                    status: true,
                    message: " Commission Through Chargeback/Disputes ",
                    data: CommissionChargeback 
                });
            }

        // Chargeback/Disputes Merchants Wise
            case 11:{
                let resultChargebackDisputesMerchantsWise = await mysqlcon(sqlCommissionChargebackMerchant)

                let ChargebackDisputesMerchantsWise = resultChargebackDisputesMerchantsWise.map((item: { user_id: any; ammount: any; payin_charges: any; gst_charges: any; }, index: number) => ({
                    'Sr': index + 1, 
                    'User Id': item.user_id,
                    'Amount': item.ammount, 
                    'Paying Charge': item.payin_charges,    
                    'Gst': item.gst_charges
                }))
                ChargebackDisputesMerchantsWise.push({
                    'Sr': '', 
                    'User Id': '',
                    'Amount': '', 
                    'Paying Charge': '',    
                    'Gst': ''
                })
                 res.status(200).json({
                    status: true,
                    message: " Chargeback/Disputes Merchants Wise ",
                    data:  ChargebackDisputesMerchantsWise 
                });

            }
            default: {
                res.status(400).json({ status: false, message: 'Provide a value .', data: [] });
            }
        }

    }
    catch (Error) {
        console.log(Error)
        res.status(500).json({ status: false, message: 'Error to complete task.', Error });
    }
    finally {
        console.log("Execution completed.");
    }
    }
}

export default new reportSettle

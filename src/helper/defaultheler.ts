import { Request, Response } from "express";
import mysqlcon from '../config/db_connection';
import https from 'https';
import fetch from 'node-fetch';


interface TransactionDetails {
  txn_id: string;
  user_id: number;
  ammount: number; 
  ammount_type: string;
  created_on: string;
  order_no: string;
  end_point_url: string;
}

class defaultHelper {
  async merchantPaymentStatusUpdateOnEndPoint(fields: any, paymentStaticUrl: string): Promise<string> {
    const json_data = JSON.stringify(fields);

    const response = await fetch(paymentStaticUrl, {
      method: 'POST',
      body: json_data,
      headers: {
        'Content-Type': 'application/json',
      },
      agent: new https.Agent({ rejectUnauthorized: false }),
    });

    if (!response.ok) {
      throw new Error(`HTTP request failed with status ${response.status}`);
    }

    const responseText = await response.text();
    return responseText;
  }

  async getTransactionDetailsByOrderNo(orderNo: string): Promise<TransactionDetails> {
    const formattedDate = "DATE_FORMAT(tbl_merchant_transaction.created_on,'%Y-%m-%d %H:%i:%s') AS created_on";
    const query = `SELECT *, ${formattedDate} FROM tbl_merchant_transaction WHERE order_no = ?`;

    const result = await mysqlcon(query, [orderNo]) as TransactionDetails[];

    if (!result || result.length === 0) {
      throw new Error('Transaction not found');
    }

    return result[0];
  }
}

export default new defaultHelper();

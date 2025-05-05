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
const Refund = {
    merchantRefund: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const pagination = (total, page, limit) => {
                const numOfPages = Math.ceil(total / limit);
                const start = page * limit - limit;
                return { limit, start, numOfPages };
            };
            const { pages = 1, limit = 10, id } = req.body;
            let page = Number(pages);
            let itemsPerPage = Number(limit);
            let userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            let merchantIds = [];
            let total = 0;
            let start = 0;
            let numOfPages = 0;
            let results = [];
            if (id) {
                merchantIds = id.split(",");
                const countSql = "SELECT COUNT(*) AS Total FROM user_request WHERE merchant_id IN (?)";
                const countResult = yield (0, db_connection_1.default)(countSql, [merchantIds]);
                total = countResult[0].Total;
                ({ start, numOfPages } = pagination(total, page, itemsPerPage));
                const querySql = "SELECT invoice_Id, request_id, amount, status, refund_status, created_on, message FROM user_request WHERE merchant_id IN (?) ORDER BY created_on DESC LIMIT ?, ?";
                results = yield (0, db_connection_1.default)(querySql, [merchantIds, start, itemsPerPage]);
            }
            else {
                const countSql = "SELECT COUNT(*) AS Total FROM user_request WHERE merchant_id = ?";
                const countResult = yield (0, db_connection_1.default)(countSql, [userId]);
                total = countResult[0].Total;
                ({ start, numOfPages } = pagination(total, page, itemsPerPage));
                const querySql = "SELECT invoice_Id, request_id, amount, status, refund_status, created_on, message FROM user_request WHERE merchant_id = ? ORDER BY created_on DESC LIMIT ?, ?";
                results = yield (0, db_connection_1.default)(querySql, [userId, start, itemsPerPage]);
            }
            const startRange = start + 1;
            const endRange = start + results.length;
            const responseMessage = results.length === 0
                ? "Showing 0 data"
                : `Showing ${startRange} to ${endRange} data from ${total}`;
            const statusCode = results.length === 0 ? 201 : 200;
            res.status(statusCode).json({
                message: responseMessage,
                currentPage: page,
                totalPages: numOfPages,
                pageLimit: itemsPerPage,
                data: results,
            });
        }
        catch (error) {
            console.error("Refund Error:", error);
            res.status(500).json({
                message: "error",
            });
        }
    })
};
exports.default = Refund;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const identify_route_1 = __importDefault(require("./routes/identify.route"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use('/', identify_route_1.default);
// Basic health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

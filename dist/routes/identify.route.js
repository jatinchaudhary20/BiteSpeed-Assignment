"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const identify_controller_1 = require("../controllers/identify.controller");
const router = (0, express_1.Router)();
router.post('/identify', identify_controller_1.identify);
exports.default = router;

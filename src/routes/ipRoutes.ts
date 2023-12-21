import express from "express";
import ipController from "../controllers/ipController";
import { authenticateRequest } from "../middleware/authRequest";
const router = express.Router();

router.post("/", authenticateRequest, ipController.updateIp);
router.get("/", authenticateRequest, ipController.getIp);

export default router;

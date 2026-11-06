import { Router } from "express";

import { getMessages } from "../controllers/message.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// ==========================================
// GET CHAT HISTORY
// ==========================================

router.get(
  "/",
  authenticateToken,
  getMessages
);

export default router;
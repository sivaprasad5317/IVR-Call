import express from "express";
import { createCall, getCall } from "../controllers/callController.js";

const router = express.Router();

router.post("/", createCall);  // POST /api/calls
router.get("/:id", getCall);   // GET /api/calls/:id

export default router;

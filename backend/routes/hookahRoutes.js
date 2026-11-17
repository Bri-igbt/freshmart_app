import express from "express";
import {
  addHookah,
  deleteHookah,
  getHookahById,
  getHookahs,
  updateHookah,
} from "../controllers/hookahController.js";

const hookahRouter = express.Router();

hookahRouter.post("/", addHookah);
hookahRouter.get("/", getHookahs);
hookahRouter.get("/:id", getHookahById);
hookahRouter.get("/:id", updateHookah);
hookahRouter.delete("/:id", deleteHookah);

export default hookahRouter;

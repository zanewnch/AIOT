import { Router } from "express";
import {
  createDevice,
  getUserDevices,
  addDeviceData,
  getDeviceData,
} from "../controllers/mongoController";

const router = Router();

// Device 路由
router.post("/devices", createDevice);
router.get("/users/:userId/devices", getUserDevices);

// Device Data 路由
router.post("/device-data", addDeviceData);
router.get("/devices/:deviceId/data", getDeviceData);

export default router;

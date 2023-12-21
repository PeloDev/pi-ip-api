import { Request, Response } from "express";
import logger from "../services/loggerService";
import fs from "fs";

const getIp = async (req: Request, res: Response) => {
  const ipStorageFile = process.env.IP_STORAGE_FILE;
  try {
    if (!ipStorageFile) {
      res
        .status(503)
        .send("Service unavailable due to incomplete configuration.");
      logger.error("Environment variable not found");
      return;
    }
    if (fs.existsSync(ipStorageFile)) {
      const storedIp = fs.readFileSync(ipStorageFile, "utf8");
      res.status(200).send(storedIp);
    } else {
      res.status(404).send("No IP address stored");
    }
  } catch (error) {
    // @ts-ignore
    res.status(401).json({ error: error?.message });
    // @ts-ignore
    logger.error(error?.message);
  }
};

const updateIp = async (req: Request, res: Response) => {
  const ipStorageFile = process.env.IP_STORAGE_FILE;
  try {
    if (!ipStorageFile) {
      res
        .status(503)
        .send("Service unavailable due to incomplete configuration.");
      logger.error("Environment variable not found");
      return;
    }
    const { ipAddress } = req.body;
    if (!ipAddress) {
      res.status(400).send("No IP address provided");
      return;
    }
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ipAddress)) {
      res.status(400).send("Invalid IP address");
      return;
    }

    fs.writeFileSync(ipStorageFile, ipAddress);
    res.status(200).send("IP address updated successfully");
  } catch (error) {
    // @ts-ignore
    res.status(400).json({ error: error?.message });
    // @ts-ignore
    logger.error(error?.message);
  }
};

export default {
  getIp,
  updateIp,
};

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import logger from "../services/loggerService";

const TOKEN_EXPIRATION_PERIOD = 300; // 5 mins in seconds

export const authenticateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Security credentials not found");
  }

  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer Token

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    const issuedAtTime = (decoded as jwt.JwtPayload)?.iat;

    if (!issuedAtTime) {
      logger.error(
        "[middleware - authenticateRequest]: token has no issue time"
      );
      return res.sendStatus(401);
    }

    if (
      Math.floor(Date.now() / 1000) >=
      issuedAtTime + TOKEN_EXPIRATION_PERIOD
    ) {
      logger.error(
        "[middleware - authenticateRequest]: token expired"
      );
      return res.sendStatus(401);
    }

    if (err) {
      logger.error(`[middleware - authenticateRequest]: ${err.message}`);
      return res.sendStatus(401);
    }
    next();
  });
};

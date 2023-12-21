import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const authenticateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Security credentials not found");
  }
  
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer Token

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    (req as Request & { user: string | JwtPayload | undefined }).user = user;
    next();
  });
};

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTSECRET } from "@repo/backend-common/config";

export interface AuthenticatedRequest extends Request {
  userId: string;
}
export function middleware(req: Request, res: Response, next: NextFunction) {
  if (!JWTSECRET) {
    throw new Error("JWTSECRET is not defined");
  }

  const token = req.headers["authorization"] ?? "";
   if (!token) {
    res.status(401).json({ message: "Missing token" });
    return
  }

  try {
    const decoded = jwt.verify(token, JWTSECRET) as { userId: string };
    (req as AuthenticatedRequest).userId = decoded.userId;
    next();
  } catch (err) {
    res.status(403).json({ message: "Unauthorized" });
  }
}

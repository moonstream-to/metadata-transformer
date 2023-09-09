import { v4 as uuid4 } from "uuid";
import { Request, Response, NextFunction } from "express";

export function simpleLogger(req: Request, res: Response, next: NextFunction) {
  const internalRequestTraceID = uuid4();
  const requestTime = new Date();
  console.log(
    `Request ${internalRequestTraceID} -- time: ${requestTime.toISOString()}, method: ${
      req.method
    }, url: ${req.url}`
  );
  next();
  const responseTime = new Date();
  const responseTimeMs = responseTime.getTime() - requestTime.getTime();
  console.log();
}

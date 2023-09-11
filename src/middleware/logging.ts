import { Request, Response, NextFunction } from "express";
import { v4 as uuid4 } from "uuid";

export const TRACE_HEADER = "x-metadata-transformer-trace-id";

export function simpleLogger(req: Request, res: Response, next: NextFunction) {
  const internalRequestTraceID = uuid4();
  const requestTime = new Date();
  req.headers[TRACE_HEADER] = internalRequestTraceID.toString();
  console.log(
    `Request: ${internalRequestTraceID} -- Initiated -- time: ${requestTime.toISOString()}, method: ${
      req.method
    }, url: ${req.url}`
  );
  // These gymnastics are necessary because express middleware `next` functions do not return promises.
  const originalSend = res.send.bind(res);
  const wrappedSend = (body: any): Response<any> => {
    const responseTime = new Date();
    const responseDuration = responseTime.getTime() - requestTime.getTime();

    console.log(
      `Request: ${internalRequestTraceID} -- Completed -- time: ${responseTime.toISOString()}, method: ${
        req.method
      }, url: ${req.url}, status: ${
        res.statusCode
      }, duration: ${responseDuration} ms`
    );

    return originalSend(body);
  };

  res.send = wrappedSend;

  next();
}

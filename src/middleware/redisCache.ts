import { Request, Response, NextFunction } from "express";
import { createClient } from "redis";

export default function redisCache(connectionArgs?: any) {
  const cache = createClient(connectionArgs);
  cache.connect();
  return async (req: Request, res: Response, next: NextFunction) => {
    let isCacheWorking: boolean = true;
    let cachedMetadata: any = null;
    try {
      cachedMetadata = await cache.get(req.url);
    } catch {
      isCacheWorking = false;
    }
    if (isCacheWorking && !!cachedMetadata) {
      res.send(cachedMetadata);
    } else {
      const originalSend = res.send.bind(res);
      const wrappedSend = (body: any): Response<any> => {
        cache.set(req.url, body, { EX: 60 });
        return originalSend(body);
      };
      res.send = wrappedSend;
      next();
    }
  };
}

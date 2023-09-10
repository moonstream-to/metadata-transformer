import { Request, Response, NextFunction } from "express";
import { createClient, RedisClientOptions } from "redis";

import { TRACE_HEADER } from "./logging";

export interface MetadataTransformerCacheOptions {
  ttlMilliseconds: number;
  tracing: boolean;
}

export default function redisCache(
  cacheArgs: MetadataTransformerCacheOptions,
  connectionArgs?: RedisClientOptions
) {
  const cache = createClient(connectionArgs);
  cache.connect();

  return async (req: Request, res: Response, next: NextFunction) => {
    const requestTime = new Date();

    let tracingPrefix = "";
    if (cacheArgs.tracing) {
      const traceID = req.headers[TRACE_HEADER];
      tracingPrefix = `Request ${traceID} -- `;
    }
    let isCacheWorking: boolean = true;
    let cachedMetadata: any = null;

    try {
      cachedMetadata = await cache.get(req.url);
    } catch {
      isCacheWorking = false;
    }

    if (isCacheWorking && !!cachedMetadata) {
      console.log(
        `${tracingPrefix}Cache hit -- url: ${
          req.url
        }, time: ${requestTime.toISOString()}`
      );
      res.send(cachedMetadata);
    } else {
      console.log(
        `${tracingPrefix}Cache miss -- url: ${
          req.url
        }, time: ${requestTime.toISOString()}`
      );
      const originalSend = res.send.bind(res);
      const wrappedSend = (body: any): Response<any> => {
        cache.set(req.url, body, { PX: cacheArgs.ttlMilliseconds });
        return originalSend(body);
      };
      res.send = wrappedSend;
      next();
    }
  };
}

import { Request, Response, NextFunction } from "express";
import { createClient } from "redis";

import { TRACE_HEADER } from "./logging";

export interface MetadataTransformerCacheOptions {
  ttlMilliseconds: number;
  tracing: boolean;
}

export function cacheOptionsFromEnv(): MetadataTransformerCacheOptions {
  const ttlMillisecondsRaw = process.env.METADATA_TRANSFORMER_CACHE_TTL_MILLIS;
  if (!ttlMillisecondsRaw) {
    throw new Error(
      "Please set the METADATA_TRANSFORMER_CACHE_TTL_MILLIS environment variable",
    );
  }

  let ttlMilliseconds = 0;
  try {
    ttlMilliseconds = parseInt(ttlMillisecondsRaw);
  } catch {
    throw new Error(
      `Could not parse METADATA_TRANSFORMER_CACHE_TTL_MILLIS environment variable as an integer: ${ttlMillisecondsRaw}`,
    );
  }

  const tracingRaw = process.env.METADATA_TRANSFORMER_CACHE_TRACING || "false";
  const falseValues = ["0", "false", "f", "no", "n"];
  const tracing = !falseValues.includes(tracingRaw.toLowerCase());

  return { ttlMilliseconds, tracing };
}

export function redisCachingMiddleware(
  cacheArgs: MetadataTransformerCacheOptions,
  cache: ReturnType<typeof createClient>,
) {
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
        }, time: ${requestTime.toISOString()}`,
      );
      res.send(cachedMetadata);
    } else {
      console.log(
        `${tracingPrefix}Cache miss -- url: ${
          req.url
        }, time: ${requestTime.toISOString()}`,
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

import { Redis } from "@upstash/redis";

let redis;

export function getRedis() {
  if (!redis) {
    redis = Redis.fromEnv();
  }

  return redis;
}

import Redis from "ioredis";

const REDIS_URI = process.env.REDIS_URI || "";

const redis = new Redis(REDIS_URI, {
    maxRetriesPerRequest: null, // 
    tls: {
        rejectUnauthorized: false,
    },
});

redis.once("connect", () => {
    console.log("Upstash Redis connected successfully!");
});

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});

export default redis;
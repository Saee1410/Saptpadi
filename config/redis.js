// config/redis.js
const { createClient } = require('redis');

const client = createClient({
  url: "rediss://default:********@coherent-filly-112366.upstash.io:6379",
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
  }
});

client.on("error", (err) => console.log("Redis Client Error", err));

const connectRedis = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log("✅ Redis connected to Upstash");
    }
  } catch (err) {
    console.error("❌ Redis Connection Failed:", err.message);
  }
};

module.exports = { client, connectRedis };
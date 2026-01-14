import Redis from "ioredis"
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const instanceId = Math.floor(Math.random() * 10000);
console.log(`[Redis Instance ${instanceId}] Initializing client...`);

let client;

if (process.env.UPSTASH_REDIS_URL) {
    let connectionUrl = process.env.UPSTASH_REDIS_URL;

    if (connectionUrl.startsWith('redis://')) {
        console.warn(`[Redis Instance ${instanceId}] Warning: URL starts with 'redis://', upgrading to 'rediss://' for SSL connection.`);
        connectionUrl = connectionUrl.replace('redis://', 'rediss://');
    }

    console.log(`[Redis Instance ${instanceId}] Connection URL starts with: ${connectionUrl.substring(0, 8)}`);
    client = new Redis(connectionUrl);
} else {
    console.error(`[Redis Instance ${instanceId}] UPSTASH_REDIS_URL is strictly undefined!`);
    client = new Redis(); // Fallback to default which might fail but handles the export
}

export const redis = client;

redis.on("connect", () => {
    console.log(`[Redis Instance ${instanceId}] Connected`);
});

redis.on("error", (error) => {
    console.error(`[Redis Instance ${instanceId}] Connection error:`, error);
});

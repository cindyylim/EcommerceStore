import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

async function test() {
    try {
        console.log("Starting MongoMemoryServer...");
        const mongoServer = await MongoMemoryServer.create({
            binary: {
                version: '6.0.4', // Try a specific version found in common CI environments
            }
        });
        console.log("MongoMemoryServer started:", mongoServer.getUri());
        await mongoServer.stop();
    } catch (error) {
        console.error("Error:", error);
    }
}

test();

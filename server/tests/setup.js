import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

export const connectDB = async () => {
    try {
        mongoServer = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: "wiredTiger" },
            binary: { version: '6.0.4' }
        });
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log("Mock MongoDB connected");
    } catch (error) {
        console.error("Mock MongoDB connection error:", error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

export const disconnectDB = async () => {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
        console.log("Mock MongoDB disconnected");
    } catch (error) {
        console.error("Mock MongoDB disconnection error:", error);
    }
};

export const clearDB = async () => {
    try {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany();
        }
    } catch (error) {
        console.error("Mock MongoDB clear error:", error);
    }
};

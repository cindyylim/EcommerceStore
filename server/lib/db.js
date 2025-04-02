import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createAllIndexes } from "../utils/createIndexes.js";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('Environment variables loaded:', {
        envPath: path.join(__dirname, '../../.env'),
        availableEnvVars: Object.keys(process.env),
        mongoURIExists: 'MONGO_URI' in process.env
      });
      throw new Error('Mongo URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create database indexes for all collections
    await createAllIndexes();

    return conn;
  } catch (error) {
    console.error('MongoDB connection error details:', {
      message: error.message,
      stack: error.stack,
      mongoURI: process.env.MONGO_URI ? 'URI exists' : 'URI is undefined'
    });
    process.exit(1);
  }
};

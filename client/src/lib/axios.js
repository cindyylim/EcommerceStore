import axios from "axios";
import { createRetryableAxios } from "../utils/retryUtils";

const axiosInstance = axios.create({
    baseURL: "http://localhost:5000",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add retry logic with exponential backoff
createRetryableAxios(axiosInstance, {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 8000,  // 8 seconds max
    onRetry: (attempt, error, delay) => {
        console.log(`Retrying request (attempt ${attempt}/3) after ${delay}ms...`, {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status
        });
    }
});

export default axiosInstance;
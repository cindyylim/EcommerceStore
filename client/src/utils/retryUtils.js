/**
 * Retry utility with exponential backoff
 * Automatically retries failed requests with increasing delays
 */

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Determine if an error should be retried
 */
const shouldRetry = (error, attempt, maxRetries) => {
    // Don't retry if we've hit max attempts
    if (attempt >= maxRetries) {
        return false;
    }

    // Don't retry if there's no error
    if (!error) {
        return false;
    }

    // Retry on network errors
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
        return true;
    }

    // Retry on 5xx server errors
    if (error.response && error.response.status >= 500) {
        return true;
    }

    // Retry on 429 (Too Many Requests)
    if (error.response && error.response.status === 429) {
        return true;
    }

    // Retry on specific 408 (Request Timeout)
    if (error.response && error.response.status === 408) {
        return true;
    }

    // Don't retry on 401 (Unauthorized) - user needs to log in
    if (error.response && error.response.status === 401) {
        return false;
    }

    // Don't retry on other 4xx client errors (except 408, 429 handled above)
    return false;
};

/**
 * Calculate delay using exponential backoff with jitter
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
const calculateDelay = (attempt, baseDelay = 1000, maxDelay = 10000) => {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelay * Math.pow(2, attempt);

    // Cap at maxDelay
    const cappedDelay = Math.min(exponentialDelay, maxDelay);

    // Add jitter (random 0-20% variation) to prevent thundering herd
    const jitter = cappedDelay * 0.2 * Math.random();

    return Math.floor(cappedDelay + jitter);
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.onRetry - Callback called on each retry (attempt, error, delay)
 * @param {Function} options.shouldRetry - Custom shouldRetry function
 * @returns {Promise} Result of the function or throws last error
 */
export const retryWithBackoff = async (fn, options = {}) => {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        onRetry = () => { },
        shouldRetry: customShouldRetry = null
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Try executing the function
            const result = await fn();
            return result;
        } catch (error) {
            lastError = error;

            // Check if we should retry
            const retry = customShouldRetry
                ? customShouldRetry(error, attempt, maxRetries)
                : shouldRetry(error, attempt, maxRetries);

            if (!retry) {
                // Don't retry, throw the error
                throw error;
            }

            // Calculate delay for this attempt
            const delay = calculateDelay(attempt, baseDelay, maxDelay);

            // Call onRetry callback
            onRetry(attempt + 1, error, delay);

            // Wait before retrying
            await sleep(delay);
        }
    }

    // All retries exhausted, throw last error
    throw lastError;
};

/**
 * Create a retry wrapper for axios instance
 * Usage: const axios = createRetryableAxios(axiosInstance, { maxRetries: 3 })
 */
export const createRetryableAxios = (axiosInstance, retryOptions = {}) => {
    // Intercept responses
    axiosInstance.interceptors.response.use(
        // Success - pass through
        (response) => response,

        // Error - retry if applicable
        async (error) => {
            const config = error.config;

            // Avoid retrying if this is already a retry (prevent infinite loops)
            if (config.__retryCount >= (retryOptions.maxRetries || 3)) {
                return Promise.reject(error);
            }

            // Initialize retry count
            config.__retryCount = config.__retryCount || 0;

            // Check if we should retry
            if (!shouldRetry(error, config.__retryCount, retryOptions.maxRetries || 3)) {
                return Promise.reject(error);
            }

            // Increment retry count
            config.__retryCount += 1;

            // Calculate delay
            const delay = calculateDelay(
                config.__retryCount - 1,
                retryOptions.baseDelay || 1000,
                retryOptions.maxDelay || 10000
            );

            // Call onRetry callback if provided
            if (retryOptions.onRetry) {
                retryOptions.onRetry(config.__retryCount, error, delay);
            }

            // Wait before retrying
            await sleep(delay);

            // Retry the request
            return axiosInstance(config);
        }
    );

    return axiosInstance;
};

// Export utilities
export { shouldRetry, calculateDelay, sleep };

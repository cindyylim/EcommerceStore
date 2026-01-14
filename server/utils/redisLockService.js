import { redis } from '../lib/redis.js';

/**
 * Service to handle Redis locks for concurrency control
 */

/**
 * Attempts to acquire a lock for a specific resource
 * @param {string} resourceId - The ID of the resource to lock
 * @param {number} ttlMinutes - Lock time to live in minutes
 * @returns {Promise<string|null>} - Returns lock ID if acquired, null if already locked
 */
export const acquireLock = async (resourceId, ttlMinutes = 5) => {
    const lockKey = `lock:${resourceId}`;
    const lockId = Math.random().toString(36).substring(2, 15);

    // Set the lock only if it doesn't exist (NX) with an expiry (EX)
    const acquired = await redis.set(lockKey, lockId, 'NX', 'EX', ttlMinutes * 60);

    return acquired === 'OK' ? lockId : null;
};

/**
 * Releases a previously acquired lock
 * @param {string} resourceId - The ID of the locked resource
 * @param {string} lockId - The lock ID received when acquiring the lock
 * @returns {Promise<boolean>} - True if lock was released, false if lock didn't exist or belonged to someone else
 */
export const releaseLock = async (resourceId, lockId) => {
    const lockKey = `lock:${resourceId}`;
    const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

    const result = await redis.eval(script, 1, lockKey, lockId);
    return result === 1;
};

/**
 * Clean up expired locks
 * Note: Redis automatically handles expiration via 'EX', but this function 
 * can be used if we need to manually clean up any metadata or perform checks.
 * For now, this is a placeholder to satisfy the scheduler import.
 */
export const cleanupExpiredLocks = async () => {
    // Redis 'EX' option handles cleanup automatically.
    // This function exists to satisfy the scheduler's dependency 
    // and provide a hook for future custom cleanup logic if needed.
    return {
        cleanedCount: 0
    };
};

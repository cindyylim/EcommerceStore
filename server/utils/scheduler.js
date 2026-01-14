import cron from 'node-cron';
import { expireCheckoutSessions } from './sessionExpiryService.js';

/**
 * Scheduler service to run periodic tasks
 * Uses node-cron to schedule tasks at specified intervals
 */

/**
 * Start all scheduled tasks
 */
export const startScheduler = () => {
  console.log('🕐 Starting scheduler for periodic tasks...');

  // Run every minute to check for expired checkout sessions
  cron.schedule('* * * * *', async () => {
    try {
      const result = await expireCheckoutSessions();

      if (result.expiredCount > 0) {
        console.log(`🔒 Session expiry task: ${result.expiredCount} sessions expired`);
      }

      if (result.errorCount > 0) {
        console.error(`❌ Session expiry task: ${result.errorCount} errors occurred`);
        result.errors.forEach(error => console.error(`  - ${error}`));
      }
    } catch (error) {
      console.error('❌ Error in scheduled session expiry task:', error);
    }
  });

  // Run every 5 minutes to clean up any orphaned locks
  cron.schedule('*/5 * * * *', async () => {
    try {
      const { cleanupExpiredLocks } = await import('./redisLockService.js');
      const result = await cleanupExpiredLocks();

      if (result.cleanedCount > 0) {
        console.log(`🧹 Lock cleanup task: ${result.cleanedCount} orphaned locks cleaned`);
      }
    } catch (error) {
      console.error('❌ Error in scheduled lock cleanup task:', error);
    }
  });

  console.log('✅ Scheduler started successfully');
  console.log('  - Session expiry check: Every minute');
  console.log('  - Lock cleanup: Every 5 minutes');
};

/**
 * Stop all scheduled tasks
 */
export const stopScheduler = () => {
  console.log('🛑 Stopping scheduler...');
  cron.getTasks().forEach(task => task.stop());
  console.log('✅ Scheduler stopped');
};

/**
 * Get status of all scheduled tasks
 * @returns {Object} - Status information
 */
export const getSchedulerStatus = () => {
  const tasks = cron.getTasks();
  const taskList = [];

  tasks.forEach((task, name) => {
    taskList.push({
      name,
      running: task.getStatus() === 'scheduled',
      nextExecution: task.nextDate()?.toISOString()
    });
  });

  return {
    taskCount: tasks.size,
    tasks: taskList
  };
};
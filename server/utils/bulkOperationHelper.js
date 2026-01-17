/**
 * Utility function to handle batched bulk operations with a 1,000 document limit per transaction
 * @param {Array} bulkOps - Array of bulk operations to execute
 * @param {mongoose.Session} session - Mongoose session for transaction
 * @param {Model} model - Mongoose model to perform bulk operations on
 * @returns {Promise<Object>} - Combined results of all batched operations
 */
export const executeBatchedBulkWrite = async (bulkOps, session, model) => {
  const BATCH_SIZE = 1000;
  const results = {
    modifiedCount: 0,
    insertedCount: 0,
    upsertedCount: 0,
    deletedCount: 0,
    matchedCount: 0,
    batchCount: 0
  };

  // If no operations, return empty results
  if (!bulkOps || bulkOps.length === 0) {
    return results;
  }

  // Process operations in batches
  for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
    const batch = bulkOps.slice(i, i + BATCH_SIZE);
    results.batchCount++;

    try {
      const batchResult = await model.bulkWrite(batch, {
        session: session
      });

      // Accumulate results
      results.modifiedCount += batchResult.modifiedCount;
      results.insertedCount += batchResult.insertedCount;
      results.upsertedCount += batchResult.upsertedCount;
      results.deletedCount += batchResult.deletedCount;
      results.matchedCount += batchResult.matchedCount;

    } catch (error) {
      console.error(`❌ Batch ${results.batchCount} failed:`, error);
      throw new Error(`Bulk operation failed in batch ${results.batchCount}: ${error.message}`);
    }
  }

  return results;
};
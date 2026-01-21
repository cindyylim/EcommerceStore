import { jest } from "@jest/globals";
import { executeBatchedBulkWrite } from "../../utils/bulkOperationHelper.js";

describe("Bulk Operation Helper Tests", () => {
    let mockModel;

    beforeEach(() => {
        mockModel = {
            bulkWrite: jest.fn()
        };
        jest.clearAllMocks();
    });

    it("should return empty results if no operations provided", async () => {
        const results = await executeBatchedBulkWrite([], null, mockModel);
        expect(results).toEqual({
            modifiedCount: 0,
            insertedCount: 0,
            upsertedCount: 0,
            deletedCount: 0,
            matchedCount: 0,
            batchCount: 0
        });
        expect(mockModel.bulkWrite).not.toHaveBeenCalled();
    });

    it("should execute operations in a single batch if count < BATCH_SIZE", async () => {
        const bulkOps = [{ updateOne: { filter: { _id: 1 }, update: { $set: { a: 1 } } } }];
        mockModel.bulkWrite.mockResolvedValue({
            modifiedCount: 1,
            insertedCount: 0,
            upsertedCount: 0,
            deletedCount: 0,
            matchedCount: 1
        });

        const results = await executeBatchedBulkWrite(bulkOps, null, mockModel);

        expect(results.batchCount).toBe(1);
        expect(results.modifiedCount).toBe(1);
        expect(mockModel.bulkWrite).toHaveBeenCalledTimes(1);
    });

    it("should execute operations in multiple batches if count > BATCH_SIZE", async () => {
        // Creating 1500 operations (will take 2 batches of default 1000)
        const bulkOps = Array(1500).fill({ updateOne: {} });
        mockModel.bulkWrite.mockResolvedValue({
            modifiedCount: 500,
            insertedCount: 0,
            upsertedCount: 0,
            deletedCount: 0,
            matchedCount: 500
        });

        const results = await executeBatchedBulkWrite(bulkOps, null, mockModel);

        expect(results.batchCount).toBe(2);
        expect(results.modifiedCount).toBe(1000); // 500 * 2
        expect(mockModel.bulkWrite).toHaveBeenCalledTimes(2);
    });

    it("should throw error if any batch fails", async () => {
        const bulkOps = [{ updateOne: {} }];
        mockModel.bulkWrite.mockRejectedValue(new Error("Database error"));

        await expect(executeBatchedBulkWrite(bulkOps, null, mockModel))
            .rejects.toThrow("Bulk operation failed in batch 1: Database error");
    });
});

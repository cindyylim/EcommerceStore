import mongoose from "mongoose";

const idempotencyKeySchema = new mongoose.Schema(
    {
        idempotencyKey: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["pending", "completed"],
            default: "pending",
        },
        processedAt: {
            type: Date,
            default: Date.now
        },
        lockExpiry: {
            type: Date,
            default: Date.now() + 300 * 60 * 1000 // 5 minutes
        }
    },
    { timestamps: true }
);

idempotencyKeySchema.index({ idempotencyKey: 1, status: 1 });
idempotencyKeySchema.index({ lockExpiry: 1 });
const IdempotencyKey = mongoose.model("IdempotencyKey", idempotencyKeySchema);
export default IdempotencyKey; 
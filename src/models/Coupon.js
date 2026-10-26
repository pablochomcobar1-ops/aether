import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9]{3,20}$/, "Use 3 to 20 letters or numbers"],
    },
    type: { type: String, required: true, enum: ["percent", "flat"] },
    value: {
      type: Number,
      required: true,
      min: 1,
      validate: [
        { validator: Number.isInteger, message: "Value must be a whole number" },
        {
          validator(value) {
            return this.type !== "percent" || value <= 90;
          },
          message: "A percent discount can be at most 90",
        },
      ],
    },
    minSubtotal: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number, default: null, min: 1 },
    uses: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

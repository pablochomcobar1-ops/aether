import mongoose from "mongoose";
import { SIZES, SIDES, LINES, PRICE_RANGE } from "../lib/constants.js";

const sizeSchema = new mongoose.Schema(
  {
    uk: { type: Number, required: true, enum: SIZES },
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        "Slug can only use a-z, 0-9 and dashes",
      ],
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    side: { type: String, required: true, enum: SIDES },
    line: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return LINES[this.side]?.includes(value) ?? false;
        },
        message: "This collection doesn't belong to this side",
      },
    },
    price: {
      type: Number,
      required: true,
      validate: [
        { validator: Number.isInteger, message: "Price must be whole paise" },
        {
          validator(value) {
            const range = PRICE_RANGE[this.side];
            return range ? value >= range[0] && value <= range[1] : false;
          },
          message: "Price is outside this side's range",
        },
      ],
    },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    details: [{ type: String, trim: true, maxlength: 200 }],
    colorway: { type: String, trim: true, maxlength: 60 },
    images: [{ type: String, trim: true }],
    sizes: {
      type: [sizeSchema],
      validate: {
        validator: (sizes) =>
          new Set(sizes.map((s) => s.uk)).size === sizes.length,
        message: "Each size can only appear once",
      },
    },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ side: 1, line: 1, active: 1 });

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);

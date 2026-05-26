import mongoose from "mongoose";

const therapySchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Therapy name is required"],
      unique:   true,
      trim:     true
    },
    code: {
      type:      String,
      required:  [true, "Therapy code is required"],
      unique:    true,
      uppercase: true,
      trim:      true
    },
    category: {
      type:    String,
      enum:    ["Panchakarma", "Massage", "Yoga", "Diet", "Herbal", "Shirodhara", "Other"],
      default: "Other"
    },
    duration: {
      type:     Number,
      required: [true, "Duration is required"],
      min:      [1, "Duration must be at least 1 minute"]
    },
    price: {
      type:    Number,
      default: 0,
      min:     [0, "Price cannot be negative"]
    },
    description: {
      type: String,
      trim: true
    },
    benefits:          { type: [String], default: [] },
    contraindications: { type: [String], default: [] },
    isActive:          { type: Boolean, default: true },

    // Practitioner who offers this therapy
    practitioner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "Practitioner is required"]
    },
    // Legacy patient ref (optional)
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User"
    }
  },
  {
    timestamps:  true,
    versionKey:  false
  }
);

export default mongoose.model("Therapy", therapySchema);

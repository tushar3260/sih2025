import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  dob: Date,
  gender: { type: String, enum: ["male", "female", "other"] },
  bloodGroup: { type: String, enum: ["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"], default: "Unknown" },
  medicalHistory: [String],
  allergies: [String],
  prakriti: {
    type: String,
    enum: ["Vata", "Pitta", "Kapha", "Vata-Pitta", "Pitta-Kapha", "Vata-Kapha", "Tridoshic", "Unknown"],
    default: "Unknown"
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
  lifestyle: {
    dietType: { type: String, enum: ["vegetarian", "non-vegetarian", "vegan", ""], default: "" },
    sleepQuality: { type: String, enum: ["excellent", "good", "fair", "poor", ""], default: "" },
    activityLevel: { type: String, enum: ["sedentary", "moderate", "high", ""], default: "" },
    stressLevel: { type: String, enum: ["low", "moderate", "high", ""], default: "" },
  },
}, { timestamps: true });

export default mongoose.model("Patient", schema);

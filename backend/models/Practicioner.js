import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  start: String,
  end:   String
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  weekday: { type: Number, min: 0, max: 6, required: true },
  slots:   [slotSchema]
}, { _id: false });

const breakSchema = new mongoose.Schema({
  date:   Date,
  start:  String,
  end:    String,
  reason: String
}, { _id: false });

const qualificationSchema = new mongoose.Schema({
  degree:      String,
  institution: String,
  year:        Number,
}, { _id: false });

const schema = new mongoose.Schema({
  user:             { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  specialty:        [String],
  bio:              { type: String, default: "" },
  qualifications:   [qualificationSchema],
  experience:       { type: Number, default: 0 },   // years
  languages:        { type: [String], default: ["Hindi", "English"] },
  consultationFee:  { type: Number, default: 0 },
  profilePhoto:     { type: String, default: "" },  // URL / base64
  availability:     [availabilitySchema],
  breaks:           [breakSchema],
  rating:           { type: Number, default: 0, min: 0, max: 5 },
  totalReviews:     { type: Number, default: 0 },
  isVerified:       { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Practitioner", schema);

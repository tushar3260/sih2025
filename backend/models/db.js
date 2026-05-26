import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {

    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process with failure
  }
}

export default connectToDb;
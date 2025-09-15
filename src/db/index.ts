import mongoose from "mongoose";
import config from "../DefaultConfig/config";
import { seedAdmin } from '../utils/seedAdmin';

export const connectToDB = async () => {
  try {
    await mongoose.connect(config?.DATABASE_URL || "", {
      dbName: "testdb" //config?.DB_NAME,
    });
    console.log("connected to database");
    await seedAdmin();
  } catch (error) {
    console.log(error);
  }
};

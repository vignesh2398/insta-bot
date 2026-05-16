import mongoose from "mongoose";

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);

//     console.log("MongoDB Connected");
//   } catch (error) {
//     console.error(error);
//     process.exit(1);
//   }
// };

// export default connectDB;

// const uri = "mongodb+srv://rvignesh60474_db_user:sXFTEK7MQIkvW3Rm@instaautomation.zsrca9b.mongodb.net/?appName=instaAutomation";
// const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
// export async function run() {
//   try {
//     // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
//     await mongoose.connect(uri, clientOptions);
    
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } 
// }
// run().catch(console.dir);
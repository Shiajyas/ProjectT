const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_URI, {
   
      useNewUrlParser: false, 
      useUnifiedTopology: true,
      bufferCommands: true, 
      serverSelectionTimeoutMS: 10000,
    });

    console.log("DB connected");
    console.log("Host:", connect.connection.host);
    console.log("Database:", connect.connection.name);
  } catch (e) {
    console.error("DB connection error:", e.message);
    console.log("DB disconnected");
  }
};

module.exports = connectDB ; 
 
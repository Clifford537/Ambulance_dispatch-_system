const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverApi: {
                version: '1', 
                strict: true,
                deprecationErrors: true,
            }
        });

        console.log("MongoDB Atlas Connected...");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        process.exit(1);
    }
};

module.exports = connectDB;

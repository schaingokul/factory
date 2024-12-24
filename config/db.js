const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    const db = conn.connection.db;

    // Drop unique index on 'id' if it exists
    const collection = db.collection('factoryusers');
    const indexes = await collection.indexes();
    
    const idIndex = indexes.find((index) => index.key.id === 1); // Check for unique index on 'id'
    
    if (idIndex) {
      await collection.dropIndex(idIndex.name);
      console.log('Dropped unique index on id.');
    }

  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
};


module.exports = connectDB;

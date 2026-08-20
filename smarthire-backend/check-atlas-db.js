import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://omkeshmanjute1_db_user:hKiu8rUybf99OLwA@myats.idrjty1.mongodb.net/?appName=MyAts';

async function main() {
  console.log('🔄 Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected successfully.');

    // Fetch and log recruiters including password
    const RecruiterStore = mongoose.model('RecruiterStore', new mongoose.Schema({
      name: String,
      email: String,
      password: { type: String, select: true },
      role: String,
      refCode: String
    }), 'recruiterstores');

    const user = await RecruiterStore.findOne({ email: 'omkesh@coolsofttech.com' });
    if (user) {
      console.log(`\nUser: ${user.email}`);
      console.log(`Stored Password: ${user.password}`);
    } else {
      console.log('User not found.');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

main();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/admin");
require("dotenv").config();

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const Password = "Password@12"; 

    const admins = [
      {
        fullname: "Ogunremi Tunde",
        email: "ogunremitunde12@gmail.com",
        phone: "08062459861",
        username: "ogunremi",
      },
      {
        fullname: "taofeek abdulsalam",
        email: "taofeekabdulssalam07@gmail.com",
        phone: "07060787292",
        username: "taofeek",
      },
    ];

    for (const admin of admins) {
      // Check if the admin already exists by email
      const existing = await Admin.findOne({ email: admin.email });
      if (existing) {
        console.log(`Admin already exists: ${admin.email}`);
        // Optionally, remove the existing admin
        await Admin.deleteOne({ email: admin.email });
        console.log(`Removed existing admin: ${admin.email}`);
      }

      const hashedPassword = await bcrypt.hash(Password, 10);
      const newAdmin = new Admin({
        ...admin,
        password: hashedPassword,
      });

      // Save the new admin
      await newAdmin.save();
      console.log(`Seeded admin: ${admin.fullname}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Password (plain): ${Password}`);
    }

    await mongoose.disconnect();
    console.log("Seeding complete.");
  } catch (err) {
    console.error("Error seeding admins:", err);
    process.exit(1);
  }
};

seedAdmins();

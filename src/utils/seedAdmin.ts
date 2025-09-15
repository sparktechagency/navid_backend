import auth_model from '../apis/Auth/auth_model';

export async function seedAdmin() {
  try {
    // check if ADMIN exists
    const existingAdmin = await auth_model.findOne({ role: "ADMIN" });
    if (existingAdmin) {
      console.log("✅ Admin already exists:", existingAdmin.email);
      return;
    }

    // create admin if not exists
    const adminData = {
      name: "Super Admin",
      email: "admin@example.com",
      password: "Admin@1234",
      role: "ADMIN",
      provider: "CREDENTIAL",
      is_verified: true,
      use_type: "PREMIUM",
      date_of_birth: new Date("1990-01-01"), // age > 21
    };

    const newAdmin = new auth_model(adminData);
    await newAdmin.save();

    console.log("🚀 Admin account seeded successfully:", adminData.email);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  }
}

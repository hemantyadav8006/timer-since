import { User } from "@/models/User";

let migrated = false;

export async function migrateExistingUsersVerified(): Promise<void> {
  if (migrated) return;
  await User.updateMany(
    { emailVerified: { $exists: false } },
    { $set: { emailVerified: true } },
  );
  migrated = true;
}

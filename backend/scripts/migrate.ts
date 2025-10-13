#!/usr/bin/env node

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccount) {
  console.error("Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set");
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function migrateUserStatsToNewSchema() {
  console.log("Migrating user stats to new schema...");

  const usersSnapshot = await db.collection("users").get();

  if (usersSnapshot.empty) {
    console.log("No users to migrate");
    return;
  }

  const batch = db.batch();
  let count = 0;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();

    if (!data.stats || !data.stats.activeBotCapacity) {
      const activeBots = data.stats?.activeBots || 0;
      
      batch.update(doc.ref, {
        "stats.activeBotCapacity": activeBots,
      });

      count++;

      if (count >= 500) {
        await batch.commit();
        console.log(`Migrated ${count} users...`);
        count = 0;
      }
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`✓ Migration complete: ${usersSnapshot.size} users processed`);
}

async function backfillMissingFields() {
  console.log("Backfilling missing user fields...");

  const usersSnapshot = await db.collection("users").get();

  const batch = db.batch();
  let count = 0;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const updates: any = {};

    if (!data.progression?.achievements) {
      updates["progression.achievements"] = [];
    }

    if (!data.preferences?.theme) {
      updates["preferences.theme"] = "light";
    }

    if (!data.preferences?.locale) {
      updates["preferences.locale"] = "en";
    }

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      count++;
    }

    if (count >= 500) {
      await batch.commit();
      console.log(`Backfilled ${count} users...`);
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`✓ Backfill complete: ${count} users updated`);
}

async function main() {
  console.log("🔄 Orange Farm - Data Migration");
  console.log("================================\n");

  const args = process.argv.slice(2);
  const migrationName = args[0];

  if (!migrationName) {
    console.log("Available migrations:");
    console.log("  - user-stats        Migrate user stats to new schema");
    console.log("  - backfill-fields   Backfill missing user fields");
    console.log("\nUsage: npm run migrate <migration-name>");
    process.exit(1);
  }

  try {
    switch (migrationName) {
      case "user-stats":
        await migrateUserStatsToNewSchema();
        break;
      case "backfill-fields":
        await backfillMissingFields();
        break;
      default:
        console.error(`Unknown migration: ${migrationName}`);
        process.exit(1);
    }

    console.log("\n✅ Migration complete!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

main();

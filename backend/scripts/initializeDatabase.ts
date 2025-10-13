#!/usr/bin/env node

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as path from "path";

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccount) {
  console.error("Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set");
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function initializeGameConfig() {
  console.log("Initializing game configuration...");

  const configRef = db.collection("gameConfig").doc("settings");

  const configData = {
    harvestCycleMinutes: 10,
    pricing: {
      land_small: 5,
      land_medium: 15,
      land_large: 30,
      bot_basic: 10,
      bot_advanced: 25,
      bot_elite: 50,
      water_pack: 2,
      water_barrel: 8,
    },
    upgradeCosts: {
      basic_to_advanced: 15,
      advanced_to_elite: 25,
      expand_capacity: 10,
    },
    maintenanceMode: false,
    featureFlags: {
      marketplace_v2: true,
      social_features: true,
      seasonal_events: false,
      daily_missions: false,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await configRef.set(configData, { merge: true });
  console.log("✓ Game configuration initialized");
}

async function createAdminUser() {
  const adminWallet = process.env.ADMIN_WALLET_ADDRESS;

  if (!adminWallet) {
    console.log("⚠ No ADMIN_WALLET_ADDRESS provided, skipping admin creation");
    return;
  }

  console.log(`Creating admin user: ${adminWallet}...`);

  const adminRef = db.collection("admins").doc(adminWallet);

  await adminRef.set({
    walletAddress: adminWallet,
    role: "super_admin",
    permissions: ["*"],
    addedBy: "system",
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log("✓ Admin user created");
}

async function createInitialCMSPages() {
  console.log("Creating initial CMS pages...");

  const pages = [
    {
      pageId: "landing-hero",
      slug: "landing-hero",
      title: "Landing Page Hero",
      content: {
        headline: "Build Your Digital Farm On-Chain",
        subheadline:
          "Own NFT land, deploy AI bots, and harvest oranges in this blockchain farming game",
        ctaText: "Start Farming Now",
        features: [
          {
            title: "Own Your Land",
            description: "Purchase NFT land plots with unique characteristics",
            icon: "house",
          },
          {
            title: "AI Farming Bots",
            description: "Deploy intelligent bots to work your farm 24/7",
            icon: "robot",
          },
          {
            title: "Compete & Earn",
            description: "Climb leaderboards and earn rewards",
            icon: "trophy",
          },
        ],
      },
      published: true,
      locale: "en",
      version: 1,
      createdBy: "system",
      lastModifiedBy: "system",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt: FieldValue.serverTimestamp(),
    },
    {
      pageId: "announcement-banner",
      slug: "announcement-banner",
      title: "Announcement Banner",
      content: {
        enabled: true,
        type: "info",
        message: "🎉 Welcome to Orange Farm! Start with 100 free tokens.",
        dismissible: true,
      },
      published: true,
      locale: "en",
      version: 1,
      createdBy: "system",
      lastModifiedBy: "system",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt: FieldValue.serverTimestamp(),
    },
  ];

  const batch = db.batch();

  for (const page of pages) {
    const pageRef = db.collection("cms").doc(page.pageId);
    batch.set(pageRef, page);
  }

  await batch.commit();
  console.log(`✓ Created ${pages.length} CMS pages`);
}

async function cleanupExpiredNonces() {
  console.log("Cleaning up expired nonces...");

  const now = new Date();
  const noncesSnapshot = await db
    .collection("auth_nonces")
    .where("expiresAt", "<", now)
    .limit(500)
    .get();

  if (noncesSnapshot.empty) {
    console.log("✓ No expired nonces to clean up");
    return;
  }

  const batch = db.batch();
  noncesSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`✓ Deleted ${noncesSnapshot.size} expired nonces`);
}

async function verifyIndexes() {
  console.log("Verifying indexes...");

  console.log("⚠ Index verification requires Firebase CLI");
  console.log("Run: firebase deploy --only firestore:indexes");
}

async function main() {
  console.log("🌟 Orange Farm - Database Initialization");
  console.log("=========================================\n");

  try {
    await initializeGameConfig();
    await createAdminUser();
    await createInitialCMSPages();
    await cleanupExpiredNonces();
    await verifyIndexes();

    console.log("\n✅ Database initialization complete!");
    console.log("\nNext steps:");
    console.log("1. Deploy Firestore rules: firebase deploy --only firestore:rules");
    console.log("2. Deploy Firestore indexes: firebase deploy --only firestore:indexes");
    console.log("3. Deploy Cloud Functions: firebase deploy --only functions");
    console.log("4. Test authentication flow with a wallet");
  } catch (error) {
    console.error("\n❌ Error during initialization:", error);
    process.exit(1);
  }
}

main();

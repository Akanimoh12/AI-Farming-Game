import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { logger } from "firebase-functions";

export const onUserCreate = onDocumentCreated(
  "users/{walletAddress}",
  async (event) => {
    const walletAddress = event.params.walletAddress;
    const userData = event.data?.data();

    if (!userData) {
      logger.error("No user data found in create event", { walletAddress });
      return;
    }

    const db = getFirestore();
    const batch = db.batch();

    try {
      logger.info("Initializing new user", { walletAddress });

      const referralCode = nanoid(10);
      const userRef = db.collection("users").doc(walletAddress);
      
      batch.update(userRef, {
        referralCode,
        "stats.currentOranges": 0,
        "stats.lifetimeOranges": 0,
        "stats.mockOrangeDAOBalance": 100,
        "stats.waterBalance": 20,
        "stats.landCount": 1,
        "stats.botCount": 1,
        "stats.activeBotCapacity": 0,
        "stats.level": 1,
        "stats.experiencePoints": 0,
        "progression.onboardingStep": 0,
        "progression.tutorialCompleted": false,
        "progression.achievements": [],
        "progression.loginStreak": 1,
        "progression.lastLogin": FieldValue.serverTimestamp(),
        "progression.lastDailyMint": FieldValue.serverTimestamp(),
        "progression.lastHarvest": FieldValue.serverTimestamp(),
        "preferences.audioEnabled": true,
        "preferences.hapticsEnabled": true,
        "preferences.locale": "en",
        "preferences.theme": "light",
        updatedAt: FieldValue.serverTimestamp(),
      });

      const welcomeActivityRef = db
        .collection("activities")
        .doc(walletAddress)
        .collection("events")
        .doc();

      batch.set(welcomeActivityRef, {
        type: "registration",
        description: "Welcome to Orange Farm! You received starter assets.",
        metadata: {
          starterPack: {
            tokens: 100,
            water: 20,
            land: 1,
            bots: 1,
          },
        },
        timestamp: FieldValue.serverTimestamp(),
      });

      const starterLandRef = db
        .collection("assets")
        .doc(walletAddress)
        .collection("lands")
        .doc("starter-land");

      batch.set(starterLandRef, {
        tokenId: 0,
        landType: "small",
        capacity: 2,
        assignedBotIds: [],
        gridPosition: { x: 0, y: 0, layer: 0 },
        purchaseDate: FieldValue.serverTimestamp(),
        lastModified: FieldValue.serverTimestamp(),
      });

      const starterBotRef = db
        .collection("assets")
        .doc(walletAddress)
        .collection("bots")
        .doc("starter-bot");

      batch.set(starterBotRef, {
        tokenId: 0,
        botType: "basic",
        harvestRate: 1,
        waterConsumption: 1,
        isActive: false,
        totalHarvests: 0,
        upgradeHistory: [],
        purchaseDate: FieldValue.serverTimestamp(),
        lastModified: FieldValue.serverTimestamp(),
      });

      await batch.commit();

      logger.info("User initialization complete", { walletAddress, referralCode });
    } catch (error) {
      logger.error("Error initializing user", { walletAddress, error });
      throw error;
    }
  }
);

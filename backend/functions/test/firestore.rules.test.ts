import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setLogLevel } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ID = "orange-farm-test";
const RULES_PATH = path.join(__dirname, "../../../firestore.rules");

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  setLogLevel("error");
  
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(RULES_PATH, "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe("Firestore Security Rules", () => {
  const WALLET_1 = "0x1234567890123456789012345678901234567890";
  const WALLET_2 = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";

  describe("Users Collection", () => {
    it("should allow authenticated user to read any user document", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const userDoc = db.collection("users").doc(WALLET_2);

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("users").doc(WALLET_2).set({
          walletAddress: WALLET_2,
          username: "testuser",
          referralCode: "TEST123",
          stats: {
            currentOranges: 100,
            lifetimeOranges: 500,
            mockOrangeDAOBalance: 200,
            waterBalance: 50,
            landCount: 2,
            botCount: 3,
            activeBotCapacity: 3,
            level: 5,
            experiencePoints: 1000,
          },
          progression: {
            onboardingStep: 5,
            tutorialCompleted: true,
            achievements: ["first_100_oranges"],
            loginStreak: 10,
            lastLogin: new Date(),
            lastDailyMint: new Date(),
            lastHarvest: new Date(),
          },
          preferences: {
            audioEnabled: true,
            hapticsEnabled: true,
            locale: "en",
            theme: "light",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      await assertSucceeds(userDoc.get());
    });

    it("should prevent unauthenticated user from reading user documents", async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      const userDoc = db.collection("users").doc(WALLET_1);

      await assertFails(userDoc.get());
    });

    it("should allow user to create their own document with valid data", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const userDoc = db.collection("users").doc(WALLET_1);

      await assertSucceeds(
        userDoc.set({
          walletAddress: WALLET_1,
          username: "newuser",
          referralCode: "REF123",
          stats: {
            currentOranges: 0,
            lifetimeOranges: 0,
            mockOrangeDAOBalance: 100,
            waterBalance: 20,
            landCount: 1,
            botCount: 1,
            activeBotCapacity: 0,
            level: 1,
            experiencePoints: 0,
          },
          progression: {
            onboardingStep: 0,
            tutorialCompleted: false,
            achievements: [],
            loginStreak: 1,
            lastLogin: new Date(),
            lastDailyMint: new Date(),
            lastHarvest: new Date(),
          },
          preferences: {
            audioEnabled: true,
            hapticsEnabled: true,
            locale: "en",
            theme: "light",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    });

    it("should prevent user from creating document with invalid username", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const userDoc = db.collection("users").doc(WALLET_1);

      await assertFails(
        userDoc.set({
          walletAddress: WALLET_1,
          username: "ab",
          referralCode: "REF123",
          stats: {
            currentOranges: 0,
            lifetimeOranges: 0,
            mockOrangeDAOBalance: 100,
            waterBalance: 20,
            landCount: 1,
            botCount: 1,
            activeBotCapacity: 0,
            level: 1,
            experiencePoints: 0,
          },
          progression: {
            onboardingStep: 0,
            tutorialCompleted: false,
            achievements: [],
            loginStreak: 1,
            lastLogin: new Date(),
            lastDailyMint: new Date(),
            lastHarvest: new Date(),
          },
          preferences: {
            audioEnabled: true,
            hapticsEnabled: true,
            locale: "en",
            theme: "light",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    });

    it("should prevent user from creating another user's document", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const userDoc = db.collection("users").doc(WALLET_2);

      await assertFails(
        userDoc.set({
          walletAddress: WALLET_2,
          username: "attacker",
          referralCode: "HACK123",
          stats: {
            currentOranges: 0,
            lifetimeOranges: 0,
            mockOrangeDAOBalance: 100,
            waterBalance: 20,
            landCount: 1,
            botCount: 1,
            activeBotCapacity: 0,
            level: 1,
            experiencePoints: 0,
          },
          progression: {
            onboardingStep: 0,
            tutorialCompleted: false,
            achievements: [],
            loginStreak: 1,
            lastLogin: new Date(),
            lastDailyMint: new Date(),
            lastHarvest: new Date(),
          },
          preferences: {
            audioEnabled: true,
            hapticsEnabled: true,
            locale: "en",
            theme: "light",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    });
  });

  describe("Assets Collection", () => {
    it("should allow user to read their own assets", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const landDoc = db
        .collection("assets")
        .doc(WALLET_1)
        .collection("lands")
        .doc("land1");

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .collection("assets")
          .doc(WALLET_1)
          .collection("lands")
          .doc("land1")
          .set({
            tokenId: 1,
            landType: "small",
            capacity: 2,
            assignedBotIds: [],
            gridPosition: { x: 0, y: 0, layer: 0 },
            purchaseDate: new Date(),
            lastModified: new Date(),
          });
      });

      await assertSucceeds(landDoc.get());
    });

    it("should allow user to create their own land asset", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const landDoc = db
        .collection("assets")
        .doc(WALLET_1)
        .collection("lands")
        .doc("land1");

      await assertSucceeds(
        landDoc.set({
          tokenId: 1,
          landType: "medium",
          capacity: 5,
          assignedBotIds: [],
          gridPosition: { x: 0, y: 0, layer: 0 },
          purchaseDate: new Date(),
          lastModified: new Date(),
        })
      );
    });

    it("should prevent user from creating asset with invalid land type", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const landDoc = db
        .collection("assets")
        .doc(WALLET_1)
        .collection("lands")
        .doc("land1");

      await assertFails(
        landDoc.set({
          tokenId: 1,
          landType: "huge",
          capacity: 5,
          assignedBotIds: [],
          gridPosition: { x: 0, y: 0, layer: 0 },
          purchaseDate: new Date(),
          lastModified: new Date(),
        })
      );
    });

    it("should allow user to create their own bot asset", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const botDoc = db
        .collection("assets")
        .doc(WALLET_1)
        .collection("bots")
        .doc("bot1");

      await assertSucceeds(
        botDoc.set({
          tokenId: 1,
          botType: "advanced",
          harvestRate: 3,
          waterConsumption: 2,
          isActive: false,
          totalHarvests: 0,
          upgradeHistory: [],
          purchaseDate: new Date(),
          lastModified: new Date(),
        })
      );
    });

    it("should prevent user from creating bot with invalid type", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const botDoc = db
        .collection("assets")
        .doc(WALLET_1)
        .collection("bots")
        .doc("bot1");

      await assertFails(
        botDoc.set({
          tokenId: 1,
          botType: "super",
          harvestRate: 3,
          waterConsumption: 2,
          isActive: false,
          totalHarvests: 0,
          upgradeHistory: [],
          purchaseDate: new Date(),
          lastModified: new Date(),
        })
      );
    });
  });

  describe("Leaderboard Collection", () => {
    it("should allow authenticated users to read leaderboard", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const leaderboardDoc = db.collection("leaderboard").doc("rank1");

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("leaderboard").doc("rank1").set({
          rank: 1,
          walletAddress: WALLET_2,
          username: "topplayer",
          lifetimeOranges: 100000,
          activeBots: 10,
          lastHarvest: new Date(),
          updatedAt: new Date(),
        });
      });

      await assertSucceeds(leaderboardDoc.get());
    });

    it("should prevent clients from writing to leaderboard", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const leaderboardDoc = db.collection("leaderboard").doc("rank1");

      await assertFails(
        leaderboardDoc.set({
          rank: 1,
          walletAddress: WALLET_1,
          username: "cheater",
          lifetimeOranges: 999999,
          activeBots: 99,
          lastHarvest: new Date(),
          updatedAt: new Date(),
        })
      );
    });
  });

  describe("Activities Collection", () => {
    it("should allow user to read their own activities", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const activityDoc = db
        .collection("activities")
        .doc(WALLET_1)
        .collection("events")
        .doc("event1");

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .collection("activities")
          .doc(WALLET_1)
          .collection("events")
          .doc("event1")
          .set({
            type: "harvest",
            description: "Harvested 10 oranges",
            metadata: { orangesGained: 10 },
            timestamp: new Date(),
          });
      });

      await assertSucceeds(activityDoc.get());
    });

    it("should prevent user from reading other user's activities", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const activityDoc = db
        .collection("activities")
        .doc(WALLET_2)
        .collection("events")
        .doc("event1");

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .collection("activities")
          .doc(WALLET_2)
          .collection("events")
          .doc("event1")
          .set({
            type: "harvest",
            description: "Harvested 10 oranges",
            metadata: { orangesGained: 10 },
            timestamp: new Date(),
          });
      });

      await assertFails(activityDoc.get());
    });

    it("should prevent clients from writing activities", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const activityDoc = db
        .collection("activities")
        .doc(WALLET_1)
        .collection("events")
        .doc("event1");

      await assertFails(
        activityDoc.set({
          type: "harvest",
          description: "Fake harvest",
          metadata: { orangesGained: 1000 },
          timestamp: new Date(),
        })
      );
    });
  });

  describe("Game Config Collection", () => {
    it("should allow authenticated users to read game config", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const configDoc = db.collection("gameConfig").doc("settings");

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("gameConfig").doc("settings").set({
          harvestCycleMinutes: 10,
          pricing: { land_small: 5, bot_basic: 10 },
          upgradeCosts: { basic_to_advanced: 15 },
          maintenanceMode: false,
          featureFlags: { marketplace_v2: true },
        });
      });

      await assertSucceeds(configDoc.get());
    });

    it("should prevent non-admin users from writing game config", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const configDoc = db.collection("gameConfig").doc("settings");

      await assertFails(
        configDoc.set({
          harvestCycleMinutes: 1,
          pricing: { land_small: 0, bot_basic: 0 },
          upgradeCosts: {},
          maintenanceMode: false,
          featureFlags: {},
        })
      );
    });
  });

  describe("Auth Nonces Collection", () => {
    it("should allow anyone to read nonces", async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      const nonceDoc = db.collection("auth_nonces").doc("nonce1");

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("auth_nonces").doc("nonce1").set({
          nonce: "abc123",
          walletAddress: WALLET_1,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 300000),
          used: false,
        });
      });

      await assertSucceeds(nonceDoc.get());
    });

    it("should allow creating new nonces", async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      const nonceDoc = db.collection("auth_nonces").doc("nonce1");

      const now = new Date();
      await assertSucceeds(
        nonceDoc.set({
          nonce: "abc123",
          walletAddress: WALLET_1,
          createdAt: now,
          expiresAt: new Date(now.getTime() + 300000),
          used: false,
        })
      );
    });

    it("should allow marking nonce as used", async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      const nonceDoc = db.collection("auth_nonces").doc("nonce1");

      const now = new Date();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("auth_nonces").doc("nonce1").set({
          nonce: "abc123",
          walletAddress: WALLET_1,
          createdAt: now,
          expiresAt: new Date(now.getTime() + 300000),
          used: false,
        });
      });

      await assertSucceeds(
        nonceDoc.update({
          used: true,
        })
      );
    });
  });

  describe("Support Tickets Collection", () => {
    it("should allow user to create their own support ticket", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const ticketDoc = db.collection("support").doc("ticket1");

      await assertSucceeds(
        ticketDoc.set({
          ticketId: "ticket1",
          walletAddress: WALLET_1,
          category: "technical",
          status: "open",
          subject: "Cannot harvest oranges",
          description: "My harvest button is not working",
          priority: "high",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    });

    it("should allow user to read their own support ticket", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const ticketDoc = db.collection("support").doc("ticket1");

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("support").doc("ticket1").set({
          ticketId: "ticket1",
          walletAddress: WALLET_1,
          category: "technical",
          status: "open",
          subject: "Issue",
          description: "Description",
          priority: "medium",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      await assertSucceeds(ticketDoc.get());
    });

    it("should prevent user from reading other user's support tickets", async () => {
      const db = testEnv.authenticatedContext(WALLET_1).firestore();
      const ticketDoc = db.collection("support").doc("ticket2");

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("support").doc("ticket2").set({
          ticketId: "ticket2",
          walletAddress: WALLET_2,
          category: "billing",
          status: "open",
          subject: "Payment issue",
          description: "Not received tokens",
          priority: "high",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      await assertFails(ticketDoc.get());
    });
  });
});

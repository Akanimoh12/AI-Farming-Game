import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

export const onHarvestComplete = onDocumentUpdated(
  "users/{walletAddress}",
  async (event) => {
    const walletAddress = event.params.walletAddress;
    
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      logger.error("Missing user data in update event", { walletAddress });
      return;
    }

    const beforeOranges = beforeData.stats?.currentOranges || 0;
    const afterOranges = afterData.stats?.currentOranges || 0;
    const orangesGained = afterOranges - beforeOranges;

    if (orangesGained <= 0) {
      return;
    }

    const db = getFirestore();

    try {
      const activityRef = db
        .collection("activities")
        .doc(walletAddress)
        .collection("events")
        .doc();

      await activityRef.set({
        type: "harvest",
        description: `Harvested ${orangesGained} orange${orangesGained > 1 ? "s" : ""}`,
        metadata: {
          orangesGained,
          currentOranges: afterOranges,
          lifetimeOranges: afterData.stats?.lifetimeOranges || 0,
          activeBots: afterData.stats?.activeBotCapacity || 0,
          waterBalance: afterData.stats?.waterBalance || 0,
        },
        timestamp: FieldValue.serverTimestamp(),
      });

      logger.info("Harvest activity logged", {
        walletAddress,
        orangesGained,
        totalOranges: afterOranges,
      });

      const lifetimeOranges = afterData.stats?.lifetimeOranges || 0;
      const level = afterData.stats?.level || 1;

      const achievementChecks = [
        { threshold: 100, achievement: "first_100_oranges", name: "First 100 Oranges" },
        { threshold: 1000, achievement: "first_1000_oranges", name: "First 1,000 Oranges" },
        { threshold: 10000, achievement: "first_10000_oranges", name: "First 10,000 Oranges" },
      ];

      const currentAchievements = afterData.progression?.achievements || [];

      for (const check of achievementChecks) {
        if (
          lifetimeOranges >= check.threshold &&
          !currentAchievements.includes(check.achievement)
        ) {
          const userRef = db.collection("users").doc(walletAddress);
          
          await userRef.update({
            "progression.achievements": FieldValue.arrayUnion(check.achievement),
            updatedAt: FieldValue.serverTimestamp(),
          });

          const achievementActivityRef = db
            .collection("activities")
            .doc(walletAddress)
            .collection("events")
            .doc();

          await achievementActivityRef.set({
            type: "achievement",
            description: `Achievement unlocked: ${check.name}`,
            metadata: {
              achievement: check.achievement,
              name: check.name,
              threshold: check.threshold,
            },
            timestamp: FieldValue.serverTimestamp(),
          });

          logger.info("Achievement unlocked", {
            walletAddress,
            achievement: check.achievement,
          });
        }
      }

      const newLevel = Math.floor(lifetimeOranges / 1000) + 1;
      if (newLevel > level) {
        const userRef = db.collection("users").doc(walletAddress);
        
        await userRef.update({
          "stats.level": newLevel,
          updatedAt: FieldValue.serverTimestamp(),
        });

        const levelUpActivityRef = db
          .collection("activities")
          .doc(walletAddress)
          .collection("events")
          .doc();

        await levelUpActivityRef.set({
          type: "level_up",
          description: `Leveled up to Level ${newLevel}!`,
          metadata: {
            oldLevel: level,
            newLevel,
            lifetimeOranges,
          },
          timestamp: FieldValue.serverTimestamp(),
        });

        logger.info("User leveled up", {
          walletAddress,
          oldLevel: level,
          newLevel,
        });
      }
    } catch (error) {
      logger.error("Error logging harvest activity", { walletAddress, error });
      throw error;
    }
  }
);

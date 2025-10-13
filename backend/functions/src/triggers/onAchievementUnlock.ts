import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

export const onAchievementUnlock = onDocumentUpdated(
  "users/{walletAddress}",
  async (event) => {
    const walletAddress = event.params.walletAddress;
    
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      logger.error("Missing user data in update event", { walletAddress });
      return;
    }

    const beforeAchievements = beforeData.progression?.achievements || [];
    const afterAchievements = afterData.progression?.achievements || [];

    const newAchievements = afterAchievements.filter(
      (a: string) => !beforeAchievements.includes(a)
    );

    if (newAchievements.length === 0) {
      return;
    }

    const db = getFirestore();

    try {
      const achievementRewards: Record<string, number> = {
        first_100_oranges: 10,
        first_1000_oranges: 50,
        first_10000_oranges: 200,
        first_bot_upgrade: 25,
        complete_tutorial: 15,
        first_referral: 25,
        ten_harvests: 20,
        hundred_harvests: 100,
        master_farmer: 500,
      };

      for (const achievement of newAchievements) {
        const bonusOranges = achievementRewards[achievement] || 0;

        if (bonusOranges > 0) {
          const userRef = db.collection("users").doc(walletAddress);
          
          await userRef.update({
            "stats.currentOranges": FieldValue.increment(bonusOranges),
            "stats.lifetimeOranges": FieldValue.increment(bonusOranges),
            updatedAt: FieldValue.serverTimestamp(),
          });

          logger.info("Achievement bonus awarded", {
            walletAddress,
            achievement,
            bonusOranges,
          });
        }

        const activityRef = db
          .collection("activities")
          .doc(walletAddress)
          .collection("events")
          .doc();

        await activityRef.set({
          type: "achievement",
          description: `Achievement unlocked: ${achievement.replace(/_/g, " ")}`,
          metadata: {
            achievement,
            bonusOranges,
            totalAchievements: afterAchievements.length,
          },
          timestamp: FieldValue.serverTimestamp(),
        });

        logger.info("Achievement activity logged", {
          walletAddress,
          achievement,
          bonusOranges,
        });
      }
    } catch (error) {
      logger.error("Error processing achievement unlock", { walletAddress, error });
      throw error;
    }
  }
);

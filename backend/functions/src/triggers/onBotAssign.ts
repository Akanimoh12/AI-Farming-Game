import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

export const onBotAssign = onDocumentUpdated(
  "assets/{walletAddress}/bots/{botId}",
  async (event) => {
    const walletAddress = event.params.walletAddress;
    const botId = event.params.botId;
    
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      logger.error("Missing bot data in update event", { walletAddress, botId });
      return;
    }

    const db = getFirestore();

    try {
      const oldLandId = beforeData.assignedLandId;
      const newLandId = afterData.assignedLandId;

      if (oldLandId === newLandId) {
        return;
      }

      if (oldLandId) {
        const oldLandRef = db
          .collection("assets")
          .doc(walletAddress)
          .collection("lands")
          .doc(oldLandId);

        await oldLandRef.update({
          assignedBotIds: FieldValue.arrayRemove(botId),
          lastModified: FieldValue.serverTimestamp(),
        });

        logger.info("Bot removed from land", { walletAddress, botId, landId: oldLandId });
      }

      if (newLandId) {
        const newLandRef = db
          .collection("assets")
          .doc(walletAddress)
          .collection("lands")
          .doc(newLandId);

        const newLandSnap = await newLandRef.get();
        const landData = newLandSnap.data();

        if (!landData) {
          logger.error("Target land not found", { walletAddress, landId: newLandId });
          return;
        }

        const currentBots = landData.assignedBotIds || [];
        if (currentBots.length >= landData.capacity) {
          logger.warn("Land at capacity, assignment may fail", {
            walletAddress,
            landId: newLandId,
            capacity: landData.capacity,
            currentBots: currentBots.length,
          });
        }

        await newLandRef.update({
          assignedBotIds: FieldValue.arrayUnion(botId),
          lastModified: FieldValue.serverTimestamp(),
        });

        logger.info("Bot assigned to land", { walletAddress, botId, landId: newLandId });
      }

      const activityRef = db
        .collection("activities")
        .doc(walletAddress)
        .collection("events")
        .doc();

      await activityRef.set({
        type: "assignment",
        description: newLandId
          ? `Bot ${botId} assigned to land ${newLandId}`
          : `Bot ${botId} unassigned from land`,
        metadata: {
          botId,
          oldLandId,
          newLandId,
          botType: afterData.botType,
        },
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error("Error handling bot assignment", { walletAddress, botId, error });
      throw error;
    }
  }
);

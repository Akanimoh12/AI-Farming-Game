import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";

initializeApp();

setGlobalOptions({
  region: "us-central1",
  maxInstances: 100,
  memory: "512MiB",
  timeoutSeconds: 60,
});

export { onUserCreate } from "./triggers/onUserCreate";
export { onBotAssign } from "./triggers/onBotAssign";
export { onHarvestComplete } from "./triggers/onHarvestComplete";
export { onAchievementUnlock } from "./triggers/onAchievementUnlock";

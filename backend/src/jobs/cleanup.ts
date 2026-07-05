import { schedule } from "node-cron";
import { cleanExpiredRefreshTokens } from "@/modules/auth/token.service";

export function startCleanupJob() {
  console.log(`cron: start CleanupJob`);

  schedule("0 3 * * *", async () => {
    try {
      await cleanExpiredRefreshTokens();
    } catch (e) {
      console.error("cron: failed CleanupJob: ", e);
    }
  });
}

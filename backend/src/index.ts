import { env } from "./config/env";
import { app } from "./app";
import { startCleanupJob } from "./jobs/cleanup";

app.listen(env.PORT, () => console.log(`Listening port ${env.PORT}`));

//cron - auto removing outdated refresh tokens
startCleanupJob();

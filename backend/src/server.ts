import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { initSentry } from "./config/sentry.js";
import { logger } from "./config/logger.js";

async function bootstrap(): Promise<void> {
  initSentry();
  await connectDatabase();

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`CarbonReward API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Fatal error during startup");
  process.exit(1);
});

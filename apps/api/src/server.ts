import { createApp } from "./app";
import { env } from "./config/env";

createApp().listen(env.PORT, () => {
  console.log(`Rentora API running on http://localhost:${env.PORT}`);
});
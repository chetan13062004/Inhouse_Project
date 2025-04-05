import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./utils/schema.js",
  
  dbCredentials:{
    url:"postgresql://neondb_owner:npg_igK3Yc2bMAlk@ep-raspy-butterfly-a5fk4bh2-pooler.us-east-2.aws.neon.tech/mock?sslmode=require",
  }
});

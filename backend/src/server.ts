import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { config } from "./config/env";
import { connectToDatabase } from "./config/db";
import { authRouter } from "./routes/auth.routes";
import { formRouter } from "./routes/form.routes";

async function bootstrap() {
  await connectToDatabase();

  const app = express();

  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan("dev"));

  app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/forms", formRouter);

  app.listen(config.port, () => {
    console.log(`Backend listening on port ${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { UserModel } from "../models/user.model";
import { config } from "../config/env";
import type { AuthRequest } from "../middleware/auth.middleware";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/signup", async (req, res) => {
  const parseResult = authSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const { email, password } = parseResult.data;

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hash = await bcrypt.hash(password, config.bcryptSaltRounds);
  const user = await UserModel.create({ email, passwordHash: hash });

  const token = jwt.sign({ userId: user._id.toString() }, config.jwtSecret, {
    expiresIn: "7d",
  });

  res
    .cookie("token", token, {
      httpOnly: true,
      sameSite: config.isProduction ? "none" : "lax",
      secure: config.isProduction,
    })
    .status(201)
    .json({ id: user._id, email: user.email });
});

router.post("/logout", (req, res) => {
  res
    .cookie("token", "", {
      httpOnly: true,
      sameSite: config.isProduction ? "none" : "lax",
      secure: config.isProduction,
      expires: new Date(0),
    })
    .json({ message: "Logged out" });
});

router.post("/login", async (req, res) => {
  const parseResult = authSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const { email, password } = parseResult.data;

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user._id.toString() }, config.jwtSecret, {
    expiresIn: "7d",
  });

  res
    .cookie("token", token, {
      httpOnly: true,
      sameSite: config.isProduction ? "none" : "lax",
      secure: config.isProduction,
    })
    .json({ id: user._id, email: user.email });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await UserModel.findById(req.userId).lean();
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ id: user._id, email: user.email });
});

export const authRouter = router;

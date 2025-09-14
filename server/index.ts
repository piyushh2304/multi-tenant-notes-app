import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { seedIfEmpty } from "./data/store";
import { authMiddleware, loginHandler, requireRole, signupHandler, inviteHandler } from "./routes/auth";
import { createNote, deleteNote, getNote, listNotes, updateNote } from "./routes/notes";
import { getMeTenant, upgradeTenant } from "./routes/tenants";
import { getStripeConfig, createCheckout } from "./routes/billing";

export function createServer() {
  const app = express();

  seedIfEmpty();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth
  app.post("/api/auth/login", loginHandler);
  app.post("/api/auth/signup", signupHandler);
  app.post("/api/tenants/:slug/invite", authMiddleware, requireRole("admin"), inviteHandler);
  // Non-prefixed aliases
  app.post("/auth/login", loginHandler);
  app.post("/auth/signup", signupHandler);
  app.post("/tenants/:slug/invite", authMiddleware, requireRole("admin"), inviteHandler);

  // Tenants
  app.get("/api/tenants/me", authMiddleware, getMeTenant);
  app.post("/api/tenants/:slug/upgrade", authMiddleware, requireRole("admin"), upgradeTenant);
  // Non-prefixed aliases
  app.get("/tenants/me", authMiddleware, getMeTenant);
  app.post("/tenants/:slug/upgrade", authMiddleware, requireRole("admin"), upgradeTenant);

  // Notes
  app.post("/api/notes", authMiddleware, createNote);
  app.get("/api/notes", authMiddleware, listNotes);
  app.get("/api/notes/:id", authMiddleware, getNote);
  app.put("/api/notes/:id", authMiddleware, updateNote);
  app.delete("/api/notes/:id", authMiddleware, deleteNote);
  // Non-prefixed aliases
  app.post("/notes", authMiddleware, createNote);
  app.get("/notes", authMiddleware, listNotes);
  app.get("/notes/:id", authMiddleware, getNote);
  app.put("/notes/:id", authMiddleware, updateNote);
  app.delete("/notes/:id", authMiddleware, deleteNote);

  // Billing / Stripe
  app.get("/api/stripe/config", getStripeConfig);
  app.post("/api/billing/checkout", createCheckout);
  // Non-prefixed aliases
  app.get("/stripe/config", getStripeConfig);
  app.post("/billing/checkout", createCheckout);

  return app;
}

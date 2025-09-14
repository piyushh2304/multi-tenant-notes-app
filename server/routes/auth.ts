import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db, findTenantBySlug, seedIfEmpty, User } from "../data/store";

seedIfEmpty();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface AuthPayload {
  userId: string;
  tenantId: string;
  role: "admin" | "member";
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function authMiddleware(req: Request & { user?: AuthPayload }, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Missing Authorization header" });
  const [, token] = auth.split(" ");
  if (!token) return res.status(401).json({ error: "Invalid Authorization header" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(role: "admin" | "member") {
  return (req: Request & { user?: AuthPayload }, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
    if (role === "admin" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin role required" });
    }
    next();
  };
}

export const loginHandler = (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase());
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken({ userId: user.id, tenantId: user.tenantId, role: user.role });
  const tenant = db.tenants.find((t) => t.id === user.tenantId)!;
  return res.json({ token, user: { id: user.id, email: user.email, role: user.role }, tenant: { slug: tenant.slug, name: tenant.name, plan: tenant.plan } });
};

export const signupHandler = (req: Request, res: Response) => {
  const { email, password, tenantSlug } = req.body as { email: string; password: string; tenantSlug: string };
  const tenant = findTenantBySlug(tenantSlug);
  if (!tenant) return res.status(400).json({ error: "Invalid tenant" });
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: "Email already exists" });
  }
  const user: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash: bcrypt.hashSync(password, 8),
    role: "member",
    tenantId: tenant.id,
  };
  db.users.push(user);
  const token = signToken({ userId: user.id, tenantId: user.tenantId, role: user.role });
  return res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role }, tenant: { slug: tenant.slug, name: tenant.name, plan: tenant.plan } });
};

export const inviteHandler = (req: Request & { user?: AuthPayload }, res: Response) => {
  const { email, role } = req.body as { email: string; role: "admin" | "member" };
  if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
  const tenantId = req.user.tenantId;
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: "Email already exists" });
  }
  const user: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash: bcrypt.hashSync("password", 8),
    role: role || "member",
    tenantId,
  };
  db.users.push(user);
  return res.status(201).json({ message: "User invited", user: { id: user.id, email: user.email, role: user.role } });
};

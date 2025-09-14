import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export type Plan = "free" | "pro";
export type Role = "admin" | "member";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: Plan;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  tenantId: string;
}

export interface Note {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface DB {
  tenants: Tenant[];
  users: User[];
  notes: Note[];
}

export const db: DB = {
  tenants: [],
  users: [],
  notes: [],
};

export function seedIfEmpty() {
  if (db.tenants.length > 0) return;

  const acme: Tenant = { id: uuidv4(), slug: "acme", name: "Acme", plan: "free" };
  const globex: Tenant = { id: uuidv4(), slug: "globex", name: "Globex", plan: "free" };
  db.tenants.push(acme, globex);

  const password = "password";
  const hash = bcrypt.hashSync(password, 8);

  const users: Omit<User, "id">[] = [
    { email: "admin@acme.test", passwordHash: hash, role: "admin", tenantId: acme.id },
    { email: "user@acme.test", passwordHash: hash, role: "member", tenantId: acme.id },
    { email: "admin@globex.test", passwordHash: hash, role: "admin", tenantId: globex.id },
    { email: "user@globex.test", passwordHash: hash, role: "member", tenantId: globex.id },
  ];

  users.forEach((u) => db.users.push({ id: uuidv4(), ...u }));
}

export function findTenantBySlug(slug: string) {
  return db.tenants.find((t) => t.slug.toLowerCase() === slug.toLowerCase());
}

export function notesCountForTenant(tenantId: string) {
  return db.notes.filter((n) => n.tenantId === tenantId).length;
}

export function isFreePlanLimited(tenant: Tenant) {
  return tenant.plan === "free";
}

export function upgradeTenantToPro(tenant: Tenant) {
  tenant.plan = "pro";
}

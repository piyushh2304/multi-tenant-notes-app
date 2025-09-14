import { Request, Response } from "express";
import { db, notesCountForTenant, isFreePlanLimited, Note } from "../data/store";
import { AuthPayload } from "./auth";

export const createNote: any = (req: Request & { user?: AuthPayload }, res: Response) => {
  const user = req.user!;
  const tenant = db.tenants.find((t) => t.id === user.tenantId)!;
  // Limit only members on Free plan
  if (user.role === "member" && isFreePlanLimited(tenant) && notesCountForTenant(tenant.id) >= 3) {
    return res.status(402).json({ error: "Free plan limit reached for members. Upgrade to Pro." });
  }
  const { title, content } = req.body as { title: string; content: string };
  const now = Date.now();
  const note: Note = {
    id: crypto.randomUUID(),
    tenantId: user.tenantId,
    userId: user.userId,
    title: title || "Untitled",
    content: content || "",
    createdAt: now,
    updatedAt: now,
  };
  db.notes.push(note);
  return res.status(201).json(note);
};

export const listNotes: any = (req: Request & { user?: AuthPayload }, res: Response) => {
  const user = req.user!;
  const notes = db.notes.filter((n) => n.tenantId === user.tenantId);
  return res.json(notes);
};

export const getNote: any = (req: Request & { user?: AuthPayload }, res: Response) => {
  const user = req.user!;
  const note = db.notes.find((n) => n.id === req.params.id && n.tenantId === user.tenantId);
  if (!note) return res.status(404).json({ error: "Not found" });
  return res.json(note);
};

export const updateNote: any = (req: Request & { user?: AuthPayload }, res: Response) => {
  const user = req.user!;
  const note = db.notes.find((n) => n.id === req.params.id && n.tenantId === user.tenantId);
  if (!note) return res.status(404).json({ error: "Not found" });
  const { title, content } = req.body as { title?: string; content?: string };
  if (typeof title === "string") note.title = title;
  if (typeof content === "string") note.content = content;
  note.updatedAt = Date.now();
  return res.json(note);
};

export const deleteNote: any = (req: Request & { user?: AuthPayload }, res: Response) => {
  const user = req.user!;
  const idx = db.notes.findIndex((n) => n.id === req.params.id && n.tenantId === user.tenantId);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const [deleted] = db.notes.splice(idx, 1);
  return res.json(deleted);
};

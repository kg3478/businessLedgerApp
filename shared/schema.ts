import { pgTable, text, serial, integer, boolean, timestamp, unique, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Party model (buyers)
export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  gstin: text("gstin").unique(),
  balance: doublePrecision("balance").default(0).notNull(),
  lastActivityDate: timestamp("last_activity_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPartySchema = createInsertSchema(parties).omit({
  id: true,
  balance: true,
  lastActivityDate: true,
  createdAt: true,
  updatedAt: true,
});

// Transaction types
export const transactionTypes = ["CREDIT", "DEPOSIT"] as const;
export type TransactionType = typeof transactionTypes[number];

// Transaction model (ledger entries)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  partyId: integer("party_id").notNull().references(() => parties.id),
  type: text("type", { enum: transactionTypes }).notNull(),
  amount: doublePrecision("amount").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  reference: text("reference"),
  notes: text("notes"),
  billId: integer("bill_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  billId: true,
  createdAt: true,
  updatedAt: true,
});

// Bill model
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  partyId: integer("party_id").notNull().references(() => parties.id),
  transactionId: integer("transaction_id").references(() => transactions.id),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  reference: text("reference"),
  amount: doublePrecision("amount"),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
});

// Activity log model
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  performedBy: text("performed_by").notNull(),
  description: text("description").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  entityName: text("entity_name"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertParty = z.infer<typeof insertPartySchema>;
export type Party = typeof parties.$inferSelect;

export type CreateTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect & {
  partyName?: string;
};

export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect & {
  transactionReference?: string;
};

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

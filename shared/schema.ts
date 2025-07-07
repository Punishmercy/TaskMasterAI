import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("tasker"), // "admin" or "tasker"
  tasksCompleted: integer("tasks_completed").default(0),
  totalEarnings: decimal("total_earnings").default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  completed: boolean("completed").default(false),
  currentTurn: integer("current_turn").default(1),
  maxTurns: integer("max_turns").default(3),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id"), // NUEVO
  turn: integer("turn").notNull(),
  userPrompt: text("user_prompt").notNull(),
  aiResponse: text("ai_response").notNull(),
  wordCount: integer("word_count"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  userId: integer("user_id"), // NUEVO
  accuracy: integer("accuracy").notNull(),
  clarity: integer("clarity").notNull(),
  relevance: integer("relevance").notNull(),
  consistency: integer("consistency").notNull(),
  completeness: integer("completeness").notNull(),
  comments: text("comments"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  timestamp: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  timestamp: true,
});

export const promptSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").refine(
    (text) => text.trim().split(/\s+/).length <= 60,
    "Prompt must not exceed 60 words"
  ),
  taskId: z.number().optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;
export type PromptInput = z.infer<typeof promptSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

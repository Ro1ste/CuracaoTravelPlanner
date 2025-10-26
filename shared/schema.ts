import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company table
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  contactPersonName: varchar("contact_person_name").notNull(),
  email: varchar("email").notNull().unique(),
  phone: varchar("phone").notNull(),
  teamSize: integer("team_size").default(1),
  logoUrl: varchar("logo_url"),
  brandingColor: varchar("branding_color").default("#211100"),
  totalPoints: integer("total_points").default(0),
  totalCaloriesBurned: integer("total_calories_burned").default(0),
  dailyGoal: integer("daily_goal").default(100),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  youtubeUrl: varchar("youtube_url"),
  pointsReward: integer("points_reward").default(10),
  caloriesBurned: integer("calories_burned").default(50),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Task completion proofs table
export const taskProofs = pgTable("task_proofs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  companyId: varchar("company_id").references(() => companies.id).notNull(),
  contentUrls: text("content_urls").array().notNull(),
  contentType: varchar("content_type").notNull(), // 'image' or 'video'
  status: varchar("status").default("pending"), // 'pending', 'approved', 'rejected'
  adminNotes: text("admin_notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortCode: varchar("short_code").unique().notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  location: text("location"),
  youtubeUrl: varchar("youtube_url"),
  eventDate: timestamp("event_date").notNull(),
  brandingColor: varchar("branding_color").default("#211100"),
  isActive: boolean("is_active").default(true),
  emailSubject: varchar("email_subject"),
  emailBodyText: text("email_body_text"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event registrations table
export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  companyName: varchar("company_name"),
  status: varchar("status").default("pending"), // 'pending', 'approved', 'rejected'
  qrCode: varchar("qr_code"),
  qrCodePayload: text("qr_code_payload"),
  qrCodeIssuedAt: timestamp("qr_code_issued_at"),
  checkedIn: boolean("checked_in").default(false),
  checkedInAt: timestamp("checked_in_at"),
  registeredAt: timestamp("registered_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: varchar("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Polling system tables
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortCode: varchar("short_code").unique().notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  currentPollIndex: integer("current_poll_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const polls = pgTable("polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").references(() => subjects.id).notNull(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of {id: string, text: string}
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").references(() => polls.id).notNull(),
  optionId: varchar("option_id").notNull(),
  sessionId: varchar("session_id").notNull(), // To prevent duplicate votes
  votedAt: timestamp("voted_at").defaultNow(),
});

// Insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

// Company signup schema
export const companySignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  companyName: z.string().min(2, "Company name is required"),
  contactPersonName: z.string().min(2, "Contact person name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Company login schema
export const companyLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  contactPersonName: true,
  email: true,
  phone: true,
  teamSize: true,
  logoUrl: true,
  brandingColor: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  youtubeUrl: true,
  pointsReward: true,
  caloriesBurned: true,
});

export const insertTaskProofSchema = createInsertSchema(taskProofs).pick({
  taskId: true,
  companyId: true,
  contentUrls: true,
  contentType: true,
}).extend({
  contentUrls: z.array(z.string().min(1, "Content URL cannot be empty"))
    .min(6, "Please upload at least 6 images or videos")
    .max(10, "Maximum 10 files allowed"),
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  location: true,
  youtubeUrl: true,
  eventDate: true,
  brandingColor: true,
  emailSubject: true,
  emailBodyText: true,
}).extend({
  youtubeUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).pick({
  eventId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  companyName: true,
});

// Password reset schemas
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


// Proof review schema
export const proofReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNotes: z.string().optional(),
});

// Type definitions
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UpsertCompany = typeof companies.$inferInsert;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type CompanySignup = z.infer<typeof companySignupSchema>;
export type CompanyLogin = z.infer<typeof companyLoginSchema>;

export type UpsertTask = typeof tasks.$inferInsert;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type UpsertTaskProof = typeof taskProofs.$inferInsert;
export type InsertTaskProof = z.infer<typeof insertTaskProofSchema>;
export type TaskProof = typeof taskProofs.$inferSelect;

export type ProofReview = z.infer<typeof proofReviewSchema>;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;

// Polling system schemas
export const insertSubjectSchema = createInsertSchema(subjects).pick({
  title: true,
  description: true,
  shortCode: true,
}).extend({
  currentPollIndex: z.number().optional(),
});

export const insertPollSchema = createInsertSchema(polls).pick({
  subjectId: true,
  question: true,
  options: true,
  orderIndex: true,
}).extend({
  options: z.array(z.object({
    id: z.string(),
    text: z.string().min(1, "Option text is required"),
  })).min(2, "At least 2 options required").max(10, "Maximum 10 options allowed"),
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  pollId: true,
  optionId: true,
  sessionId: true,
});

// Polling type definitions
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Poll = typeof polls.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;

export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
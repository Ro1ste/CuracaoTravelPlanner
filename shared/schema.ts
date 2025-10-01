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
  videoUrl: varchar("video_url"),
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
  contentUrl: varchar("content_url").notNull(),
  contentType: varchar("content_type").notNull(), // 'image' or 'video'
  status: varchar("status").default("pending"), // 'pending', 'approved', 'rejected'
  adminNotes: text("admin_notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
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
  videoUrl: true,
  pointsReward: true,
  caloriesBurned: true,
});

export const insertTaskProofSchema = createInsertSchema(taskProofs).pick({
  taskId: true,
  companyId: true,
  contentUrl: true,
  contentType: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  eventDate: true,
  brandingColor: true,
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).pick({
  eventId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  companyName: true,
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
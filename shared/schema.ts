import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  streak: integer("streak").default(0),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Flashcard decks
export const flashcardDecks = pgTable("flashcard_decks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual flashcards
export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  difficulty: integer("difficulty").default(1), // 1-5 scale
  nextReview: timestamp("next_review").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quizzes
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  questions: jsonb("questions").$type<Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>>().notNull(),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  userId: integer("user_id").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answers: jsonb("answers").$type<Array<number>>().notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Notes
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // Rich text content
  tags: text("tags").array().default([]),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assignments/Deadlines
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  priority: varchar("priority", { length: 10 }).default("medium"), // low, medium, high
  status: varchar("status", { length: 20 }).default("pending"), // pending, in_progress, completed
  subject: text("subject"),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Study groups
export const studyGroups = pgTable("study_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  subject: text("subject"),
  creatorId: integer("creator_id").notNull(),
  maxMembers: integer("max_members").default(20),
  isPrivate: boolean("is_private").default(false),
  inviteCode: varchar("invite_code", { length: 10 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Study group memberships
export const studyGroupMembers = pgTable("study_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  role: varchar("role", { length: 10 }).default("member"), // member, admin
  joinedAt: timestamp("joined_at").defaultNow(),
});

// User achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "streak", "level", "quiz_master", etc.
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Chat conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).default("direct"), // "direct", "group"
  name: text("name"), // for group chats
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversation participants
export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Chat messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 20 }).default("text"), // "text", "image", "file"
  createdAt: timestamp("created_at").defaultNow(),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
});

// Posts table for social features
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  mediaUrls: jsonb("media_urls").$type<Array<{
    type: "image" | "video";
    url: string;
    thumbnailUrl?: string;
  }>>().default([]),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post likes
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post comments
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  parentCommentId: integer("parent_comment_id"), // for nested replies
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // recipient
  type: varchar("type", { length: 50 }).notNull(), // "like", "comment", "suggestion", "violation", "admin_announcement"
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data").$type<{
    postId?: number;
    commentId?: number;
    likerId?: number;
    commenterId?: number;
    suggestionPostId?: number;
    violationReason?: string;
    adminMessage?: string;
    deletedPostContent?: string;
    mediaUrls?: Array<{
      type: "image" | "video";
      url: string;
      thumbnailUrl?: string;
    }>;
    isAdminAnnouncement?: boolean;
    priority?: "normal" | "high" | "urgent";
  }>().default({}),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  flashcardDecks: many(flashcardDecks),
  quizzes: many(quizzes),
  quizAttempts: many(quizAttempts),
  notes: many(notes),
  assignments: many(assignments),
  createdGroups: many(studyGroups),
  groupMemberships: many(studyGroupMembers),
  achievements: many(achievements),
  conversationParticipants: many(conversationParticipants),
  sentMessages: many(messages),
  posts: many(posts),
  postLikes: many(postLikes),
  postComments: many(postComments),
  notifications: many(notifications),
}));

export const flashcardDecksRelations = relations(flashcardDecks, ({ one, many }) => ({
  user: one(users, {
    fields: [flashcardDecks.userId],
    references: [users.id],
  }),
  flashcards: many(flashcards),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  deck: one(flashcardDecks, {
    fields: [flashcards.deckId],
    references: [flashcardDecks.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  user: one(users, {
    fields: [quizzes.userId],
    references: [users.id],
  }),
  attempts: many(quizAttempts),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  user: one(users, {
    fields: [assignments.userId],
    references: [users.id],
  }),
}));

export const studyGroupsRelations = relations(studyGroups, ({ one, many }) => ({
  creator: one(users, {
    fields: [studyGroups.creatorId],
    references: [users.id],
  }),
  members: many(studyGroupMembers),
}));

export const studyGroupMembersRelations = relations(studyGroupMembers, ({ one }) => ({
  group: one(studyGroups, {
    fields: [studyGroupMembers.groupId],
    references: [studyGroups.id],
  }),
  user: one(users, {
    fields: [studyGroupMembers.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [conversationParticipants.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  likes: many(postLikes),
  comments: many(postComments),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const postCommentsRelations = relations(postComments, ({ one, many }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postComments.userId],
    references: [users.id],
  }),
  parentComment: one(postComments, {
    fields: [postComments.parentCommentId],
    references: [postComments.id],
  }),
  replies: many(postComments),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActive: true,
});

export const insertFlashcardDeckSchema = createInsertSchema(flashcardDecks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
  createdAt: true,
  nextReview: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
  reminderSent: true,
}).extend({
  dueDate: z.union([z.date(), z.string().pipe(z.coerce.date())]),
});

export const insertStudyGroupSchema = createInsertSchema(studyGroups).omit({
  id: true,
  createdAt: true,
  inviteCode: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likesCount: true,
  commentsCount: true,
});

export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type FlashcardDeck = typeof flashcardDecks.$inferSelect;
export type InsertFlashcardDeck = z.infer<typeof insertFlashcardDeckSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type StudyGroup = typeof studyGroups.$inferSelect;
export type InsertStudyGroup = z.infer<typeof insertStudyGroupSchema>;
export type StudyGroupMember = typeof studyGroupMembers.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

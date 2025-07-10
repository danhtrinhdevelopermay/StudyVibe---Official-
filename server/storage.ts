import { 
  users, 
  flashcardDecks, 
  flashcards, 
  quizzes, 
  quizAttempts, 
  notes, 
  assignments, 
  studyGroups, 
  studyGroupMembers, 
  achievements,
  conversations,
  conversationParticipants,
  messages,
  posts,
  postLikes,
  postComments,
  notifications,
  type User, 
  type InsertUser,
  type FlashcardDeck,
  type InsertFlashcardDeck,
  type Flashcard,
  type InsertFlashcard,
  type Quiz,
  type InsertQuiz,
  type QuizAttempt,
  type Note,
  type InsertNote,
  type Assignment,
  type InsertAssignment,
  type StudyGroup,
  type InsertStudyGroup,
  type StudyGroupMember,
  type Achievement,
  type Conversation,
  type ConversationParticipant,
  type Message,
  type Post,
  type InsertPost,
  type PostLike,
  type PostComment,
  type InsertPostComment,
  type Notification,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, like, or, ne, ilike } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  updateUserXP(id: number, xpGain: number): Promise<User>;

  // Flashcard methods
  getFlashcardDecks(userId: number): Promise<FlashcardDeck[]>;
  createFlashcardDeck(deck: InsertFlashcardDeck): Promise<FlashcardDeck>;
  getFlashcards(deckId: number): Promise<Flashcard[]>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: number, updates: Partial<Flashcard>): Promise<Flashcard>;
  deleteFlashcard(id: number): Promise<void>;

  // Quiz methods
  getQuizzes(userId: number): Promise<Quiz[]>;
  getPublicQuizzes(): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<QuizAttempt>;
  getQuizAttempts(userId: number, quizId?: number): Promise<QuizAttempt[]>;

  // Note methods
  getNotes(userId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, updates: Partial<Note>): Promise<Note>;
  deleteNote(id: number): Promise<void>;
  searchNotes(userId: number, query: string): Promise<Note[]>;

  // Assignment methods
  getAssignments(userId: number): Promise<Assignment[]>;
  getUpcomingAssignments(userId: number, days: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, updates: Partial<Assignment>): Promise<Assignment>;
  deleteAssignment(id: number): Promise<void>;

  // Study group methods
  getStudyGroups(userId: number): Promise<StudyGroup[]>;
  getPublicStudyGroups(): Promise<StudyGroup[]>;
  createStudyGroup(group: InsertStudyGroup): Promise<StudyGroup>;
  joinStudyGroup(groupId: number, userId: number): Promise<StudyGroupMember>;
  getStudyGroupMembers(groupId: number): Promise<StudyGroupMember[]>;
  
  // Achievement methods
  getUserAchievements(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: Omit<Achievement, 'id' | 'unlockedAt'>): Promise<Achievement>;

  // User discovery methods
  searchUsers(query: string, currentUserId: number): Promise<User[]>;
  getAllUsers(currentUserId: number): Promise<User[]>;
  
  // Chat methods
  createConversation(participants: number[], type?: string, name?: string): Promise<Conversation>;
  getUserConversations(userId: number): Promise<Conversation[]>;
  getConversationMessages(conversationId: number, limit?: number): Promise<Message[]>;
  sendMessage(conversationId: number, senderId: number, content: string, type?: string): Promise<Message>;
  markMessageAsRead(messageId: number): Promise<void>;

  // Posts methods
  getPosts(limit?: number, offset?: number): Promise<(Post & { user: User; hasLiked?: boolean; likesCount: number; commentsCount: number })[]>;
  getUserPosts(userId: number): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, updates: Partial<Post>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  likePost(postId: number, userId: number): Promise<PostLike | null>;
  unlikePost(postId: number, userId: number): Promise<void>;
  getPostComments(postId: number): Promise<(PostComment & { user: User })[]>;
  createPostComment(comment: InsertPostComment): Promise<PostComment>;
  deletePostComment(id: number): Promise<void>;

  // Notification methods
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  getUnreadNotificationsCount(userId: number): Promise<number>;

  // Admin methods
  getTableInfo(): Promise<{ table_name: string; column_count: number; row_count: number }[]>;
  getTableData(tableName: string, search?: string): Promise<{ columns: string[]; rows: any[][] }>;
  executeSqlQuery(query: string): Promise<any>;
  deleteRecord(tableName: string, id: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, lastActive: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserXP(id: number, xpGain: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error('User not found');
    
    const newXP = user.xp + xpGain;
    const newLevel = Math.floor(newXP / 100) + 1; // Simple leveling formula
    
    return this.updateUser(id, { xp: newXP, level: newLevel });
  }

  async getFlashcardDecks(userId: number): Promise<FlashcardDeck[]> {
    return db
      .select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.userId, userId))
      .orderBy(desc(flashcardDecks.updatedAt));
  }

  async createFlashcardDeck(deck: InsertFlashcardDeck): Promise<FlashcardDeck> {
    const [newDeck] = await db.insert(flashcardDecks).values(deck).returning();
    return newDeck;
  }

  async getFlashcards(deckId: number): Promise<Flashcard[]> {
    return db
      .select()
      .from(flashcards)
      .where(eq(flashcards.deckId, deckId))
      .orderBy(asc(flashcards.nextReview));
  }

  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    const [newFlashcard] = await db.insert(flashcards).values(flashcard).returning();
    return newFlashcard;
  }

  async updateFlashcard(id: number, updates: Partial<Flashcard>): Promise<Flashcard> {
    const [flashcard] = await db
      .update(flashcards)
      .set(updates)
      .where(eq(flashcards.id, id))
      .returning();
    return flashcard;
  }

  async deleteFlashcard(id: number): Promise<void> {
    await db.delete(flashcards).where(eq(flashcards.id, id));
  }

  async getQuizzes(userId: number): Promise<Quiz[]> {
    return db
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, userId))
      .orderBy(desc(quizzes.createdAt));
  }

  async getPublicQuizzes(): Promise<Quiz[]> {
    return db
      .select()
      .from(quizzes)
      .where(eq(quizzes.isPublic, true))
      .orderBy(desc(quizzes.createdAt));
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async createQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getQuizAttempts(userId: number, quizId?: number): Promise<QuizAttempt[]> {
    let query = db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
    
    if (quizId) {
      query = query.where(eq(quizAttempts.quizId, quizId));
    }
    
    return query.orderBy(desc(quizAttempts.completedAt));
  }

  async getNotes(userId: number): Promise<Note[]> {
    return db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.updatedAt));
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async updateNote(id: number, updates: Partial<Note>): Promise<Note> {
    const [note] = await db
      .update(notes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();
    return note;
  }

  async deleteNote(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  async searchNotes(userId: number, query: string): Promise<Note[]> {
    return db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          or(
            like(notes.title, `%${query}%`),
            like(notes.content, `%${query}%`)
          )
        )
      )
      .orderBy(desc(notes.updatedAt));
  }

  async getAssignments(userId: number): Promise<Assignment[]> {
    return db
      .select()
      .from(assignments)
      .where(eq(assignments.userId, userId))
      .orderBy(asc(assignments.dueDate));
  }

  async getUpcomingAssignments(userId: number, days: number): Promise<Assignment[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return db
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.userId, userId),
          gte(assignments.dueDate, now),
          lte(assignments.dueDate, futureDate)
        )
      )
      .orderBy(asc(assignments.dueDate));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async updateAssignment(id: number, updates: Partial<Assignment>): Promise<Assignment> {
    const [assignment] = await db
      .update(assignments)
      .set(updates)
      .where(eq(assignments.id, id))
      .returning();
    return assignment;
  }

  async deleteAssignment(id: number): Promise<void> {
    await db.delete(assignments).where(eq(assignments.id, id));
  }

  async getStudyGroups(userId: number): Promise<StudyGroup[]> {
    return db
      .select({
        id: studyGroups.id,
        name: studyGroups.name,
        description: studyGroups.description,
        subject: studyGroups.subject,
        creatorId: studyGroups.creatorId,
        maxMembers: studyGroups.maxMembers,
        isPrivate: studyGroups.isPrivate,
        inviteCode: studyGroups.inviteCode,
        createdAt: studyGroups.createdAt,
      })
      .from(studyGroups)
      .innerJoin(studyGroupMembers, eq(studyGroups.id, studyGroupMembers.groupId))
      .where(eq(studyGroupMembers.userId, userId))
      .orderBy(desc(studyGroups.createdAt));
  }

  async getPublicStudyGroups(): Promise<StudyGroup[]> {
    return db
      .select()
      .from(studyGroups)
      .where(eq(studyGroups.isPrivate, false))
      .orderBy(desc(studyGroups.createdAt));
  }

  async createStudyGroup(group: InsertStudyGroup): Promise<StudyGroup> {
    const inviteCode = Math.random().toString(36).substring(2, 12).toUpperCase();
    const [newGroup] = await db
      .insert(studyGroups)
      .values({ ...group, inviteCode })
      .returning();

    // Add creator as admin member
    await db.insert(studyGroupMembers).values({
      groupId: newGroup.id,
      userId: group.creatorId,
      role: 'admin',
    });

    return newGroup;
  }

  async joinStudyGroup(groupId: number, userId: number): Promise<StudyGroupMember> {
    const [member] = await db
      .insert(studyGroupMembers)
      .values({ groupId, userId })
      .returning();
    return member;
  }

  async getStudyGroupMembers(groupId: number): Promise<StudyGroupMember[]> {
    return db
      .select()
      .from(studyGroupMembers)
      .where(eq(studyGroupMembers.groupId, groupId))
      .orderBy(asc(studyGroupMembers.joinedAt));
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.unlockedAt));
  }

  async createAchievement(achievement: Omit<Achievement, 'id' | 'unlockedAt'>): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  // User discovery methods
  async searchUsers(query: string, currentUserId: number): Promise<User[]> {
    const results = await db.select().from(users)
      .where(
        and(
          ne(users.id, currentUserId),
          or(
            ilike(users.username, `%${query}%`),
            ilike(users.displayName, `%${query}%`),
            ilike(users.email, `%${query}%`)
          )
        )
      )
      .limit(20);
    return results;
  }

  async getAllUsers(currentUserId: number): Promise<User[]> {
    const results = await db.select().from(users)
      .where(ne(users.id, currentUserId))
      .orderBy(users.lastActive)
      .limit(50);
    return results;
  }

  // Chat methods
  async createConversation(participants: number[], type = 'direct', name?: string): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values({
      type,
      name,
      updatedAt: new Date(),
    }).returning();

    // Add participants
    const participantData = participants.map(userId => ({
      conversationId: conversation.id,
      userId,
    }));
    
    await db.insert(conversationParticipants).values(participantData);
    
    return conversation;
  }

  async getUserConversations(userId: number): Promise<Conversation[]> {
    const results = await db.select({
      id: conversations.id,
      type: conversations.type,
      name: conversations.name,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
      .from(conversations)
      .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
      .where(and(
        eq(conversationParticipants.userId, userId),
        eq(conversationParticipants.isActive, true)
      ))
      .orderBy(desc(conversations.updatedAt));
    
    // For each conversation, get the other participant's info for direct messages
    const conversationsWithParticipants = await Promise.all(
      results.map(async (conversation) => {
        if (conversation.type === 'direct') {
          // Get other participant
          const otherParticipant = await db
            .select({
              id: users.id,
              username: users.username,
              displayName: users.displayName,
            })
            .from(conversationParticipants)
            .innerJoin(users, eq(conversationParticipants.userId, users.id))
            .where(and(
              eq(conversationParticipants.conversationId, conversation.id),
              ne(conversationParticipants.userId, userId),
              eq(conversationParticipants.isActive, true)
            ))
            .limit(1);
          
          if (otherParticipant.length > 0) {
            return {
              ...conversation,
              name: otherParticipant[0].displayName || otherParticipant[0].username,
            };
          }
        }
        return conversation;
      })
    );
    
    return conversationsWithParticipants;
  }

  async getConversationMessages(conversationId: number, limit = 50): Promise<Message[]> {
    const results = await db.select().from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isDeleted, false)
      ))
      .orderBy(messages.createdAt)
      .limit(limit);
    
    return results;
  }

  async sendMessage(conversationId: number, senderId: number, content: string, type = 'text'): Promise<Message> {
    const [message] = await db.insert(messages).values({
      conversationId,
      senderId,
      content,
      type,
    }).returning();

    // Update conversation timestamp
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return message;
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    // This would typically involve a read_receipts table, but for simplicity we'll skip it
    // In a full implementation, you'd track which users have read which messages
  }

  // Posts methods implementation
  async getPosts(limit = 20, offset = 0): Promise<(Post & { user: User; hasLiked?: boolean; likesCount: number; commentsCount: number })[]> {
    const results = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        mediaUrls: posts.mediaUrls,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        isPublic: posts.isPublic,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          photoURL: users.photoURL,
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.isPublic, true))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(result => ({
      id: result.id,
      userId: result.userId,
      content: result.content,
      mediaUrls: result.mediaUrls,
      likesCount: result.likesCount,
      commentsCount: result.commentsCount,
      isPublic: result.isPublic,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      user: result.user
    }));
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    return await db.select().from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }

  async updatePost(id: number, updates: Partial<Post>): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: number): Promise<void> {
    // Delete associated likes and comments first
    await db.delete(postLikes).where(eq(postLikes.postId, id));
    await db.delete(postComments).where(eq(postComments.postId, id));
    await db.delete(posts).where(eq(posts.id, id));
  }

  async likePost(postId: number, userId: number): Promise<PostLike | null> {
    // Check if already liked
    const existingLike = await db.select().from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .limit(1);

    if (existingLike.length > 0) {
      return null; // Already liked
    }

    // Create like and increment count
    const [like] = await db.insert(postLikes).values({ postId, userId }).returning();
    
    // Update likes count
    const likesCount = await db.select().from(postLikes).where(eq(postLikes.postId, postId));
    await db.update(posts)
      .set({ likesCount: likesCount.length })
      .where(eq(posts.id, postId));

    return like;
  }

  async unlikePost(postId: number, userId: number): Promise<void> {
    await db.delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    
    // Update likes count
    const likesCount = await db.select().from(postLikes).where(eq(postLikes.postId, postId));
    await db.update(posts)
      .set({ likesCount: likesCount.length })
      .where(eq(posts.id, postId));
  }

  async getPostComments(postId: number): Promise<(PostComment & { user: User })[]> {
    const results = await db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        userId: postComments.userId,
        content: postComments.content,
        parentCommentId: postComments.parentCommentId,
        createdAt: postComments.createdAt,
        updatedAt: postComments.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          photoURL: users.photoURL,
        }
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(postComments.createdAt);

    return results.map(result => ({
      id: result.id,
      postId: result.postId,
      userId: result.userId,
      content: result.content,
      parentCommentId: result.parentCommentId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      user: result.user
    }));
  }

  async createPostComment(insertComment: InsertPostComment): Promise<PostComment> {
    const [comment] = await db.insert(postComments).values(insertComment).returning();
    
    // Update comments count
    const commentsCount = await db.select().from(postComments).where(eq(postComments.postId, insertComment.postId));
    await db.update(posts)
      .set({ commentsCount: commentsCount.length + 1 })
      .where(eq(posts.id, insertComment.postId));

    return comment;
  }

  async deletePostComment(id: number): Promise<void> {
    const comment = await db.select().from(postComments).where(eq(postComments.id, id)).limit(1);
    if (comment.length > 0) {
      const postId = comment[0].postId;
      await db.delete(postComments).where(eq(postComments.id, id));
      
      // Update comments count
      const commentsCount = await db.select().from(postComments).where(eq(postComments.postId, postId));
      await db.update(posts)
        .set({ commentsCount: commentsCount.length })
        .where(eq(posts.id, postId));
    }
  }

  // Notification methods implementation
  async getNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.length;
  }

  // Admin methods implementation
  async getTableInfo(): Promise<{ table_name: string; column_count: number; row_count: number }[]> {
    try {
      // Get table information from PostgreSQL information_schema
      const result = await db.execute(`
        SELECT 
          t.table_name,
          COUNT(c.column_name) as column_count,
          COALESCE(s.n_tup_ins + s.n_tup_upd - s.n_tup_del, 0) as row_count
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
        LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname
        WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
        GROUP BY t.table_name, s.n_tup_ins, s.n_tup_upd, s.n_tup_del
        ORDER BY t.table_name
      `);
      
      return result.rows.map((row: any) => ({
        table_name: row.table_name,
        column_count: parseInt(row.column_count) || 0,
        row_count: parseInt(row.row_count) || 0
      }));
    } catch (error) {
      // Fallback: Get basic table info
      const basicTables = [
        'users', 'posts', 'post_likes', 'post_comments', 'flashcard_decks', 
        'flashcards', 'quizzes', 'quiz_attempts', 'notes', 'assignments',
        'study_groups', 'study_group_members', 'achievements', 'conversations',
        'conversation_participants', 'messages', 'notifications'
      ];
      
      const results = [];
      for (const tableName of basicTables) {
        try {
          const countResult = await db.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
          const columnResult = await db.execute(`
            SELECT COUNT(*) as column_count 
            FROM information_schema.columns 
            WHERE table_name = '${tableName}' AND table_schema = 'public'
          `);
          
          results.push({
            table_name: tableName,
            column_count: parseInt(columnResult.rows[0]?.column_count) || 0,
            row_count: parseInt(countResult.rows[0]?.count) || 0
          });
        } catch (e) {
          console.error(`Error getting info for table ${tableName}:`, e);
        }
      }
      return results;
    }
  }

  async getTableData(tableName: string, search?: string): Promise<{ columns: string[]; rows: any[][] }> {
    try {
      // Validate table name to prevent SQL injection
      const allowedTables = [
        'users', 'posts', 'post_likes', 'post_comments', 'flashcard_decks', 
        'flashcards', 'quizzes', 'quiz_attempts', 'notes', 'assignments',
        'study_groups', 'study_group_members', 'achievements', 'conversations',
        'conversation_participants', 'messages', 'notifications'
      ];
      
      if (!allowedTables.includes(tableName)) {
        throw new Error('Invalid table name');
      }

      // Get column names first
      const columnsResult = await db.execute(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      const columns = columnsResult.rows.map((row: any) => row.column_name);

      // Build query with optional search
      let query = `SELECT * FROM ${tableName}`;
      
      if (search && columns.length > 0) {
        const searchConditions = columns
          .filter(col => ['username', 'content', 'title', 'name', 'email', 'display_name'].includes(col.toLowerCase()))
          .map(col => `${col}::text ILIKE '%${search}%'`)
          .join(' OR ');
        
        if (searchConditions) {
          query += ` WHERE ${searchConditions}`;
        }
      }
      
      query += ` ORDER BY id DESC LIMIT 100`;

      const result = await db.execute(query);
      
      return {
        columns,
        rows: result.rows.map((row: any) => columns.map(col => row[col]))
      };
    } catch (error) {
      throw new Error(`Failed to fetch table data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeSqlQuery(query: string): Promise<any> {
    try {
      const result = await db.execute(query);
      return {
        rows: result.rows,
        rowCount: result.rows?.length || 0,
        command: query.trim().split(' ')[0].toUpperCase()
      };
    } catch (error) {
      throw new Error(`SQL execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteRecord(tableName: string, id: any): Promise<void> {
    try {
      // Validate table name
      const allowedTables = [
        'users', 'posts', 'post_likes', 'post_comments', 'flashcard_decks', 
        'flashcards', 'quizzes', 'quiz_attempts', 'notes', 'assignments',
        'study_groups', 'study_group_members', 'achievements', 'conversations',
        'conversation_participants', 'messages', 'notifications'
      ];
      
      if (!allowedTables.includes(tableName)) {
        throw new Error('Invalid table name');
      }

      await db.execute(`DELETE FROM ${tableName} WHERE id = ${id}`);
    } catch (error) {
      throw new Error(`Failed to delete record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const storage = new DatabaseStorage();

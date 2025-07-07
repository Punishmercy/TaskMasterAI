import { users, tasks, conversations, ratings, type User, type InsertUser, type Task, type InsertTask, type Conversation, type InsertConversation, type Rating, type InsertRating } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Task methods
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined>;
  getTasksByUser(userId: number): Promise<Task[]>;

  // Conversation methods
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationsByTask(taskId: number): Promise<Conversation[]>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined>;

  // Rating methods
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingByConversation(conversationId: number): Promise<Rating | undefined>;
  updateRating(id: number, updates: Partial<Rating>): Promise<Rating | undefined>;

  // Admin methods
  getAllTasksWithUsers(): Promise<any[]>;
  getTaskWithConversationsAndRatings(taskId: number): Promise<any | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private conversations: Map<number, Conversation>;
  private ratings: Map<number, Rating>;
  private currentUserId: number;
  private currentTaskId: number;
  private currentConversationId: number;
  private currentRatingId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.conversations = new Map();
    this.ratings = new Map();
    this.currentUserId = 1;
    this.currentTaskId = 1;
    this.currentConversationId = 1;
    this.currentRatingId = 1;

    // Initialize demo users
    this.initializeDemoUsers();
  }

  private initializeDemoUsers() {
    // Create admin user
    const admin: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "admin",
      role: "admin" as string,
      tasksCompleted: 0,
      totalEarnings: "0.00",
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Create tasker user
    const tasker: User = {
      id: this.currentUserId++,
      username: "tasker",
      password: "tasker",
      role: "tasker" as string,
      tasksCompleted: 15,
      totalEarnings: "75.00",
      createdAt: new Date(),
    };
    this.users.set(tasker.id, tasker);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getConversationsByUser(userId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(conv => conv.userId === userId);
  }

  async getRatingsByUser(userId: number): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(rating => rating.userId === userId);
  }


  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "tasker",
      tasksCompleted: 0,
      totalEarnings: "0.00",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = {
      ...insertTask,
      id,
      userId: insertTask.userId || null,
      completed: false,
      currentTurn: 1,
      maxTurns: 3,
      createdAt: new Date(),
      completedAt: null,
    };
    this.tasks.set(id, task);
    return task;
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const conversation: Conversation = {
      ...insertConversation,
      id,
      userId: insertConversation.userId || null, // 👈 aquí lo agregas
      timestamp: new Date(),
      wordCount: insertConversation.wordCount || null,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversationsByTask(taskId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.taskId === taskId)
      .sort((a, b) => a.turn - b.turn);
  }

  async createRating(insertRating: InsertRating & { userId?: number }): Promise<Rating> {
    const id = this.currentRatingId++;
    const rating: Rating = {
      ...insertRating,
      id,
      userId: insertRating.userId || null, // 👈 aquí agregamos el userId
      comments: insertRating.comments || null,
      timestamp: new Date(),
    };
    this.ratings.set(id, rating);
    return rating;
  }

  async getRatingByConversation(conversationId: number): Promise<Rating | undefined> {
    return Array.from(this.ratings.values()).find(
      rating => rating.conversationId === conversationId
    );
  }

  async updateRating(id: number, updates: Partial<Rating>): Promise<Rating | undefined> {
    const rating = this.ratings.get(id);
    if (!rating) return undefined;

    const updatedRating = { ...rating, ...updates };
    this.ratings.set(id, updatedRating);
    return updatedRating;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;

    const updatedConversation = { ...conversation, ...updates };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  // Admin methods
  async getAllTasksWithUsers(): Promise<any[]> {
    const tasks = Array.from(this.tasks.values());
    return tasks.map(task => ({
      ...task,
      user: this.users.get(task.userId || 0) || {
        id: 0,
        username: "Unknown",
        role: "unknown"
      }
    })).sort((a, b) => a.id - b.id); // Sort by task ID to maintain chronological order
  }

  async getTaskWithConversationsAndRatings(taskId: number): Promise<any | undefined> {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    const conversations = Array.from(this.conversations.values())
      .filter(conv => conv.taskId === taskId)
      .sort((a, b) => a.turn - b.turn);

    const conversationsWithRatings = conversations.map(conv => {
      const rating = Array.from(this.ratings.values())
        .find(r => r.conversationId === conv.id);
      return {
        ...conv,
        rating
      };
    });

    console.log(`Task ${taskId} retrieved:`, {
      taskId,
      conversationsCount: conversations.length,
      ratingsCount: Array.from(this.ratings.values()).length,
      conversationsWithRatings: conversationsWithRatings.map(c => ({
        id: c.id,
        turn: c.turn,
        hasRating: !!c.rating
      }))
    });

    return {
      ...task,
      user: this.users.get(task.userId || 0) || {
        id: 0,
        username: "Unknown",
        role: "unknown"
      },
      conversations: conversationsWithRatings
    };
  }
}

export const storage = new MemStorage();

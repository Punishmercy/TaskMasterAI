import { signToken } from "./utils/jwt"; // al inicio del archivo
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { promptSchema, insertRatingSchema, loginSchema } from "@shared/schema";
import { generateChatResponse } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid credentials",
          details: validation.error.issues
        });
      }

      const { username, password } = validation.data;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // ✅ Generar JWT
      const token = signToken(user.id);

      // ✅ Enviar token y datos del usuario
      const { password: _, ...userData } = user;
      res.json({ user: userData, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // User registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid registration data",
          details: validation.error.issues
        });
      }

      const { username, password } = validation.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // Validate username and password length
      if (username.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters long" });
      }

      if (password.length < 3) {
        return res.status(400).json({ error: "Password must be at least 3 characters long" });
      }

      // Create new user with tasker role
      const newUser = await storage.createUser({
        username,
        password,
        role: "tasker",
        tasksCompleted: 0,
        totalEarnings: "0.00",
      });

      console.log('New user registered:', { username: newUser.username, role: newUser.role });

      // Return user without password
      const { password: _, ...userResponse } = newUser;
      res.json(userResponse);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.get("/api/users/:id/stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate actual stats from tasks
      const userTasks = await storage.getTasksByUser(userId);
      const completedTasks = userTasks.filter(task => task.completed);
      const tasksCompleted = completedTasks.length;

      // Calculate total earnings ($5 per completed task)
      const totalEarnings = (tasksCompleted * 5).toFixed(2);

      // Return user stats with calculated values
      const { password: _, tasksCompleted: __, totalEarnings: ___, ...userBase } = user;
      res.json({
        ...userBase,
        tasksCompleted,
        totalEarnings
      });
    } catch (error) {
      console.error('User stats error:', error);
      res.status(500).json({ error: "Failed to get user stats" });
    }
  });

  // Create a new task
  app.post("/api/tasks", async (req, res) => {
    try {
      const { userId } = req.body;
      const task = await storage.createTask({
        userId: userId || null,
      });
      res.json(task);
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  // Get task by ID
  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const conversations = await storage.getConversationsByTask(taskId);

      // Get ratings for each conversation
      const conversationsWithRatings = await Promise.all(
        conversations.map(async (conv) => {
          const rating = await storage.getRatingByConversation(conv.id);
          return { ...conv, rating };
        })
      );

      res.json({ ...task, conversations: conversationsWithRatings });
    } catch (error) {
      res.status(500).json({ error: "Failed to get task" });
    }
  });

  // Submit prompt and get AI response
  app.post("/api/chat", async (req, res) => {
    try {
      const validation = promptSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid prompt",
          details: validation.error.issues
        });
      }

      const { prompt, taskId } = validation.data;

      // Get or create task
      let task;
      if (taskId) {
        task = await storage.getTask(taskId);
        if (!task) {
          return res.status(404).json({ error: "Task not found" });
        }
      } else {
        task = await storage.createTask({ userId: null });
      }

      // Check if task is completed or at max turns
      const currentTurnForValidation = task.currentTurn ?? 1;
      const maxTurns = task.maxTurns ?? 3;

      if (task.completed || currentTurnForValidation > maxTurns) {
        return res.status(400).json({ error: "Task is already completed or at maximum turns" });
      }

      // Context chaining: Get previous AI response if this isn't the first turn
      let contextualPrompt = prompt;
      const currentTurn = task.currentTurn ?? 1;

      if (currentTurn > 1) {
        // Get all conversations for this task to find the previous one
        const conversations = await storage.getConversationsByTask(task.id);
        const previousConversation = conversations.find(conv => conv.turn === currentTurn - 1);

        if (previousConversation) {
          // Concatenate previous AI response with new prompt
          contextualPrompt = `${previousConversation.aiResponse}\n\n${prompt}`;
        }
      }

      // Generate AI response using contextual prompt
      const { response, wordCount } = await generateChatResponse(contextualPrompt);

      const { userId } = req.body; // línea nueva

      // Save conversation
      const conversation = await storage.createConversation({
        taskId: task.id,
        turn: task.currentTurn ?? 1,
        userPrompt: prompt,
        aiResponse: response,
        wordCount,
        userId: userId || null  // 👈 este campo
      });

      // Update task's current turn counter
      const updatedTask = await storage.updateTask(task.id, {
        currentTurn: (task.currentTurn ?? 1) + 1
      });

      res.json({
        task: updatedTask || task,
        conversation,
        aiResponse: response,
        wordCount,
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process chat request" });
    }
  });

  // Submit rating for a conversation
  app.post("/api/ratings", async (req, res) => {
    try {
      const validation = insertRatingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid rating data",
          details: validation.error.issues
        });
      }

      const ratingData = validation.data;
      const { userId } = req.body;

      // Check if rating already exists for this conversation
      const existingRating = await storage.getRatingByConversation(ratingData.conversationId);
      if (existingRating) {
        // Update existing rating instead of creating new one
        const updatedRating = await storage.updateRating(existingRating.id, ratingData);
        console.log('Rating updated:', updatedRating);
        return res.json(updatedRating);
      }

      // Create rating
      const rating = await storage.createRating({
        ...ratingData,
        userId: userId || null
      });


      console.log('Rating created:', rating);

      res.json(rating);
    } catch (error) {
      res.status(500).json({ error: "Failed to save rating" });
    }
  });

  // Complete task
  app.post("/api/tasks/:id/complete", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.updateTask(taskId, {
        completed: true,
        completedAt: new Date(),
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Update user statistics if user is associated with task
      if (task.userId) {
        const user = await storage.getUser(task.userId);
        if (user) {
          const newTasksCompleted = (user.tasksCompleted || 0) + 1;
          const earningsPerTask = 5.00; // $5 per completed task
          const newTotalEarnings = parseFloat(user.totalEarnings || "0") + earningsPerTask;

          await storage.updateUser(task.userId, {
            tasksCompleted: newTasksCompleted,
            totalEarnings: newTotalEarnings.toFixed(2),
          });
        }
      }

      res.json(task);
    } catch (error) {
      console.error('Complete task error:', error);
      res.status(500).json({ error: "Failed to complete task" });
    }
  });

  // Edit conversation response
  app.patch("/api/conversations/:id", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { aiResponse } = req.body;

      if (!aiResponse || typeof aiResponse !== 'string') {
        return res.status(400).json({ error: "AI response is required" });
      }

      // Update word count
      const wordCount = aiResponse.trim().split(/\s+/).length;

      const conversation = await storage.updateConversation(conversationId, {
        aiResponse,
        wordCount,
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  // Update rating
  app.patch("/api/ratings/:id", async (req, res) => {
    try {
      const ratingId = parseInt(req.params.id);
      const updates = req.body;

      const updatedRating = await storage.updateRating(ratingId, updates);

      if (!updatedRating) {
        return res.status(404).json({ error: "Rating not found" });
      }

      console.log('Rating updated:', updatedRating);
      res.json(updatedRating);
    } catch (error) {
      console.error("Error updating rating:", error);
      res.status(500).json({ error: "Failed to update rating" });
    }
  });

  // Admin routes
  app.get("/api/admin/tasks", async (req, res) => {
    try {
      const tasks = await storage.getAllTasksWithUsers();
      res.json(tasks);
    } catch (error) {
      console.error('Get admin tasks error:', error);
      res.status(500).json({ error: "Failed to get tasks" });
    }
  });

  app.get("/api/admin/tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTaskWithConversationsAndRatings(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error('Get admin task details error:', error);
      res.status(500).json({ error: "Failed to get task details" });
    }
  });

  // En routes.ts
  app.get("/api/users/:id/history", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const tasks = await storage.getTasksByUser(userId);
      const conversations = await storage.getConversationsByUser(userId);
      const ratings = await storage.getRatingsByUser(userId);


      res.json({
        tasks,
        conversations,
        ratings
      });
    } catch (error) {
      console.error("History fetch error:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { storage } from "./storage";
import { authenticateToken, generateTokens, verifyRefreshToken, type AuthenticatedRequest } from "./middleware/auth";
import { queryProcessorService } from "./services/queryProcessor";
import { googleSheetsService } from "./services/googleSheets";
import { visualizationService } from "./services/visualizationService";
import { openaiService } from "./services/openai";
import { insertUserSchema, insertConversationSchema, insertDataSourceSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password } = z.object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
      }).parse(req.body);

      console.log(`📝 Registration attempt - Username: ${username}, Email: ${email}`);

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log('❌ User already exists');
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log(`🔐 Password hashed: ${hashedPassword}`);

      // Create user
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });

      console.log(`✅ User created successfully:`, { id: newUser.id, username: newUser.username, email: newUser.email });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(newUser.id);

      res.status(201).json({
        message: "User created successfully",
        user: { id: newUser.id, username: newUser.username, email: newUser.email },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed", error: (error as Error).message || "Unknown error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }).parse(req.body);

      console.log(`🔐 Login attempt for email: ${email}`);

      // Find user
      const user = await storage.getUserByEmail(email);
      console.log(`👤 User found: ${user ? 'Yes' : 'No'}`, user ? { id: user.id, email: user.email } : null);
      
      if (!user) {
        console.log('❌ User not found');
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      console.log(`🔍 Comparing password. Plain: "${password}", Hashed: "${user.password}"`);
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log(`✅ Password valid: ${isValidPassword}`);
      
      if (!isValidPassword) {
        console.log('❌ Invalid password');
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);
      console.log(`🎫 Tokens generated for user: ${user.id}`);

      res.json({
        message: "Login successful",
        user: { id: user.id, username: user.username, email: user.email },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed", error: (error as Error).message || "Unknown error" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = z.object({
        refreshToken: z.string(),
      }).parse(req.body);

      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(403).json({ message: "User not found" });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

      res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      res.status(400).json({ message: "Token refresh failed", error: (error as Error).message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user info", error: (error as Error).message });
    }
  });

  // Conversations Routes
  app.get("/api/conversations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const conversations = await storage.getConversationsByUserId(req.user!.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations", error: (error as Error).message });
    }
  });

  app.post("/api/conversations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { title } = insertConversationSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const conversation = await storage.createConversation({
        userId: req.user!.id,
        title,
      });

      res.status(201).json(conversation);
    } catch (error) {
      res.status(400).json({ message: "Failed to create conversation", error: (error as Error).message });
    }
  });

  app.get("/api/conversations/:id/messages", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessagesByConversationId(id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages", error: (error as Error).message });
    }
  });

  // Chat Query Routes
  app.post("/api/chat/query", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('Chat query received:', req.body);
      
      const { query, conversationId, dataSourceId } = z.object({
        query: z.string().min(1),
        conversationId: z.string().min(1), // More flexible for development
        dataSourceId: z.string().optional(),
      }).parse(req.body);

      console.log('Parsed query data:', { query, conversationId, dataSourceId });

      // Add user message to conversation
      console.log('Creating user message...');
      const userMessage = await storage.createMessage({
        conversationId,
        role: "user",
        content: query,
      });
      console.log('User message created:', userMessage);

      // Process the query
      console.log('Processing query with queryProcessorService...');
      const result = await queryProcessorService.processNaturalLanguageQuery(
        req.user!.id,
        conversationId,
        query,
        dataSourceId
      );
      console.log('Query processing result:', result);

      // Create AI response message
      const responseContent = {
        summary: result.insights.summary,
        keyInsights: result.insights.keyInsights,
        recommendations: result.insights.recommendations,
        visualization: result.visualization,
        queryId: result.queryId,
      };

      await storage.createMessage({
        conversationId,
        role: "assistant",
        content: JSON.stringify(responseContent),
        metadata: {
          queryId: result.queryId,
          hasVisualization: !!result.visualization,
        } as any,
      });

      res.json({
        message: "Query processed successfully",
        result: {
          insights: result.insights,
          visualization: result.visualization,
          queryId: result.queryId,
        },
      });
    } catch (error) {
      console.error('Error processing chat query:', error);
      console.error('Error stack:', (error as Error).stack);
      res.status(500).json({ message: "Query processing failed", error: (error as Error).message });
    }
  });

  // Data Sources Routes
  app.get("/api/data-sources", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const dataSources = await storage.getDataSourcesByUserId(req.user!.id);
      res.json(dataSources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch data sources", error: (error as Error).message });
    }
  });

  app.post("/api/data-sources", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      console.log("Creating data source with body:", req.body);
      console.log("User ID:", req.user!.id);
      
      const dataSourceData = insertDataSourceSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      // For CSV files, convert fileName to full filePath
      if (dataSourceData.type === "csv" && dataSourceData.config) {
        const config = dataSourceData.config as any;
        if (config.fileName && !config.filePath) {
          // Map fileName to uploads directory
          config.filePath = `./uploads/${config.fileName}`;
        }
      }
      
      console.log("Parsed data source data:", dataSourceData);
      console.log("About to validate connection...");

      // Validate connection before saving (skip in development)
      let isValid = false;
      if (process.env.NODE_ENV === 'development') {
        console.log("Skipping connection validation in development mode");
        isValid = true;
      } else {
        try {
          if (dataSourceData.type === "google_sheets") {
            isValid = await googleSheetsService.validateConnection(dataSourceData.config as any);
          } else if (dataSourceData.type === "csv") {
            const { csvService } = await import("./services/csvService");
            isValid = await csvService.validateConnection(dataSourceData.config as any);
          } else if (dataSourceData.type === "api") {
            const { apiService } = await import("./services/apiService");
            isValid = await apiService.validateConnection(dataSourceData.config as any);
          } else if (dataSourceData.type === "postgresql") {
            const { postgresqlService } = await import("./services/postgresqlService");
            isValid = await postgresqlService.validateConnection(dataSourceData.config as any);
          } else {
            isValid = true; // For unknown types, skip validation for now
          }
        } catch (validationError) {
          return res.status(400).json({ 
            message: "Connection test failed", 
            error: (validationError as Error).message 
          });
        }
      }

      console.log("Connection validation passed, isValid:", isValid);

      if (!isValid) {
        return res.status(400).json({ 
          message: "Could not connect to data source. Please check your configuration." 
        });
      }

      console.log("About to create data source in storage...");
      const dataSource = await storage.createDataSource(dataSourceData);
      console.log("Data source created successfully:", dataSource);
      res.status(201).json(dataSource);
    } catch (error) {
      console.error("Error creating data source:", error);
      console.error("Error stack:", (error as Error).stack);
      res.status(400).json({ message: "Failed to create data source", error: (error as Error).message });
    }
  });

  app.put("/api/data-sources/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const dataSource = await storage.updateDataSource(id, updates);
      if (!dataSource) {
        return res.status(404).json({ message: "Data source not found" });
      }

      res.json(dataSource);
    } catch (error) {
      res.status(400).json({ message: "Failed to update data source", error: (error as Error).message });
    }
  });

  app.delete("/api/data-sources/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteDataSource(id);
      
      if (!success) {
        return res.status(404).json({ message: "Data source not found" });
      }

      res.json({ message: "Data source deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete data source", error: (error as Error).message });
    }
  });

  // Export Routes
  app.post("/api/export/chart", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { chartData, chartType, format } = z.object({
        chartData: z.any(),
        chartType: z.string(),
        format: z.enum(["png", "pdf", "svg", "json"]),
      }).parse(req.body);

      const result = await visualizationService.exportChart(chartData, chartType, { format });

      res.set({
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      });

      if (typeof result.data === "string") {
        res.send(result.data);
      } else {
        res.send(result.data);
      }
    } catch (error) {
      res.status(500).json({ message: "Export failed", error: (error as Error).message });
    }
  });

  // Templates Routes
  app.get("/api/templates", async (req, res) => {
    try {
      const { category } = req.query;
      
      const templates = category 
        ? await storage.getTemplatesByCategory(category as string)
        : await storage.getTemplates();
      
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates", error: (error as Error).message });
    }
  });

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}

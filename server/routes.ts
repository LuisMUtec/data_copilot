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
      const { username, email, password } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      res.status(201).json({
        message: "User created successfully",
        user: { id: user.id, username: user.username, email: user.email },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      res.status(400).json({ message: "Registration failed", error: (error as Error).message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }).parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      res.json({
        message: "Login successful",
        user: { id: user.id, username: user.username, email: user.email },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      res.status(400).json({ message: "Login failed", error: (error as Error).message });
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
      const { query, conversationId, dataSourceId } = z.object({
        query: z.string().min(1),
        conversationId: z.string().uuid(),
        dataSourceId: z.string().uuid().optional(),
      }).parse(req.body);

      // Add user message to conversation
      await storage.createMessage({
        conversationId,
        role: "user",
        content: query,
      });

      // Process the query
      const result = await queryProcessorService.processNaturalLanguageQuery(
        req.user!.id,
        conversationId,
        query,
        dataSourceId
      );

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
      const dataSourceData = insertDataSourceSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      // Validate connection before saving
      let isValid = false;
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

      if (!isValid) {
        return res.status(400).json({ 
          message: "Could not connect to data source. Please check your configuration." 
        });
      }

      const dataSource = await storage.createDataSource(dataSourceData);
      res.status(201).json(dataSource);
    } catch (error) {
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

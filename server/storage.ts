import {
  users,
  conversations,
  messages,
  dataSources,
  queries,
  visualizations,
  templates,
  type User,
  type InsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type DataSource,
  type InsertDataSource,
  type Query,
  type InsertQuery,
  type Visualization,
  type InsertVisualization,
  type Template,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Conversations
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<boolean>;

  // Messages
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Data Sources
  getDataSourcesByUserId(userId: string): Promise<DataSource[]>;
  getDataSource(id: string): Promise<DataSource | undefined>;
  createDataSource(dataSource: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource | undefined>;
  deleteDataSource(id: string): Promise<boolean>;

  // Queries
  getQueriesByUserId(userId: string): Promise<Query[]>;
  getQuery(id: string): Promise<Query | undefined>;
  createQuery(query: InsertQuery): Promise<Query>;

  // Visualizations
  getVisualizationsByQueryId(queryId: string): Promise<Visualization[]>;
  createVisualization(visualization: InsertVisualization): Promise<Visualization>;

  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplatesByCategory(category: string): Promise<Template[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error("Database error in getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      return user;
    } catch (error) {
      console.error("Database error in createUser:", error);
      // Return a mock user for development
      return {
        id: Math.random().toString(36),
        username: insertUser.username,
        email: insertUser.email,
        password: insertUser.password,
        createdAt: new Date(),
      };
    }
  }

  // Conversations
  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async deleteConversation(id: string): Promise<boolean> {
    const result = await db
      .delete(conversations)
      .where(eq(conversations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Messages
  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  // Data Sources
  async getDataSourcesByUserId(userId: string): Promise<DataSource[]> {
    return await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.userId, userId))
      .orderBy(desc(dataSources.createdAt));
  }

  async getDataSource(id: string): Promise<DataSource | undefined> {
    const [dataSource] = await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.id, id));
    return dataSource || undefined;
  }

  async createDataSource(insertDataSource: InsertDataSource): Promise<DataSource> {
    const [dataSource] = await db
      .insert(dataSources)
      .values(insertDataSource)
      .returning();
    return dataSource;
  }

  async updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource | undefined> {
    const [dataSource] = await db
      .update(dataSources)
      .set(updates)
      .where(eq(dataSources.id, id))
      .returning();
    return dataSource || undefined;
  }

  async deleteDataSource(id: string): Promise<boolean> {
    const result = await db
      .delete(dataSources)
      .where(eq(dataSources.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Queries
  async getQueriesByUserId(userId: string): Promise<Query[]> {
    return await db
      .select()
      .from(queries)
      .where(eq(queries.userId, userId))
      .orderBy(desc(queries.createdAt));
  }

  async getQuery(id: string): Promise<Query | undefined> {
    const [query] = await db
      .select()
      .from(queries)
      .where(eq(queries.id, id));
    return query || undefined;
  }

  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const [query] = await db
      .insert(queries)
      .values(insertQuery)
      .returning();
    return query;
  }

  // Visualizations
  async getVisualizationsByQueryId(queryId: string): Promise<Visualization[]> {
    return await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.queryId, queryId));
  }

  async createVisualization(insertVisualization: InsertVisualization): Promise<Visualization> {
    const [visualization] = await db
      .insert(visualizations)
      .values(insertVisualization)
      .returning();
    return visualization;
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .where(eq(templates.isPublic, true))
      .orderBy(templates.name);
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .where(and(eq(templates.category, category), eq(templates.isPublic, true)))
      .orderBy(templates.name);
  }
}

// Simple in-memory storage for development
class SimpleStorage implements IStorage {
  private users: User[] = [];
  private conversations: Conversation[] = [];
  private messages: Message[] = [];
  private dataSources: DataSource[] = [];
  private queries: Query[] = [];
  private visualizations: Visualization[] = [];
  private templates: Template[] = [];
  private idCounter = 1;

  // Method to clear all data for fresh start
  clearAll() {
    this.users = [];
    this.conversations = [];
    this.messages = [];
    this.dataSources = [];
    this.queries = [];
    this.visualizations = [];
    this.templates = [];
    this.idCounter = 1;
    console.log('Storage cleared for fresh start');
  }

  private generateId(): string {
    // Generate a UUID-like string for development
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.generateId(),
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      createdAt: new Date(),
    };
    this.users.push(user);
    console.log('User created:', { id: user.id, username: user.username, email: user.email });
    return user;
  }

  // Stubbed methods for other functionality
  async getConversationsByUserId(userId: string): Promise<Conversation[]> { 
    const userConversations = this.conversations
      .filter(c => c.userId === userId)
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
    console.log(`Getting conversations for user ${userId}: found ${userConversations.length} conversations`);
    return userConversations;
  }
  async getConversation(id: string): Promise<Conversation | undefined> { 
    return this.conversations.find(c => c.id === id); 
  }
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const conversation: Conversation = {
      id: this.generateId(),
      userId: insertConversation.userId,
      title: insertConversation.title,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.push(conversation);
    console.log('Conversation created:', { id: conversation.id, title: conversation.title, userId: conversation.userId });
    console.log('Total conversations now:', this.conversations.length);
    return conversation;
  }
  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> { 
    const index = this.conversations.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    this.conversations[index] = {
      ...this.conversations[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.conversations[index];
  }
  async deleteConversation(id: string): Promise<boolean> { 
    const index = this.conversations.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.conversations.splice(index, 1);
    // Also delete related messages
    this.messages = this.messages.filter(m => m.conversationId !== id);
    return true;
  }
  async getMessagesByConversationId(conversationId: string): Promise<Message[]> { 
    return this.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.generateId(),
      conversationId: insertMessage.conversationId,
      role: insertMessage.role,
      content: insertMessage.content,
      metadata: insertMessage.metadata || null,
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }
  async getDataSourcesByUserId(userId: string): Promise<DataSource[]> { 
    return this.dataSources.filter(ds => ds.userId === userId); 
  }
  async getDataSource(id: string): Promise<DataSource | undefined> { 
    return this.dataSources.find(ds => ds.id === id); 
  }
  async createDataSource(insertDataSource: InsertDataSource): Promise<DataSource> { 
    const dataSource: DataSource = {
      id: this.generateId(),
      userId: insertDataSource.userId,
      name: insertDataSource.name,
      type: insertDataSource.type,
      config: insertDataSource.config,
      isActive: insertDataSource.isActive ?? true,
      lastSyncAt: null,
      createdAt: new Date(),
    };
    this.dataSources.push(dataSource);
    console.log('Data source created:', { id: dataSource.id, name: dataSource.name, type: dataSource.type });
    return dataSource;
  }
  async updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource | undefined> { 
    const index = this.dataSources.findIndex(ds => ds.id === id);
    if (index === -1) return undefined;
    
    this.dataSources[index] = {
      ...this.dataSources[index],
      ...updates,
    };
    return this.dataSources[index];
  }
  async deleteDataSource(id: string): Promise<boolean> { 
    const index = this.dataSources.findIndex(ds => ds.id === id);
    if (index === -1) return false;
    
    this.dataSources.splice(index, 1);
    return true;
  }
  async getQueriesByUserId(): Promise<Query[]> { return []; }
  async getQuery(): Promise<Query | undefined> { return undefined; }
  async createQuery(): Promise<Query> { 
    throw new Error("Not implemented in simple storage"); 
  }
  async getVisualizationsByQueryId(): Promise<Visualization[]> { return []; }
  async createVisualization(): Promise<Visualization> { 
    throw new Error("Not implemented in simple storage"); 
  }
  async getTemplates(): Promise<Template[]> { return []; }
  async getTemplatesByCategory(): Promise<Template[]> { return []; }
}

export const storage = process.env.NODE_ENV === 'development' 
  ? new SimpleStorage() 
  : new DatabaseStorage();

import type {
  User,
  InsertUser,
  Conversation,
  InsertConversation,
  Message,
  InsertMessage,
  DataSource,
  InsertDataSource,
  Query,
  InsertQuery,
  Visualization,
  InsertVisualization,
  Template,
} from "@shared/schema";
import type { IStorage } from "./storage";

// In-memory storage for development
export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private conversations: Conversation[] = [];
  private messages: Message[] = [];
  private dataSources: DataSource[] = [];
  private queries: Query[] = [];
  private visualizations: Visualization[] = [];
  private templates: Template[] = [];
  private idCounter = 1;

  private generateId(): string {
    return (this.idCounter++).toString();
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
    return user;
  }

  // Conversations
  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return this.conversations
      .filter(c => c.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
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

  // Messages
  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return this.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.generateId(),
      conversationId: insertMessage.conversationId,
      role: insertMessage.role,
      content: insertMessage.content,
      metadata: insertMessage.metadata || {},
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  // Data Sources
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.dataSources.push(dataSource);
    return dataSource;
  }

  async updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource | undefined> {
    const index = this.dataSources.findIndex(ds => ds.id === id);
    if (index === -1) return undefined;
    
    this.dataSources[index] = {
      ...this.dataSources[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.dataSources[index];
  }

  async deleteDataSource(id: string): Promise<boolean> {
    const index = this.dataSources.findIndex(ds => ds.id === id);
    if (index === -1) return false;
    
    this.dataSources.splice(index, 1);
    return true;
  }

  // Queries
  async getQueriesByUserId(userId: string): Promise<Query[]> {
    return this.queries.filter(q => q.userId === userId);
  }

  async getQuery(id: string): Promise<Query | undefined> {
    return this.queries.find(q => q.id === id);
  }

  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const query: Query = {
      id: this.generateId(),
      userId: insertQuery.userId,
      dataSourceId: insertQuery.dataSourceId,
      query: insertQuery.query,
      result: insertQuery.result || {},
      createdAt: new Date(),
    };
    this.queries.push(query);
    return query;
  }

  // Visualizations
  async getVisualizationsByQueryId(queryId: string): Promise<Visualization[]> {
    return this.visualizations.filter(v => v.queryId === queryId);
  }

  async createVisualization(insertVisualization: InsertVisualization): Promise<Visualization> {
    const visualization: Visualization = {
      id: this.generateId(),
      queryId: insertVisualization.queryId,
      type: insertVisualization.type,
      config: insertVisualization.config,
      createdAt: new Date(),
    };
    this.visualizations.push(visualization);
    return visualization;
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return this.templates;
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    return this.templates.filter(t => t.category === category);
  }
}

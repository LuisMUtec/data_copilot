# Data Copilot (GrowthMate AI)

An AI-powered business analytics platform that connects to multiple data sources and provides intelligent data analysis through natural language queries using Google's Gemini AI.

## 🚀 Features

### 🔌 Multi-Source Data Connectivity
- **Google Sheets** - Connect directly to Google Spreadsheets
- **PostgreSQL** - Connect to PostgreSQL databases
- **CSV Files** - Upload and analyze CSV data
- **REST APIs** - Connect to external APIs for live data

### 🤖 AI-Powered Analytics
- **Natural Language Queries** - Ask questions in plain English
- **Google Gemini Integration** - Advanced AI analysis and insights
- **Smart Visualization** - Automatically suggests the best chart types
- **Business Insights** - AI-generated recommendations and key findings

### 📊 Interactive Visualizations
- Bar charts, line charts, pie charts, scatter plots, area charts
- Real-time data rendering with Recharts
- Interactive chart components with drill-down capabilities

### 💬 Chat Interface
- Conversational analytics experience
- Query history and conversation management
- Real-time chart generation and insights

### 🔐 Enterprise Features
- User authentication and authorization
- Secure data source connections
- Usage tracking and quotas
- Template system for common queries

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** + **Radix UI** for modern styling
- **React Query** for data fetching and caching
- **Wouter** for lightweight routing
- **Recharts** for data visualizations

### Backend
- **Node.js** + **Express** server
- **PostgreSQL** with **Drizzle ORM**
- **Google Gemini AI** for natural language processing
- **Passport.js** for authentication
- **WebSocket** support for real-time features

### Data Sources
- **Google Sheets API** integration
- **PostgreSQL** connection pooling
- **CSV** file processing
- **REST API** consumption

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key
- Google Sheets API credentials (optional)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd data_copilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/data_copilot"
   
   # AI Services
   GEMINI_API_KEY="your_gemini_api_key"
   OPENAI_API_KEY="your_openai_api_key" # Optional fallback
   
   # Google Sheets (optional)
   GOOGLE_SHEETS_API_KEY="your_google_sheets_api_key"
   
   # Session
   SESSION_SECRET="your_session_secret"
   
   # Server
   PORT=5000
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   # Push schema to database
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## 🚦 Usage

### 1. Connect Data Sources
- Navigate to the dashboard sidebar
- Click "Connect Data Source" 
- Choose from Google Sheets, PostgreSQL, CSV, or API
- Configure connection parameters

### 2. Ask Questions
Use the chat interface to ask business questions like:
- "Show me revenue trends over the last 6 months"
- "What are my top performing products?"
- "Compare sales by region"
- "What's the customer retention rate?"

### 3. Get AI Insights
The AI will:
- Analyze your query and determine intent
- Generate appropriate data queries
- Create visualizations
- Provide business insights and recommendations

## 📊 Data Source Examples

### Google Sheets
```
Spreadsheet ID: 1BxiMVs0XRA5wDuS6T6v_Vlgz1...
Range: A:Z (optional)
```

### PostgreSQL
```
Connection: postgresql://user:pass@host:5432/db
Table: sales_data (optional)
```

### CSV Upload
- Upload CSV files directly through the UI
- Automatic header detection
- Data type inference

### API Integration
```
URL: https://api.example.com/data
Method: GET/POST
API Key: your_api_key (optional)
```

## 🎯 Query Examples

- **Metrics**: "What's our total revenue this month?"
- **Trends**: "Show revenue growth over time"  
- **Comparisons**: "Compare sales by product category"
- **Distributions**: "Break down customers by region"
- **Correlations**: "How does marketing spend relate to conversions?"

## 📱 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout

### Data Sources
- `GET /api/data-sources` - List connected sources
- `POST /api/data-sources` - Create new data source
- `PUT /api/data-sources/:id` - Update data source
- `DELETE /api/data-sources/:id` - Remove data source

### Chat & Analytics
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create new conversation
- `POST /api/chat` - Send chat message and get AI response

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript checks
- `npm run db:push` - Push database schema

### Project Structure
```
data_copilot/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom hooks
│   │   └── services/      # API clients
├── server/                # Express backend
│   ├── services/         # Business logic
│   ├── middleware/       # Auth & validation
│   └── routes.ts         # API routes
├── shared/               # Shared types & schemas
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for natural language processing
- **Recharts** for beautiful data visualizations  
- **Radix UI** for accessible component primitives
- **Drizzle ORM** for type-safe database operations

---

**Built with ❤️ for better business intelligence**
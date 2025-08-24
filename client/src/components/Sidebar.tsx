import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { 
  MessageSquare, 
  BarChart3, 
  Settings, 
  History,
  Plus,
  LogOut
} from "lucide-react";

const templates = [
  { id: "revenue", name: "Revenue Analysis", icon: "📊" },
  { id: "customers", name: "Customer Segmentation", icon: "👥" },
  { id: "growth", name: "Growth Metrics", icon: "📈" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { createNewConversation } = useChat();
  const queryClient = useQueryClient();

  const { data: conversations = [] as any[], isLoading } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const handleTemplateClick = (template: any) => {
    const templateQuery = `Show me ${template.name.toLowerCase()} for my business`;
    createNewConversation(template.name, templateQuery);
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-white border-r border-gray-200 shadow-sm">
      <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
        {/* Logo and Brand */}
        <div className="flex items-center flex-shrink-0 px-6 mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">GrowthMate AI</h1>
              <p className="text-xs text-gray-500">Analytics Assistant</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/chat">
            <div className={`group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              location.startsWith('/chat') 
                ? 'bg-primary/10 border-r-2 border-primary text-primary' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            data-testid="nav-chat">
              <MessageSquare className={`mr-3 h-5 w-5 ${
                location.startsWith('/chat') ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              Chat Analysis
            </div>
          </Link>
          
          <Link href="/">
            <div className={`group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              location === '/' 
                ? 'bg-primary/10 border-r-2 border-primary text-primary' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            data-testid="nav-dashboard">
              <BarChart3 className={`mr-3 h-5 w-5 ${
                location === '/' ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              Dashboard
            </div>
          </Link>

          <button 
            className="w-full text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors"
            data-testid="nav-data-sources"
          >
            <Settings className="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5" />
            Data Sources
          </button>

          <button 
            className="w-full text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors"
            data-testid="nav-history"
          >
            <History className="text-gray-400 group-hover:text-gray-500 mr-3 h-5 w-5" />
            History
          </button>
        </nav>

        {/* Recent Conversations */}
        {(conversations as any[]).length > 0 && (
          <div className="px-4 mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Chats</h3>
            <div className="space-y-1">
              {(conversations as any[]).slice(0, 5).map((conversation: any) => (
                <Link key={conversation.id} href={`/chat/${conversation.id}`}>
                  <div className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors truncate cursor-pointer"
                     data-testid={`recent-chat-${conversation.id}`}>
                    {conversation.title}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Templates */}
        <div className="px-4 mt-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Templates</h3>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="w-full text-left p-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                data-testid={`template-${template.id}`}
              >
                {template.icon} {template.name}
              </button>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="px-4 mt-8 pt-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700" data-testid="text-username">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500">Pro Plan</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-500"
              title="Sign Out"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

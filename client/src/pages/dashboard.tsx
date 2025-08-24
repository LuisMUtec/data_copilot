import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StatsGrid } from "@/components/ui/stats-grid";
import { DashboardGrid } from "@/components/ui/dashboard-grid";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { MessageSquare, Sparkles, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const { data: dataSources = [], isLoading: dataSourcesLoading } = useQuery({
    queryKey: ["/api/data-sources"],
  });

  const recentConversations = conversations.slice(0, 5);
  const activeDataSources = dataSources.filter((ds: any) => ds.isActive);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-blue-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                  <p className="text-gray-600">Welcome back, {user?.username}</p>
                </div>
              </div>
            </div>
            <Link href="/chat">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" data-testid="button-new-chat">
                <Sparkles className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Enhanced Stats Grid */}
            <StatsGrid 
              conversations={conversations}
              dataSources={dataSources}
              conversationsLoading={conversationsLoading}
              dataSourcesLoading={dataSourcesLoading}
            />

            {/* Enhanced Dashboard Grid */}
            <DashboardGrid
              conversations={conversations}
              dataSources={dataSources}
              conversationsLoading={conversationsLoading}
              dataSourcesLoading={dataSourcesLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { BarChart3, MessageSquare, Database, Clock } from "lucide-react";

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
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.username}</p>
            </div>
            <Link href="/chat">
              <Button data-testid="button-new-chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-conversations">
                    {conversationsLoading ? "-" : conversations.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Analytics discussions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-data-sources">
                    {dataSourcesLoading ? "-" : activeDataSources.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Connected sources</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Charts Generated</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-charts-generated">-</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-recent-activity">
                    {recentConversations.length > 0 ? "Active" : "None"}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Conversations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Conversations</CardTitle>
                </CardHeader>
                <CardContent>
                  {conversationsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentConversations.length > 0 ? (
                    <div className="space-y-3">
                      {recentConversations.map((conversation: any) => (
                        <Link key={conversation.id} href={`/chat/${conversation.id}`}>
                          <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" data-testid={`conversation-${conversation.id}`}>
                            <h3 className="font-medium text-gray-900">{conversation.title}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(conversation.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Start your first analytics conversation</p>
                      <div className="mt-6">
                        <Link href="/chat">
                          <Button data-testid="button-start-chat">Start Chatting</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data Sources */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  {dataSourcesLoading ? (
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : dataSources.length > 0 ? (
                    <div className="space-y-4">
                      {dataSources.map((source: any) => (
                        <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" data-testid={`data-source-${source.id}`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${source.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <div>
                              <h3 className="font-medium text-gray-900">{source.name}</h3>
                              <p className="text-sm text-gray-500">{source.type}</p>
                            </div>
                          </div>
                          <Badge variant={source.isActive ? "default" : "secondary"}>
                            {source.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Database className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No data sources</h3>
                      <p className="mt-1 text-sm text-gray-500">Connect your first data source to get started</p>
                      <div className="mt-6">
                        <Button variant="outline" data-testid="button-connect-source">Connect Data Source</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  MessageSquare, 
  Database, 
  Calendar,
  ArrowRight,
  Sparkles,
  Clock
} from "lucide-react";

interface DashboardGridProps {
  conversations: any[];
  dataSources: any[];
  conversationsLoading?: boolean;
  dataSourcesLoading?: boolean;
}

export function DashboardGrid({ 
  conversations, 
  dataSources, 
  conversationsLoading, 
  dataSourcesLoading 
}: DashboardGridProps) {
  const recentConversations = conversations.slice(0, 3);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Conversations */}
      <Card className="lg:col-span-2 border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg font-semibold">Recent Conversations</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {conversations.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {conversationsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 rounded-lg border border-gray-100">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentConversations.length > 0 ? (
            <div className="space-y-3">
              {recentConversations.map((conversation: any) => (
                <Link key={conversation.id} href={`/chat/${conversation.id}`}>
                  <div className="group p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg border border-gray-100 hover:border-blue-200 cursor-pointer transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                            {conversation.title}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(conversation.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100">
                <Link href="/chat">
                  <Button variant="outline" className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start New Conversation
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-600 mb-4">Start your first analytics conversation</p>
              <Link href="/chat">
                <Button>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Chatting
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg font-semibold">Data Sources</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {dataSources.filter((ds: any) => ds.isActive).length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {dataSourcesLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100">
                    <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : dataSources.length > 0 ? (
            <div className="space-y-3">
              {dataSources.map((source: any) => (
                <div key={source.id} className="p-3 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${source.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                      <div>
                        <h3 className="font-medium text-gray-900">{source.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{source.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <Badge variant={source.isActive ? "default" : "secondary"} className="text-xs">
                      {source.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100">
                <Button variant="outline" className="w-full text-sm">
                  <Database className="h-4 w-4 mr-2" />
                  Connect New Source
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No data sources</h3>
              <p className="text-sm text-gray-600 mb-4">Connect your first data source</p>
              <Button variant="outline" size="sm">
                Connect Source
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
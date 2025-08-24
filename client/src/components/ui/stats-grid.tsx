import { MetricCard } from "./metric-card";
import { 
  BarChart3, 
  MessageSquare, 
  Database, 
  Clock, 
  TrendingUp,
  Users,
  DollarSign,
  Activity
} from "lucide-react";

interface StatsGridProps {
  conversations: any[];
  dataSources: any[];
  conversationsLoading?: boolean;
  dataSourcesLoading?: boolean;
}

export function StatsGrid({ 
  conversations, 
  dataSources, 
  conversationsLoading, 
  dataSourcesLoading 
}: StatsGridProps) {
  const activeDataSources = dataSources.filter((ds: any) => ds.isActive);
  const recentConversations = conversations.slice(0, 5);
  
  // Mock some analytics data - in real app, this would come from API
  const mockAnalytics = {
    totalQueries: conversations.length * 3 + Math.floor(Math.random() * 10),
    chartsGenerated: conversations.length * 2 + Math.floor(Math.random() * 5),
    avgResponseTime: 1.2 + Math.random() * 0.8,
    successRate: 95 + Math.random() * 4
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Conversations"
        value={conversationsLoading ? "-" : conversations.length}
        subtitle="Analytics discussions"
        icon={MessageSquare}
        gradient="from-blue-500 to-blue-600"
        trend={{
          value: 12,
          label: "vs last week",
          isPositive: true
        }}
      />
      
      <MetricCard
        title="Connected Sources"
        value={dataSourcesLoading ? "-" : activeDataSources.length}
        subtitle="Active data connections"
        icon={Database}
        gradient="from-emerald-500 to-emerald-600"
        trend={{
          value: 3,
          label: "new this week",
          isPositive: true
        }}
      />
      
      <MetricCard
        title="Charts Generated"
        value={mockAnalytics.chartsGenerated}
        subtitle="This month"
        icon={BarChart3}
        gradient="from-purple-500 to-purple-600"
        trend={{
          value: 8,
          label: "vs last month",
          isPositive: true
        }}
      />
      
      <MetricCard
        title="Query Success Rate"
        value={`${mockAnalytics.successRate.toFixed(1)}%`}
        subtitle="Last 30 days"
        icon={TrendingUp}
        gradient="from-orange-500 to-orange-600"
        trend={{
          value: 2.1,
          label: "improvement",
          isPositive: true
        }}
      />
      
      <MetricCard
        title="Total Queries"
        value={mockAnalytics.totalQueries}
        subtitle="All time"
        icon={Activity}
        gradient="from-cyan-500 to-cyan-600"
      />
      
      <MetricCard
        title="Avg Response Time"
        value={`${mockAnalytics.avgResponseTime.toFixed(1)}s`}
        subtitle="Query processing"
        icon={Clock}
        gradient="from-pink-500 to-pink-600"
        trend={{
          value: 15,
          label: "faster this week",
          isPositive: true
        }}
      />
      
      <MetricCard
        title="Active Users"
        value="1"
        subtitle="Current session"
        icon={Users}
        gradient="from-indigo-500 to-indigo-600"
      />
      
      <MetricCard
        title="Data Processed"
        value="2.3GB"
        subtitle="This month"
        icon={DollarSign}
        gradient="from-green-500 to-green-600"
        trend={{
          value: 22,
          label: "vs last month",
          isPositive: true
        }}
      />
    </div>
  );
}
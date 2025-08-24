import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Database, Settings, Trash2 } from "lucide-react";

const dataSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["google_sheets", "postgresql", "csv", "api"]),
  config: z.record(z.any()),
});

type DataSourceForm = z.infer<typeof dataSourceSchema>;

export default function DataSourceManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dataSources = [], isLoading } = useQuery({
    queryKey: ["/api/data-sources"],
  });

  const { data: recentInsights = [] } = useQuery({
    queryKey: ["/api/insights"],
    queryFn: () => Promise.resolve([
      {
        id: "1",
        title: "Revenue Growth",
        description: "Q1 revenue increased by 23% compared to Q4",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2", 
        title: "Customer Retention",
        description: "Monthly retention rate improved to 94%",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        title: "Product Performance", 
        description: "SaaS products leading category growth",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]),
  });

  const form = useForm<DataSourceForm>({
    resolver: zodResolver(dataSourceSchema),
    defaultValues: {
      name: "",
      type: "google_sheets",
      config: {},
    },
  });

  const createDataSourceMutation = useMutation({
    mutationFn: async (data: DataSourceForm) => {
      const response = await apiRequest("POST", "/api/data-sources", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Data source created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDataSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/data-sources/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
      toast({
        title: "Success",
        description: "Data source deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleDataSourceMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/data-sources/${id}`, {
        isActive: !isActive,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DataSourceForm) => {
    let config = {};
    
    if (data.type === "google_sheets") {
      const spreadsheetId = (form.getValues("config") as any)?.spreadsheetId;
      const range = (form.getValues("config") as any)?.range;
      
      if (!spreadsheetId) {
        toast({
          title: "Error",
          description: "Spreadsheet ID is required for Google Sheets",
          variant: "destructive",
        });
        return;
      }
      
      config = {
        spreadsheetId,
        range: range || "A:Z",
      };
    }

    createDataSourceMutation.mutate({
      ...data,
      config,
    });
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    form.setValue("type", type as any);
    form.setValue("config", {});
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="px-4 py-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Data Sources</h2>
      
      {/* Connected Sources */}
      <div className="space-y-3 mb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : dataSources.length > 0 ? (
          dataSources.map((source: any) => (
            <div key={source.id} className="bg-white rounded-lg border border-gray-200 p-3" data-testid={`data-source-${source.id}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                    source.isActive ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      source.isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 ml-2">{source.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={source.isActive ? "default" : "secondary"}>
                    {source.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDataSourceMutation.mutate({ id: source.id, isActive: source.isActive })}
                    data-testid={`button-toggle-${source.id}`}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDataSourceMutation.mutate(source.id)}
                    data-testid={`button-delete-${source.id}`}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500">{source.type.replace('_', ' ').toUpperCase()}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  Last sync: {source.lastSyncAt ? formatTimeAgo(source.lastSyncAt) : 'Never'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data sources</h3>
            <p className="mt-1 text-sm text-gray-500">Connect your first data source to get started</p>
          </div>
        )}
      </div>

      {/* Add New Source */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full border-dashed"
            data-testid="button-add-data-source"
          >
            <Plus className="h-4 w-4 mr-2" />
            Connect Data Source
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Data Source</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="My Data Source"
                data-testid="input-source-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select onValueChange={handleTypeChange} defaultValue="google_sheets">
                <SelectTrigger data-testid="select-source-type">
                  <SelectValue placeholder="Select data source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_sheets">Google Sheets</SelectItem>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="csv">CSV File</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedType === "google_sheets" && (
              <>
                <div>
                  <Label htmlFor="spreadsheetId">Spreadsheet ID</Label>
                  <Input
                    id="spreadsheetId"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    onChange={(e) => form.setValue("config", { 
                      ...form.getValues("config"), 
                      spreadsheetId: e.target.value 
                    })}
                    data-testid="input-spreadsheet-id"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Copy from the Google Sheets URL
                  </p>
                </div>
                <div>
                  <Label htmlFor="range">Range (optional)</Label>
                  <Input
                    id="range"
                    placeholder="A:Z"
                    onChange={(e) => form.setValue("config", { 
                      ...form.getValues("config"), 
                      range: e.target.value 
                    })}
                    data-testid="input-range"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createDataSourceMutation.isPending}
                data-testid="button-create-source"
              >
                {createDataSourceMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Recent Insights */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Insights</h3>
        <div className="space-y-3">
          {recentInsights.map((insight: any) => (
            <div key={insight.id} className="bg-white rounded-lg border border-gray-200 p-3" data-testid={`insight-${insight.id}`}>
              <h4 className="text-sm font-medium text-gray-900 mb-1">{insight.title}</h4>
              <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
              <span className="text-xs text-gray-400">{formatTimeAgo(insight.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Usage This Month</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Queries</span>
              <span className="text-xs font-medium" data-testid="text-usage-queries">248 / 500</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "50%" }}></div>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-600">Data Processed</span>
              <span className="text-xs font-medium" data-testid="text-usage-data">1.2 GB / 5 GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-secondary h-2 rounded-full" style={{ width: "24%" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

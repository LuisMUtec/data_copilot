import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useChat } from "@/hooks/useChat";
import { apiRequest } from "@/lib/queryClient";
import { EnhancedChart } from "./ui/enhanced-chart";
import { Paperclip, Send, Lightbulb } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: any;
  createdAt: string;
}

interface QueryResponse {
  result: {
    insights: {
      summary: string;
      keyInsights: string[];
      recommendations: string[];
    };
    visualization?: {
      type: string;
      data: any;
      config: any;
    };
    queryId: string;
  };
}

const suggestions = [
  "💡 Monthly revenue trends",
  "📊 Customer segments", 
  "📈 Growth metrics",
];

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentConversation, createNewConversation } = useChat();

  console.log('ChatInterface: currentConversation:', currentConversation);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/conversations", currentConversation?.id, "messages"],
    enabled: !!currentConversation?.id,
  });

  const { data: dataSources = [] } = useQuery({
    queryKey: ["/api/data-sources"],
  });

  const sendQueryMutation = useMutation({
    mutationFn: async (data: { query: string; conversationId: string; dataSourceId?: string }) => {
      const response = await apiRequest("POST", "/api/chat/query", data);
      return response.json() as Promise<QueryResponse>;
    },
    onSuccess: (data) => {
      // Invalidate messages to refetch updated conversation
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", currentConversation?.id, "messages"],
      });
      setIsProcessing(false);
    },
    onError: (error) => {
      toast({
        title: "Query Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return;

    // If no conversation exists, create one first
    if (!currentConversation) {
      console.log('ChatInterface: No conversation, creating new one');
      createNewConversation("New Analytics Chat", inputValue.trim());
      setInputValue("");
      return;
    }

    const activeDataSource = (dataSources as any[]).find((ds: any) => ds.isActive);
    
    setIsProcessing(true);
    sendQueryMutation.mutate({
      query: inputValue.trim(),
      conversationId: currentConversation.id,
      dataSourceId: activeDataSource?.id,
    });
    
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion.replace(/^[^\s]+ /, "")); // Remove emoji prefix
    textareaRef.current?.focus();
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  useEffect(() => {
    autoResize();
  }, [inputValue]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const renderMessage = (message: Message) => {
    if (message.role === "user") {
      return (
        <div key={message.id} className="flex items-start space-x-3 justify-end">
          <div className="flex-1 min-w-0 text-right">
            <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 inline-block max-w-md">
              <p className="text-sm">{message.content}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(message.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">U</span>
            </div>
          </div>
        </div>
      );
    }

    // Assistant message
    let parsedContent;
    try {
      parsedContent = JSON.parse(message.content);
    } catch {
      parsedContent = { summary: message.content };
    }

    return (
      <div key={message.id} className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-muted rounded-lg px-4 py-3">
            <p className="text-sm text-foreground mb-4">{parsedContent.summary}</p>
            
            {/* Render chart if available */}
            {parsedContent.visualization && (
              <div className="mb-4">
                <EnhancedChart 
                  title="Data Visualization"
                  type={parsedContent.visualization.type}
                  data={parsedContent.visualization.data}
                  config={parsedContent.visualization.config}
                  insights={parsedContent}
                />
              </div>
            )}
            
            {/* Key insights */}
            {parsedContent.keyInsights && (
              <div className="space-y-2 text-sm text-foreground mb-4">
                <p><strong>Key Insights:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                  {parsedContent.keyInsights.map((insight: string, index: number) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {parsedContent.recommendations && (
              <div className="space-y-2 text-sm text-foreground mb-4">
                <p><strong>Recommendations:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                  {parsedContent.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-2 pt-3 border-t border-border">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                data-testid="button-export-chart"
              >
                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                data-testid="button-share-insight"
              >
                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                data-testid="button-drill-down"
              >
                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Drill Down
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(message.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Welcome Message */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-muted rounded-lg px-4 py-3">
                  <p className="text-sm text-foreground">👋 Hi! I'm GrowthMate AI, your analytics assistant. Ask me anything about your business data, and I'll help you create visualizations and insights.</p>
                  <p className="text-xs text-muted-foreground mt-2">Try: "Show me my revenue trends for the last 6 months" or "What's my customer acquisition cost?"</p>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">💡 Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your data..."
                  className="min-h-[2.5rem] max-h-32 resize-none"
                  disabled={isProcessing}
                />
              </div>
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                size="sm"
                className="px-3 py-2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Welcome Message */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-muted rounded-lg px-4 py-3">
                <p className="text-sm text-foreground">👋 Hi! I'm GrowthMate AI, your analytics assistant. Ask me anything about your business data, and I'll help you create visualizations and insights.</p>
                <p className="text-xs text-muted-foreground mt-2">Try: "Show me my revenue trends for the last 6 months" or "What's my customer acquisition cost?"</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {messagesLoading ? (
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-lg px-4 py-3 animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            (messages as Message[]).map(renderMessage)
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-2">Analyzing your data...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Ask me about your business data..."
                  className="resize-none pr-12"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isProcessing}
                  data-testid="textarea-chat-input"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    title="Attach data file"
                    data-testid="button-attach-file"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => handleSuggestionClick(suggestion)}
                    data-testid={`suggestion-${index}`}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

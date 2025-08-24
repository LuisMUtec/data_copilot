import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export function useChat() {
  const [currentConversation, setCurrentConversationState] = useState<Conversation | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/conversations", { title });
      return response.json();
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setCurrentConversationState(conversation);
      setLocation(`/chat/${conversation.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Conversation> }) => {
      const response = await apiRequest("PUT", `/api/conversations/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/conversations/${id}`);
      return response.json();
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (currentConversation && currentConversation.id === deletedId) {
        setCurrentConversationState(null);
        setLocation("/chat");
      }
    },
  });

  const setCurrentConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find((c: Conversation) => c.id === conversationId);
    if (conversation) {
      setCurrentConversationState(conversation);
    }
  }, [conversations]);

  const createNewConversation = useCallback((title: string, initialQuery?: string) => {
    createConversationMutation.mutate(title);
    
    // If there's an initial query, we'll need to send it after the conversation is created
    // This could be enhanced to queue the initial message
    if (initialQuery) {
      // Store initial query in localStorage temporarily
      localStorage.setItem("pendingQuery", initialQuery);
    }
  }, [createConversationMutation]);

  const updateConversationTitle = useCallback((id: string, title: string) => {
    updateConversationMutation.mutate({ id, updates: { title } });
  }, [updateConversationMutation]);

  const deleteConversation = useCallback((id: string) => {
    deleteConversationMutation.mutate(id);
  }, [deleteConversationMutation]);

  return {
    conversations,
    currentConversation,
    setCurrentConversation,
    createNewConversation,
    updateConversationTitle,
    deleteConversation,
    isCreating: createConversationMutation.isPending,
    isUpdating: updateConversationMutation.isPending,
    isDeleting: deleteConversationMutation.isPending,
  };
}

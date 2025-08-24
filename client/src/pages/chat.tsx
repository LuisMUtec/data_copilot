import { useParams } from "wouter";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import DataSourceManager from "@/components/DataSourceManager";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { currentConversation, setCurrentConversation, createNewConversation } = useChat();

  useEffect(() => {
    if (conversationId && conversationId !== currentConversation?.id) {
      setCurrentConversation(conversationId);
    } else if (!conversationId && !currentConversation) {
      createNewConversation("New Analytics Chat");
    }
  }, [conversationId, currentConversation, setCurrentConversation, createNewConversation]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                type="button" 
                className="lg:hidden -ml-2 mr-2 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                data-testid="button-mobile-menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {currentConversation?.title || "Analytics Chat"}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                data-testid="button-export"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              <button 
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                onClick={() => createNewConversation("New Analytics Chat")}
                data-testid="button-new-chat"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Chat Interface */}
          <div className="flex-1 flex flex-col">
            <ChatInterface />
          </div>

          {/* Data Sources Panel */}
          <div className="hidden xl:block w-80 bg-gray-50 border-l border-gray-200">
            <DataSourceManager />
          </div>
        </main>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ListTodo, Bot, ArrowLeft } from "lucide-react";
import ChatMessage from "@/components/chat-message";
import RatingPanel from "@/components/rating-panel";
import PromptInput from "@/components/prompt-input";
import { Button } from "@/components/ui/button";

interface Task {
  id: number;
  completed: boolean;
  currentTurn: number;
  maxTurns: number;
  conversations?: ConversationWithRating[];
}

interface Conversation {
  id: number;
  taskId: number;
  turn: number;
  userPrompt: string;
  aiResponse: string;
  wordCount: number;
  timestamp: string;
}

interface Rating {
  id: number;
  conversationId: number;
  accuracy: number;
  clarity: number;
  relevance: number;
  consistency: number;
  completeness: number;
}

interface ConversationWithRating extends Conversation {
  rating?: Rating;
}

export default function ChatEvaluation() {
  const [taskId, setTaskId] = useState<number | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversationRatings, setConversationRatings] = useState<Map<number, any>>(new Map());
  const [draftRatings, setDraftRatings] = useState<Map<number, any>>(new Map()); // Draft ratings per conversation
  const [user, setUser] = useState<any>(null);
  const [taskStartTime, setTaskStartTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState<string>("0:00");
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Check for logged in user
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = "/";
    }
  }, []);

  // Timer functionality
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - taskStartTime.getTime()) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [taskStartTime]);

  // Create initial task
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tasks", {
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (task) => {
      setTaskId(task.id);
    },
  });

  // Get task data
  const { data: taskData, isLoading: isLoadingTask } = useQuery<Task>({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: !!taskId,
  });

  // Submit chat prompt
  const chatMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/chat", {
        prompt,
        taskId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentConversation(data.conversation);
      // Update task ID if it changed (server might create new task)
      if (data.task && data.task.id !== taskId) {
        setTaskId(data.task.id);
      }
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${data.task?.id || taskId}`] });
      scrollToBottom();
    },
  });

  // Auto-save rating as user fills values
  const autoSaveRatingMutation = useMutation({
    mutationFn: async ({ ratings, conversationId }: { ratings: any, conversationId: number }) => {
      // Always try to create first, if exists the server will return the existing one
      const response = await apiRequest("POST", "/api/ratings", {
        ...ratings,
        conversationId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
    },
  });

  // Complete task
  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      // Clear current state and start a new task immediately
      setTaskId(null);
      setSelectedConversationId(null);
      setCurrentConversation(null);
      setConversationRatings(new Map());
      setDraftRatings(new Map());

      // Reset timer
      setTaskStartTime(new Date());
      setElapsedTime("0:00");

      // Create a new task automatically
      createTaskMutation.mutate();
    },
  });

  // Edit conversation
  const editConversationMutation = useMutation({
    mutationFn: async ({ conversationId, aiResponse }: { conversationId: number; aiResponse: string }) => {
      const response = await apiRequest("PATCH", `/api/conversations/${conversationId}`, {
        aiResponse,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
    },
  });

  useEffect(() => {
    if (!taskId && user) {
      createTaskMutation.mutate();
    }
  }, [taskId, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    }, 100);
  };

  // Initialize ratings from existing conversations when data loads
  useEffect(() => {
    const convs = taskData?.conversations || [];
    if (convs.length > 0) {
      const existingRatings = new Map();
      convs.forEach((conv) => {
        if (conv.rating) {
          existingRatings.set(conv.id, conv.rating);
        }
      });
      setConversationRatings(existingRatings);
    }
  }, [taskData?.conversations]);

  const handlePromptSubmit = (prompt: string) => {
    if (taskData?.completed || (taskData && taskData.currentTurn > taskData.maxTurns)) {
      return;
    }
    chatMutation.mutate(prompt);
  };

  const handleRatingSubmit = (ratings: any) => {
    if (!selectedConversationId) return;

    // Save to submitted ratings (this replaces draft)
    setConversationRatings(prev => new Map(prev.set(selectedConversationId, ratings)));

    // Clear draft ratings since it's now submitted
    setDraftRatings(prev => {
      const newMap = new Map(prev);
      newMap.delete(selectedConversationId);
      return newMap;
    });

    // Auto-save to server
    autoSaveRatingMutation.mutate({
      ratings,
      conversationId: selectedConversationId,
    });
  };

  const handleRatingChange = (ratings: any) => {
    if (!selectedConversationId) return;

    // Save draft ratings as user makes changes
    setDraftRatings(prev => new Map(prev.set(selectedConversationId, ratings)));

    // Auto-save to server if all 5 criteria are filled for this conversation
    const allRatingsFilled = ratings.accuracy && ratings.clarity && ratings.relevance &&
      ratings.consistency && ratings.completeness;

    if (allRatingsFilled) {
      autoSaveRatingMutation.mutate({
        ratings,
        conversationId: selectedConversationId,
      });
    }
  };

  const handleCompleteTask = () => {
    completeTaskMutation.mutate();
  };

  const handleEditConversation = (conversationId: number, aiResponse: string) => {
    editConversationMutation.mutate({ conversationId, aiResponse });
  };

  const conversations = taskData?.conversations || [];
  const isAtMaxTurns = taskData && taskData.currentTurn > taskData.maxTurns;
  const canContinue = !taskData?.completed && !isAtMaxTurns;

  // Show Complete Evaluation button when all 3 turns are done AND all 15 ratings are filled
  const showCompleteButton = conversations.length === 3 && isAtMaxTurns;

  // Check if all 15 rating values are filled (5 criteria × 3 conversations)
  const allRatingsComplete = conversations.length === 3 && conversations.every(conv => {
    // Check draft ratings first, then saved ratings, then server ratings
    const draftRating = draftRatings.get(conv.id);
    const savedRating = conversationRatings.get(conv.id);
    const serverRating = conv.rating;
    const ratings = draftRating || savedRating || serverRating;

    return ratings && ratings.accuracy && ratings.clarity && ratings.relevance &&
      ratings.consistency && ratings.completeness;
  });



  return (
    <div className="font-inter bg-chat-bg min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/dashboard"}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Exit</span>
            </Button>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ListTodo className="text-white text-sm" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Multi-Turn
                {taskData && (
                  <span className="ml-2 text-base text-blue-600">- Task #{taskData.id}</span>
                )}
              </h1>
              <p className="text-sm text-slate-500">
                AI Response Evaluation - Up to 3 Turns
                <span className="ml-4 text-blue-600 font-medium">Time: {elapsedTime}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Progress indicator */}
            {taskData && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600">Turns:</span>
                <div className="flex space-x-1">
                  {Array.from({ length: taskData.maxTurns }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${i < Math.min(taskData.currentTurn, taskData.maxTurns)
                        ? "bg-blue-600"
                        : "bg-slate-300"
                        }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {Math.min(taskData.currentTurn, taskData.maxTurns)}/{taskData.maxTurns}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex h-[calc(100vh-80px)]">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages Area */}
          <div
            ref={chatAreaRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {/* Welcome Message */}
            {conversations.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="text-blue-600 text-2xl" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Start your chat evaluation!</h2>
                <p className="text-slate-600 max-w-md mx-auto">
                  Enter a prompt from your area of expertise (maximum 60 words) to start the conversation with the AI. You have up to 3 turns total.
                </p>
              </div>
            )}

            {/* Chat Messages - Show all conversations in chronological order */}
            {conversations.map((conversation) => (
              <div key={conversation.id} className="space-y-4">
                <ChatMessage
                  message={conversation.userPrompt}
                  isUser={true}
                  timestamp={conversation.timestamp}
                />
                <div
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className="cursor-pointer hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <ChatMessage
                    message={conversation.aiResponse}
                    isUser={false}
                    timestamp={conversation.timestamp}
                    wordCount={conversation.wordCount}
                    conversationId={conversation.id}
                    onEdit={handleEditConversation}
                  />
                </div>
              </div>
            ))}



            {/* Loading state */}
            {chatMutation.isPending && (
              <div className="flex justify-center">
                <div className="bg-white rounded-xl p-6 flex items-center space-x-4 shadow-sm border border-slate-200">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-slate-700">Generating response...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area - Show if under 3 turns */}
          {canContinue && conversations.length < 3 && (
            <PromptInput
              onSubmit={handlePromptSubmit}
              disabled={chatMutation.isPending}
            />
          )}

          {/* Task Completed Message */}
          {taskData?.completed && (
            <div className="border-t border-slate-200 bg-white p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ListTodo className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Evaluation Completed!</h3>
                <p className="text-slate-600">Thank you for your participation in the evaluation.</p>
              </div>
            </div>
          )}
        </div>

        {/* Rating Panel Sidebar - Only show when a conversation is selected */}
        {selectedConversationId && (
          <div className="w-96 border-l border-slate-200">
            {/* Rating Panel Header */}
            <div className="p-4 border-b border-slate-200 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-900">
                Rate AI Response
              </h3>
              <p className="text-sm text-blue-700">
                Click on an AI response to rate it. Complete after 3 turns.
              </p>
            </div>

            {/* Selected Conversation Rating Panel */}
            {(() => {
              const selectedConversation = conversations.find(c => c.id === selectedConversationId);
              if (selectedConversation) {
                // Priority: draft ratings > saved ratings > server ratings > empty
                const draftRating = draftRatings.get(selectedConversationId);
                const savedRating = conversationRatings.get(selectedConversationId);
                const serverRating = selectedConversation.rating;
                const initialRatings = draftRating || savedRating || serverRating || undefined;



                return (
                  <RatingPanel
                    conversation={selectedConversation}
                    onSubmitRating={handleRatingSubmit}
                    onRatingChange={handleRatingChange}
                    onCompleteTask={handleCompleteTask}
                    isSubmitting={autoSaveRatingMutation.isPending}
                    isCompleting={completeTaskMutation.isPending}
                    showCompleteButton={showCompleteButton || false}
                    initialRatings={initialRatings}
                    allRatingsComplete={allRatingsComplete}
                  />
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

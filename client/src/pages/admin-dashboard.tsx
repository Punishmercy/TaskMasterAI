import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { Eye, Users, CheckCircle, Clock, Edit2, Save, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminTask {
  id: number;
  userId: number;
  completed: boolean;
  currentTurn: number;
  maxTurns: number;
  createdAt: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
  conversations?: Array<{
    id: number;
    turn: number;
    userPrompt: string;
    aiResponse: string;
    wordCount: number;
    timestamp: string;
    rating?: {
      id: number;
      accuracy: number;
      clarity: number;
      relevance: number;
      consistency: number;
      completeness: number;
      comments?: string;
    };
  }>;
}

interface TaskViewDialogProps {
  task: AdminTask;
  trigger: React.ReactNode;
}

function TaskViewDialog({ task, trigger }: TaskViewDialogProps) {
  const { data: taskDetails } = useQuery<AdminTask>({
    queryKey: [`/api/admin/tasks/${task.id}`],
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingResponse, setEditingResponse] = useState<number | null>(null);
  const [editingRating, setEditingRating] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    response?: string;
    ratings?: { accuracy: number; clarity: number; relevance: number; consistency: number; completeness: number; };
    comment?: string;
  }>({});

  const conversations = taskDetails?.conversations || [];
  
  // Mutations for updating data
  const updateConversationMutation = useMutation({
    mutationFn: async ({ conversationId, aiResponse }: { conversationId: number, aiResponse: string }) => {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiResponse }),
      });
      if (!response.ok) throw new Error('Failed to update conversation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/tasks/${task.id}`] });
      toast({ title: "AI Response updated successfully" });
    },
  });

  const updateRatingMutation = useMutation({
    mutationFn: async ({ ratingId, ratings }: { ratingId: number, ratings: any }) => {
      const response = await fetch(`/api/ratings/${ratingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratings),
      });
      if (!response.ok) throw new Error('Failed to update rating');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/tasks/${task.id}`] });
      toast({ title: "Ratings updated successfully" });
    },
  });

  const startEditingResponse = (conversationId: number, currentResponse: string) => {
    setEditingResponse(conversationId);
    setEditValues({ response: currentResponse });
  };

  const startEditingRating = (conversationId: number, currentRating: any) => {
    setEditingRating(conversationId);
    setEditValues({
      ratings: {
        accuracy: currentRating.accuracy,
        clarity: currentRating.clarity,
        relevance: currentRating.relevance,
        consistency: currentRating.consistency,
        completeness: currentRating.completeness,
      }
    });
  };

  const startEditingComment = (conversationId: number, currentComment: string) => {
    setEditingComment(conversationId);
    setEditValues({ comment: currentComment || '' });
  };

  const saveResponse = (conversationId: number) => {
    if (editValues.response !== undefined) {
      updateConversationMutation.mutate({ conversationId, aiResponse: editValues.response });
      setEditingResponse(null);
      setEditValues({});
    }
  };

  const saveRating = (ratingId: number) => {
    if (editValues.ratings) {
      updateRatingMutation.mutate({ ratingId, ratings: editValues.ratings });
      setEditingRating(null);
      setEditValues({});
    }
  };

  const saveComment = (ratingId: number) => {
    if (editValues.comment !== undefined) {
      updateRatingMutation.mutate({ ratingId, ratings: { comments: editValues.comment } });
      setEditingComment(null);
      setEditValues({});
    }
  };

  const cancelEdit = () => {
    setEditingResponse(null);
    setEditingRating(null);
    setEditingComment(null);
    setEditValues({});
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Task #{task.id} - {task.user.username}
            <Badge variant={task.completed ? "default" : "secondary"} className="ml-2">
              {task.completed ? "Completed" : "In Progress"}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">User:</span> {task.user.username}
            </div>
            <div>
              <span className="font-medium">Status:</span> 
              <Badge variant={task.completed ? "default" : "secondary"} className="ml-1">
                {task.completed ? "Completed" : "In Progress"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Updated:</span> {formatRelativeTime(task.createdAt)}
            </div>
          </div>

          {conversations.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-medium">Conversation History</h3>
              {conversations.map((conversation) => (
                <Card key={conversation.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Turn {conversation.turn}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {conversation.wordCount} words
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-blue-600 mb-1">User Prompt:</p>
                      <p className="text-sm bg-blue-50 p-3 rounded">{conversation.userPrompt}</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-green-600">AI Response:</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingResponse(conversation.id, conversation.aiResponse)}
                          disabled={editingResponse === conversation.id}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {editingResponse === conversation.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editValues.response || ''}
                            onChange={(e) => setEditValues({ ...editValues, response: e.target.value })}
                            className="text-sm"
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveResponse(conversation.id)}>
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={cancelEdit}>
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm bg-green-50 p-3 rounded">{conversation.aiResponse}</p>
                      )}
                    </div>

                    {conversation.rating ? (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-green-700">Ratings</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingRating(conversation.id, conversation.rating)}
                            disabled={editingRating === conversation.id}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {editingRating === conversation.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-5 gap-4">
                              {['accuracy', 'clarity', 'relevance', 'consistency', 'completeness'].map((criteria) => (
                                <div key={criteria}>
                                  <label className="text-sm font-medium text-green-700 mb-1 block capitalize">
                                    {criteria}
                                  </label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={editValues.ratings?.[criteria as keyof typeof editValues.ratings] || ''}
                                    onChange={(e) => setEditValues({
                                      ...editValues,
                                      ratings: {
                                        ...editValues.ratings!,
                                        [criteria]: parseInt(e.target.value) || 1
                                      }
                                    })}
                                    className="text-center"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => saveRating(conversation.rating!.id)}>
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button variant="outline" size="sm" onClick={cancelEdit}>
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-5 gap-4 text-center">
                            <div>
                              <div className="text-sm font-medium text-green-700 mb-1">Accuracy</div>
                              <div className="text-2xl font-bold text-green-800">{conversation.rating.accuracy}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-green-700 mb-1">Clarity</div>
                              <div className="text-2xl font-bold text-green-800">{conversation.rating.clarity}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-green-700 mb-1">Relevance</div>
                              <div className="text-2xl font-bold text-green-800">{conversation.rating.relevance}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-green-700 mb-1">Consistency</div>
                              <div className="text-2xl font-bold text-green-800">{conversation.rating.consistency}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-green-700 mb-1">Completeness</div>
                              <div className="text-2xl font-bold text-green-800">{conversation.rating.completeness}</div>
                            </div>
                          </div>
                        )}
                        
                        <div className="border-t border-green-200 pt-3">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-medium text-green-700">Additional Comments:</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingComment(conversation.id, conversation.rating?.comments || '')}
                              disabled={editingComment === conversation.id}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {editingComment === conversation.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editValues.comment || ''}
                                onChange={(e) => setEditValues({ ...editValues, comment: e.target.value })}
                                className="text-sm"
                                placeholder="Enter additional comments..."
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveComment(conversation.rating!.id)}>
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button variant="outline" size="sm" onClick={cancelEdit}>
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-green-800 italic">
                              {conversation.rating.comments || 'No comments provided'}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No rating provided for this turn
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No conversations yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.role !== "admin") {
        window.location.href = "/";
      }
    } else {
      window.location.href = "/";
    }
  }, []);

  const { data: tasks, isLoading } = useQuery<AdminTask[]>({
    queryKey: ["/api/admin/tasks"],
    enabled: !!user,
  });

  const inProgressTasks = tasks?.filter(task => !task.completed) || [];
  const completedTasks = tasks?.filter(task => task.completed) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage and monitor evaluation tasks</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
          >
            Logout
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks.length}</div>
              <p className="text-xs text-slate-500">
                All evaluation tasks created
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <p className="text-xs text-slate-500">
                Tasks with full ratings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Task Management */}
        <Card>
          <CardHeader>
            <CardTitle>Completed Tasks</CardTitle>
            <CardDescription>View completed evaluation tasks with ratings and responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {completedTasks.length > 0 ? (
                  <div className="space-y-3">
                    {completedTasks.map((task, index) => (
                      <Card key={task.id} className="border-l-4 border-l-green-500">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">Task #{index + 1}</h3>
                              <Badge variant="default">Completed</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              User: {task.user.username} • Completed {formatRelativeTime(task.createdAt)}
                            </p>
                          </div>
                          <TaskViewDialog
                            task={task}
                            trigger={
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View Results
                              </Button>
                            }
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completed tasks yet</p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
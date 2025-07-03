import { useState, useEffect } from "react";
import { Bot, User, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
  wordCount?: number;
  conversationId?: number;
  onEdit?: (conversationId: number, newMessage: string) => void;
}

export default function ChatMessage({ message, isUser, timestamp, wordCount, conversationId, onEdit }: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);

  // Sync with updated message from props
  useEffect(() => {
    setEditedMessage(message);
  }, [message]);

  const handleSaveEdit = () => {
    if (conversationId && onEdit && editedMessage.trim() !== message) {
      onEdit(conversationId, editedMessage.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedMessage(message);
    setIsEditing(false);
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return "Now";
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} min ago`;
    } else {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-user-bubble text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
            <p className="text-sm">{message}</p>
          </div>
          <div className="text-xs text-slate-500 mt-1 text-right">
            <span>{formatTimestamp(timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-xs lg:max-w-2xl">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="text-green-600 text-sm" />
          </div>
          <div className="flex-1">
            <div className="bg-ai-bubble border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm relative group">
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    className="min-h-[100px] resize-none"
                    placeholder="Edit the AI response..."
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="prose prose-slate prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{message}</p>
                  </div>
                  {/* Edit icon removed as requested */}
                </>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
              <span>{formatTimestamp(timestamp)}</span>
              {wordCount && (
                <>
                  <span>•</span>
                  <span>{wordCount} words</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  disabled?: boolean;
}

export default function PromptInput({ onSubmit, disabled }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");

  const wordCount = prompt.trim() === "" ? 0 : prompt.trim().split(/\s+/).length;
  const isOverLimit = wordCount > 60;

  const handleSubmit = () => {
    if (prompt.trim() === "" || isOverLimit || disabled) return;
    onSubmit(prompt.trim());
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="flex items-end space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your expertise prompt (maximum 60 words)..."
              className="resize-none max-h-32 pr-24"
              rows={2}
              disabled={disabled}
            />
            <div className={`absolute bottom-2 right-2 text-xs ${
              isOverLimit ? "text-red-500" : "text-slate-500"
            }`}>
              <span>{wordCount}</span>/60 words
            </div>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={prompt.trim() === "" || isOverLimit || disabled}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
        >
          <Send className="mr-2 h-4 w-4" />
          Send
        </Button>
      </div>
    </div>
  );
}

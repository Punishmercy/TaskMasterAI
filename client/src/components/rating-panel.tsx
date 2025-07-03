import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Info, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RatingPanelProps {
  conversation: any;
  onSubmitRating: (ratings: any) => void;
  onRatingChange?: (ratings: any) => void;
  onCompleteTask: () => void;
  isSubmitting: boolean;
  isCompleting: boolean;
  showCompleteButton: boolean;
  initialRatings?: any;
  allRatingsComplete: boolean;
}

const ratingCriteria = [
  {
    key: "accuracy",
    label: "Accuracy",
    tooltip: "How accurate is the information?",
  },
  {
    key: "clarity",
    label: "Clarity",
    tooltip: "How clear is the explanation?",
  },
  {
    key: "relevance",
    label: "Relevance",
    tooltip: "How relevant is it to the prompt?",
  },
  {
    key: "consistency",
    label: "Consistency",
    tooltip: "Is the information consistent?",
  },
  {
    key: "completeness",
    label: "Completeness",
    tooltip: "How complete is the response?",
  },
];

const ratingOptions = [
  { value: "1", label: "1 - Very Poor" },
  { value: "2", label: "2 - Poor" },
  { value: "3", label: "3 - Fair" },
  { value: "4", label: "4 - Good" },
  { value: "5", label: "5 - Excellent" },
];

export default function RatingPanel({
  onSubmitRating,
  onRatingChange,
  onCompleteTask,
  isSubmitting,
  isCompleting,
  showCompleteButton,
  initialRatings,
  allRatingsComplete,
}: RatingPanelProps) {
  const [ratings, setRatings] = useState<Record<string, string>>(
    initialRatings ? {
      accuracy: initialRatings.accuracy?.toString() || "",
      clarity: initialRatings.clarity?.toString() || "",
      relevance: initialRatings.relevance?.toString() || "",
      consistency: initialRatings.consistency?.toString() || "",
      completeness: initialRatings.completeness?.toString() || "",
    } : {}
  );
  const [comments, setComments] = useState(initialRatings?.comments || "");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Check if all required ratings are filled (excluding comments)
  const allRequiredRatingsFilled = ratingCriteria.every(criteria => 
    ratings[criteria.key] && ratings[criteria.key] !== ""
  );

  // Sync with initial ratings when they change
  useEffect(() => {
    if (initialRatings) {
      setRatings({
        accuracy: initialRatings.accuracy?.toString() || "",
        clarity: initialRatings.clarity?.toString() || "",
        relevance: initialRatings.relevance?.toString() || "",
        consistency: initialRatings.consistency?.toString() || "",
        completeness: initialRatings.completeness?.toString() || "",
      });
      setComments(initialRatings.comments || "");
    } else {
      setRatings({});
      setComments("");
    }
  }, [initialRatings]);

  const handleRatingChange = (criteria: string, value: string) => {
    const newRatings = { ...ratings, [criteria]: value };
    setRatings(newRatings);
    setErrors(prev => ({ ...prev, [criteria]: false }));
    
    // Call the parent's onRatingChange callback with current state
    if (onRatingChange) {
      const ratingsData = {
        ...Object.fromEntries(
          Object.entries(newRatings).map(([key, value]) => [key, value ? parseInt(value) : undefined])
        ),
        comments: comments || null,
      };
      onRatingChange(ratingsData);
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {};
    let hasErrors = false;

    ratingCriteria.forEach(criteria => {
      if (!ratings[criteria.key]) {
        newErrors[criteria.key] = true;
        hasErrors = true;
      }
    });

    setErrors(newErrors);

    if (hasErrors) {
      return;
    }

    const ratingsData = {
      ...Object.fromEntries(
        Object.entries(ratings).map(([key, value]) => [key, parseInt(value)])
      ),
      comments: comments || null,
    };

    onSubmitRating(ratingsData);
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Rate the Response</h3>
        <p className="text-sm text-slate-600">Rate each criteria from 1 to 5, where 5 is excellent.</p>
      </div>

      <div className="flex-1 p-6 space-y-6">
        <div className="space-y-4">
          {ratingCriteria.map((criteria) => (
            <div key={criteria.key} className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">{criteria.label}</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{criteria.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Select
                value={ratings[criteria.key] || ""}
                onValueChange={(value) => handleRatingChange(criteria.key, value)}
              >
                <SelectTrigger className={errors[criteria.key] ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {ratingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          
          {/* Comments section */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <Label className="text-sm font-medium text-slate-900">
              Additional Comments
            </Label>
            <Textarea
              value={comments}
              onChange={(e) => {
                const newComments = e.target.value;
                setComments(newComments);
                
                // Call the parent's onRatingChange callback with updated comments
                if (onRatingChange) {
                  const ratingsData = {
                    ...Object.fromEntries(
                      Object.entries(ratings).map(([key, value]) => [key, value ? parseInt(value) : undefined])
                    ),
                    comments: newComments || null,
                  };
                  onRatingChange(ratingsData);
                }
              }}
              placeholder="Add any additional comments or observations about the response..."
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-200">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-600 hover:bg-gray-50 px-3"
          >
            <Info className="h-3 w-3" />
          </Button>
          
          <Button
            onClick={onCompleteTask}
            disabled={isCompleting || !showCompleteButton || !allRatingsComplete}
            className={`flex-1 ${
              showCompleteButton && allRatingsComplete
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
            }`}
          >
            <Check className="mr-2 h-4 w-4" />
            {isCompleting ? "Completing..." : "Complete Evaluation"}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Award, Flame, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  title: string;
  description: string;
  youtubeUrl?: string;
  pointsReward: number;
  caloriesBurned: number;
  onSubmitProof: () => void;
  isCompleted?: boolean;
}

export function TaskCard({ 
  title, 
  description, 
  youtubeUrl, 
  pointsReward, 
  caloriesBurned, 
  onSubmitProof,
  isCompleted = false 
}: TaskCardProps) {
  const openYouTubeVideo = () => {
    if (youtubeUrl) {
      const newWindow = window.open(youtubeUrl, '_blank', 'noopener');
      if (newWindow) newWindow.opener = null;
    }
  };

  return (
    <Card className="hover-elevate transition-all duration-300 border-2">
      <CardHeader>
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="text-lg font-bold" data-testid={`task-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </CardTitle>
          <div className="flex gap-2 flex-shrink-0">
            <Badge className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <Award className="w-3 h-3 mr-1" />
              {pointsReward} pts
            </Badge>
            <Badge className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              <Flame className="w-3 h-3 mr-1" />
              {caloriesBurned} cal
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed" data-testid="task-description">
          {description}
        </p>
        
        {youtubeUrl && (
          <div 
            className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-lg overflow-hidden cursor-pointer group hover-elevate"
            onClick={openYouTubeVideo}
            data-testid="video-thumbnail"
          >
            <div className="aspect-video flex items-center justify-center">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="bg-red-600 hover:bg-red-700 transition-colors rounded-full p-4 shadow-lg">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
                <span className="text-sm font-medium bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full">
                  Watch Tutorial
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          {youtubeUrl && (
            <Button 
              onClick={openYouTubeVideo}
              variant="outline"
              size="sm"
              className="flex-1"
              data-testid="button-watch-tutorial"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Watch Tutorial
            </Button>
          )}
          <Button 
            onClick={onSubmitProof}
            className={cn(
              "flex-1",
              !youtubeUrl && "w-full"
            )}
            variant={isCompleted ? "secondary" : "default"}
            size="sm"
            disabled={isCompleted}
            data-testid="button-submit-proof"
          >
            {isCompleted ? "Proof Submitted" : "Submit Proof"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
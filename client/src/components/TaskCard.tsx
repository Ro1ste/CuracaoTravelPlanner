import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Award, Flame, ExternalLink, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  title: string;
  description: string;
  youtubeUrl?: string;
  pointsReward: number;
  caloriesBurned: number;
  onSubmitProof: () => void;
  isCompleted?: boolean;
  isPending?: boolean;
}

export function TaskCard({ 
  title, 
  description, 
  youtubeUrl, 
  pointsReward, 
  caloriesBurned, 
  onSubmitProof,
  isCompleted = false,
  isPending = false
}: TaskCardProps) {
  const openYouTubeVideo = () => {
    if (youtubeUrl) {
      const newWindow = window.open(youtubeUrl, '_blank', 'noopener');
      if (newWindow) newWindow.opener = null;
    }
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getYouTubeThumbnailUrl = (): string | null => {
    if (!youtubeUrl) return null;
    const videoId = getYouTubeVideoId(youtubeUrl);
    if (!videoId) return null;
    // Use hqdefault for better compatibility (maxresdefault might not exist for all videos)
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  const thumbnailUrl = getYouTubeThumbnailUrl();

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
            {isPending && (
              <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
            {isCompleted && (
              <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Award className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed" data-testid="task-description">
          {description}
        </p>
        
        {youtubeUrl && thumbnailUrl && (
          <div 
            className="relative rounded-lg overflow-hidden cursor-pointer group hover-elevate"
            onClick={openYouTubeVideo}
            data-testid="video-thumbnail"
          >
            <div className="aspect-video relative">
              <img 
                src={thumbnailUrl}
                alt={`${title} tutorial thumbnail`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to gradient background if thumbnail fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Dark overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-red-600 group-hover:bg-red-700 transition-colors rounded-full p-4 shadow-lg">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
              </div>
              {/* Watch Tutorial badge */}
              <div className="absolute bottom-2 right-2">
                <span className="text-sm font-medium bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full">
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
            variant={isCompleted ? "secondary" : isPending ? "outline" : "default"}
            size="sm"
            disabled={isCompleted || isPending}
            data-testid="button-submit-proof"
          >
            {isCompleted ? "Proof Approved" : isPending ? "Pending Review" : "Submit Proof"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
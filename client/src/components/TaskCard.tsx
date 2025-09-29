import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Award, Flame } from "lucide-react";

interface TaskCardProps {
  title: string;
  description: string;
  videoUrl?: string;
  pointsReward: number;
  caloriesBurned: number;
  onSubmitProof: () => void;
  isCompleted?: boolean;
}

export function TaskCard({ 
  title, 
  description, 
  videoUrl, 
  pointsReward, 
  caloriesBurned, 
  onSubmitProof,
  isCompleted = false 
}: TaskCardProps) {
  return (
    <Card className="hover-elevate">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg" data-testid={`task-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              <Award className="w-3 h-3 mr-1" />
              {pointsReward} pts
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Flame className="w-3 h-3 mr-1" />
              {caloriesBurned} cal
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground" data-testid="task-description">
          {description}
        </p>
        
        {videoUrl && (
          <div className="relative bg-muted rounded-lg aspect-video flex items-center justify-center">
            <Button variant="ghost" size="icon" className="h-12 w-12">
              <Play className="h-6 w-6" />
            </Button>
            <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              Watch Tutorial
            </span>
          </div>
        )}
        
        <Button 
          onClick={onSubmitProof}
          className="w-full"
          variant={isCompleted ? "secondary" : "default"}
          disabled={isCompleted}
          data-testid="button-submit-proof"
        >
          {isCompleted ? "Proof Submitted" : "Submit Proof"}
        </Button>
      </CardContent>
    </Card>
  );
}
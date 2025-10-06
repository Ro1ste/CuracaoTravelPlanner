import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Award } from "lucide-react";
import eiswChampion from "@/assets/eisw_champion.jpeg";

interface WinnerCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  winnerCompany: {
    name: string;
    points: number;
    rank: number;
  };
}

export function WinnerCelebration({ isOpen, onClose, winnerCompany }: WinnerCelebrationProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-yellow-600">
            🎉 Congratulations! 🎉
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-center">
          {/* EISW Champion Image */}
          <div className="flex justify-center">
            <img 
              src={eiswChampion} 
              alt="EISW Champion Award" 
              className="max-w-md w-full h-auto rounded-lg shadow-lg"
            />
          </div>
          
          {/* Winner Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <h2 className="text-3xl font-bold text-primary">
                {winnerCompany.name}
              </h2>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-200">
              <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                Corporate Challenge 2025 Champion!
              </h3>
              <div className="flex items-center justify-center gap-4 text-lg">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">Rank #{winnerCompany.rank}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">{winnerCompany.points.toLocaleString()} Points</span>
                </div>
              </div>
            </div>
            
            <p className="text-muted-foreground">
              Outstanding performance in the Curacao International Sports Week Corporate Wellness Challenge!
            </p>
          </div>
          
          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={onClose} size="lg" className="px-8">
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

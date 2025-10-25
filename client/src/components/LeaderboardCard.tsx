import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { WinnerCelebration } from "@/components/WinnerCelebration";
import { useState } from "react";
import { useTheme } from "next-themes";

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number | null;
  logoUrl?: string;
  rank: number;
}

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  title?: string;
  showFullRanking?: boolean;
  onViewAll?: () => void;
}

export function LeaderboardCard({ 
  entries, 
  title = "Leaderboard", 
  showFullRanking = false,
  onViewAll 
}: LeaderboardCardProps) {
  const [showWinnerCelebration, setShowWinnerCelebration] = useState(false);
  const [winnerCompany, setWinnerCompany] = useState<LeaderboardEntry | null>(null);
  const { theme } = useTheme();
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const handleWinnerClick = (entry: LeaderboardEntry) => {
    if (entry.rank === 1) {
      setWinnerCompany(entry);
      setShowWinnerCelebration(true);
    }
  };

  const displayEntries = showFullRanking ? entries : entries.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg" data-testid="leaderboard-title">
          {title}
        </CardTitle>
        {!showFullRanking && entries.length > 5 && (
          <button 
            onClick={onViewAll}
            className="text-sm text-primary hover:underline"
            data-testid="button-view-all-leaderboard"
          >
            View All
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {displayEntries.map((entry) => (
          <div 
            key={entry.id}
            className={`flex items-center justify-between p-3 rounded-lg hover-elevate ${
              entry.rank === 1 
                ? `cursor-pointer border ${
                    theme === 'dark' 
                      ? 'border-yellow-400 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 text-yellow-100' 
                      : 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50'
                  }` 
                : ''
            }`}
            data-testid={`leaderboard-entry-${entry.rank}`}
            onClick={() => handleWinnerClick(entry)}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank)}
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={entry.logoUrl} alt={entry.name} />
                <AvatarFallback className="text-xs">
                  {entry.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm" data-testid={`company-name-${entry.id}`}>
                  {entry.name}
                </p>
              </div>
            </div>
            <Badge variant="outline" data-testid={`company-points-${entry.id}`}>
              {(entry.points ?? 0).toLocaleString()} pts
            </Badge>
          </div>
        ))}
        
        {displayEntries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No companies ranked yet</p>
          </div>
        )}
      </CardContent>
      
      {/* Winner Celebration Modal */}
      {winnerCompany && (
        <WinnerCelebration
          isOpen={showWinnerCelebration}
          onClose={() => setShowWinnerCelebration(false)}
          winnerCompany={{
            name: winnerCompany.name,
            points: winnerCompany.points || 0,
            rank: winnerCompany.rank
          }}
        />
      )}
    </Card>
  );
}
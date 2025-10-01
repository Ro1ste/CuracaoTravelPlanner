import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  rank: number;
}

export function CompanyLeaderboard() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Leaderboard</h1>
        <p className="text-muted-foreground">
          See how companies are ranking in wellness activities
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Rankings</CardTitle>
          <CardDescription>
            Based on total wellness points earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard && leaderboard.length > 0 ? (
              leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
                  data-testid={`leaderboard-entry-${entry.rank}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                      {getRankIcon(entry.rank) || (
                        <span className="text-lg font-bold">{entry.rank}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg" data-testid={`company-name-${entry.rank}`}>
                        {entry.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Rank #{entry.rank}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary" data-testid={`points-${entry.rank}`}>
                      {entry.points}
                    </p>
                    <p className="text-sm text-muted-foreground">points</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No leaderboard data available yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

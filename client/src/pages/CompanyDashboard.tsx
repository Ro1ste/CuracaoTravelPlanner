import { StatCard } from "@/components/StatCard";
import { TaskCard } from "@/components/TaskCard";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { Award, Target, Flame, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// TODO: remove mock data when implementing real functionality
const mockCompanyStats = {
  totalPoints: 2850,
  teamSize: 12,
  totalCaloriesBurned: 4240,
  dailyGoal: 100,
  progressPercentage: 78
};

const mockTodaysTasks = [
  {
    id: "1",
    title: "Morning Stretch Routine",
    description: "Start your day with a 10-minute stretching session to improve flexibility and reduce muscle tension.",
    pointsReward: 50,
    caloriesBurned: 25,
    videoUrl: "sample-video.mp4"
  },
  {
    id: "2", 
    title: "Team Building Walk",
    description: "Take a 15-minute walk with your colleagues around the office or neighborhood.",
    pointsReward: 75,
    caloriesBurned: 80,
  },
  {
    id: "3",
    title: "Desk Exercises",
    description: "Perform simple desk exercises to combat the effects of prolonged sitting.",
    pointsReward: 40,
    caloriesBurned: 30,
    videoUrl: "desk-exercises.mp4"
  }
];

const mockLeaderboard = [
  { id: "1", name: "TechCorp Solutions", points: 3250, rank: 1 },
  { id: "2", name: "Innovation Labs", points: 2890, rank: 2 },
  { id: "3", name: "Digital Dynamics", points: 2850, rank: 3 },
  { id: "4", name: "Future Systems", points: 2420, rank: 4 },
  { id: "5", name: "Smart Analytics", points: 2100, rank: 5 },
];

export function CompanyDashboard() {
  const { toast } = useToast();

  const handleSubmitProof = (taskTitle: string) => {
    console.log(`Submitting proof for task: ${taskTitle}`);
    toast({
      title: "Proof Upload",
      description: `Opening upload dialog for "${taskTitle}"`,
    });
  };

  const handleViewLeaderboard = () => {
    console.log('Viewing full leaderboard');
    toast({
      title: "Navigation",
      description: "Navigating to full leaderboard page",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Dashboard</h1>
        <p className="text-muted-foreground">Track your company's wellness progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Points"
          value={mockCompanyStats.totalPoints.toLocaleString()}
          icon={Award}
          trend={{ value: "12%", isPositive: true }}
        />
        <StatCard
          title="Team Size"
          value={mockCompanyStats.teamSize}
          icon={Users}
          subtitle="Active participants"
        />
        <StatCard
          title="Calories Burned"
          value={mockCompanyStats.totalCaloriesBurned.toLocaleString()}
          icon={Flame}
          trend={{ value: "8%", isPositive: true }}
        />
        <StatCard
          title="Today's Goal"
          value={`${mockCompanyStats.progressPercentage}%`}
          icon={Target}
          subtitle={`${mockCompanyStats.progressPercentage}/${mockCompanyStats.dailyGoal} points`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Section */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4" data-testid="section-title-tasks">Today's Tasks</h2>
            <div className="grid gap-4">
              {mockTodaysTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  title={task.title}
                  description={task.description}
                  pointsReward={task.pointsReward}
                  caloriesBurned={task.caloriesBurned}
                  videoUrl={task.videoUrl}
                  onSubmitProof={() => handleSubmitProof(task.title)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div>
          <LeaderboardCard
            entries={mockLeaderboard}
            title="Top Companies"
            onViewAll={handleViewLeaderboard}
          />
        </div>
      </div>
    </div>
  );
}
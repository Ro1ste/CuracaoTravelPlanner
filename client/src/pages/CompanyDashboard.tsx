import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CompanyProfileSetup } from "@/components/CompanyProfileSetup";
import { ProofSubmissionDialog } from "@/components/ProofSubmissionDialog";
import { StatCard } from "@/components/StatCard";
import { TaskCard } from "@/components/TaskCard";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { Award, Target, Flame, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Company, Task, TaskProof } from "@shared/schema";

export function CompanyDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [proofSubmissionOpen, setProofSubmissionOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string } | null>(null);

  // Fetch company data
  const { data: company, isLoading: companyLoading } = useQuery<Company>({
    queryKey: ["/api/companies", user?.companyId],
    enabled: !!user?.companyId,
  });

  // Fetch tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: !!company,
  });

  // Fetch company proofs
  const { data: proofs, isLoading: proofsLoading } = useQuery<TaskProof[]>({
    queryKey: ["/api/companies", company?.id, "proofs"],
    enabled: !!company?.id,
  });

  // Fetch leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<Array<{
    id: string;
    name: string;
    points: number;
    rank: number;
  }>>({
    queryKey: ["/api/leaderboard"],
    enabled: !!company,
  });

  // If user doesn't have a company profile, show setup form
  if (!user?.hasCompany && !companyLoading) {
    return <CompanyProfileSetup />;
  }

  // Show loading state
  if (companyLoading || !company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSubmitProof = (taskId: string, taskTitle: string) => {
    setSelectedTask({ id: taskId, title: taskTitle });
    setProofSubmissionOpen(true);
  };

  const handleViewLeaderboard = () => {
    toast({
      title: "Navigation",
      description: "Navigating to full leaderboard page",
    });
  };

  // Calculate stats with null handling
  const totalPoints = company.totalPoints || 0;
  const dailyGoal = company.dailyGoal || 100;
  const todaysGoalProgress = dailyGoal > 0 
    ? Math.round((totalPoints % dailyGoal) / dailyGoal * 100)
    : 0;

  const currentRank = leaderboard?.find(l => l.id === company.id)?.rank || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {company.name}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Points"
          value={totalPoints.toLocaleString()}
          icon={Award}
          subtitle={currentRank > 0 ? `Rank #${currentRank}` : undefined}
        />
        <StatCard
          title="Team Size"
          value={company.teamSize || 1}
          icon={Users}
          subtitle="Active participants"
        />
        <StatCard
          title="Calories Burned"
          value={(company.totalCaloriesBurned || 0).toLocaleString()}
          icon={Flame}
        />
        <StatCard
          title="Today's Goal"
          value={`${todaysGoalProgress}%`}
          icon={Target}
          subtitle={`${dailyGoal} points daily`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Section */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4" data-testid="section-title-tasks">
              Available Tasks
            </h2>
            {tasksLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    description={task.description || ""}
                    pointsReward={task.pointsReward || 0}
                    caloriesBurned={task.caloriesBurned || 0}
                    videoUrl={task.videoUrl || undefined}
                    onSubmitProof={() => handleSubmitProof(task.id, task.title)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tasks available at the moment.</p>
                <p className="text-sm">Check back later for new wellness activities!</p>
              </div>
            )}
          </div>

          {/* Submission History */}
          {proofs && proofs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Submissions</h2>
              <div className="space-y-2">
                {proofs.slice(0, 5).map((proof) => (
                  <div
                    key={proof.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                    data-testid={`proof-${proof.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">Task Proof</p>
                      <p className="text-xs text-muted-foreground">
                        {proof.submittedAt ? new Date(proof.submittedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          proof.status === 'approved'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : proof.status === 'rejected'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}
                        data-testid={`status-${proof.status}`}
                      >
                        {proof.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard Section */}
        <div>
          {leaderboardLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <LeaderboardCard
              entries={leaderboard}
              title="Top Companies"
              onViewAll={handleViewLeaderboard}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No leaderboard data available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Proof Submission Dialog */}
      {selectedTask && (
        <ProofSubmissionDialog
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          companyId={company.id}
          open={proofSubmissionOpen}
          onOpenChange={setProofSubmissionOpen}
        />
      )}
    </div>
  );
}

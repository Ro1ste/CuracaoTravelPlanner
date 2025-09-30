import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/StatCard";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { TaskCreationDialog } from "@/components/TaskCreationDialog";
import { ProofReviewDialog } from "@/components/ProofReviewDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Calendar, BarChart3, CheckCircle, Clock, Plus } from "lucide-react";
import type { Company, TaskProof, Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function AdminDashboard() {
  const { toast } = useToast();
  const [taskCreationOpen, setTaskCreationOpen] = useState(false);
  const [proofReviewOpen, setProofReviewOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<(TaskProof & { task?: Task; company?: Company }) | null>(null);

  // Fetch companies
  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Fetch pending proofs
  const { data: pendingProofs } = useQuery<TaskProof[]>({
    queryKey: ["/api/proofs/pending"],
  });

  // Fetch all tasks
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch leaderboard
  const { data: leaderboard } = useQuery<Array<{
    id: string;
    name: string;
    points: number;
    rank: number;
  }>>({
    queryKey: ["/api/leaderboard"],
  });

  // Calculate stats
  const totalCompanies = companies?.length || 0;
  const pendingProofsCount = pendingProofs?.length || 0;
  const totalTasks = tasks?.length || 0;

  const handleReviewProof = async (proofId: string) => {
    const proof = pendingProofs?.find(p => p.id === proofId);
    if (!proof) return;

    // Fetch related task and company data
    const task = tasks?.find(t => t.id === proof.taskId);
    const company = companies?.find(c => c.id === proof.companyId);

    setSelectedProof({ ...proof, task, company });
    setProofReviewOpen(true);
  };

  const handleViewCompanies = () => {
    toast({
      title: "Navigation",
      description: "Company management feature coming soon",
    });
  };

  const handleViewEvents = () => {
    window.location.href = "/events";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage corporate wellness platform</p>
        </div>
        <Button
          onClick={() => setTaskCreationOpen(true)}
          data-testid="button-create-task"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Companies"
          value={totalCompanies}
          icon={Users}
        />
        <StatCard
          title="Pending Proofs"
          value={pendingProofsCount}
          icon={FileText}
          subtitle="Awaiting review"
        />
        <StatCard
          title="Active Tasks"
          value={totalTasks}
          icon={Calendar}
        />
        <StatCard
          title="Total Points"
          value={(leaderboard?.reduce((sum, l) => sum + l.points, 0) || 0).toLocaleString()}
          icon={BarChart3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Companies Leaderboard */}
        {leaderboard && leaderboard.length > 0 ? (
          <LeaderboardCard
            entries={leaderboard}
            title="Company Rankings"
            showFullRanking={true}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Company Rankings</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8 text-muted-foreground">
              <p>No companies registered yet.</p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions & Pending Reviews */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="section-title-quick-actions">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleViewCompanies}
                className="w-full justify-start"
                variant="outline"
                data-testid="button-manage-companies"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Companies
              </Button>
              <Button
                onClick={handleViewEvents}
                className="w-full justify-start"
                variant="outline"
                data-testid="button-manage-events"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Manage Events
              </Button>
            </CardContent>
          </Card>

          {/* Pending Proof Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" data-testid="section-title-pending-proofs">
                <Clock className="h-5 w-5" />
                Pending Proof Reviews
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingProofs && pendingProofs.length > 0 ? (
                pendingProofs.map((proof) => {
                  const company = companies?.find(c => c.id === proof.companyId);
                  const task = tasks?.find(t => t.id === proof.taskId);
                  
                  return (
                    <div
                      key={proof.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                      data-testid={`pending-proof-${proof.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm" data-testid={`proof-company-${proof.id}`}>
                          {company?.name || 'Unknown Company'}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`proof-task-${proof.id}`}>
                          {task?.title || 'Unknown Task'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {proof.contentType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {proof.submittedAt ? new Date(proof.submittedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleReviewProof(proof.id)}
                        data-testid={`button-review-proof-${proof.id}`}
                      >
                        Review
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All proofs reviewed!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <TaskCreationDialog
        open={taskCreationOpen}
        onOpenChange={setTaskCreationOpen}
      />

      {selectedProof && (
        <ProofReviewDialog
          proof={selectedProof}
          open={proofReviewOpen}
          onOpenChange={setProofReviewOpen}
        />
      )}
    </div>
  );
}

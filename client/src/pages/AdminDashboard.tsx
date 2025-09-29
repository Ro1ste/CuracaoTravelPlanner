import { StatCard } from "@/components/StatCard";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Calendar, BarChart3, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// TODO: remove mock data when implementing real functionality
const mockAdminStats = {
  totalCompanies: 24,
  pendingProofs: 8,
  totalEvents: 3,
  monthlyParticipation: 87
};

const mockTopCompanies = [
  { id: "1", name: "TechCorp Solutions", points: 3250, rank: 1 },
  { id: "2", name: "Innovation Labs", points: 2890, rank: 2 },
  { id: "3", name: "Digital Dynamics", points: 2850, rank: 3 },
  { id: "4", name: "Future Systems", points: 2420, rank: 4 },
  { id: "5", name: "Smart Analytics", points: 2100, rank: 5 },
  { id: "6", name: "Creative Studios", points: 1950, rank: 6 },
  { id: "7", name: "Growth Partners", points: 1800, rank: 7 },
  { id: "8", name: "Data Insights", points: 1650, rank: 8 },
  { id: "9", name: "Cloud Networks", points: 1500, rank: 9 },
  { id: "10", name: "Mobile First", points: 1350, rank: 10 },
];

const mockPendingProofs = [
  {
    id: "1",
    companyName: "TechCorp Solutions",
    taskTitle: "Morning Stretch Routine",
    submittedAt: "2 hours ago",
    contentType: "video"
  },
  {
    id: "2", 
    companyName: "Innovation Labs",
    taskTitle: "Team Building Walk",
    submittedAt: "4 hours ago",
    contentType: "image"
  },
  {
    id: "3",
    companyName: "Digital Dynamics", 
    taskTitle: "Desk Exercises",
    submittedAt: "1 day ago",
    contentType: "video"
  }
];

export function AdminDashboard() {
  const { toast } = useToast();

  const handleReviewProof = (proofId: string, companyName: string) => {
    console.log(`Reviewing proof ${proofId} from ${companyName}`);
    toast({
      title: "Review Proof",
      description: `Opening proof review for ${companyName}`,
    });
  };

  const handleViewCompanies = () => {
    console.log('Navigating to companies management');
    toast({
      title: "Navigation",
      description: "Opening company management",
    });
  };

  const handleViewEvents = () => {
    console.log('Navigating to events management');
    toast({
      title: "Navigation", 
      description: "Opening event management",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage corporate wellness platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Companies"
          value={mockAdminStats.totalCompanies}
          icon={Users}
          trend={{ value: "3", isPositive: true }}
        />
        <StatCard
          title="Pending Proofs"
          value={mockAdminStats.pendingProofs}
          icon={FileText}
          subtitle="Awaiting review"
        />
        <StatCard
          title="Active Events"
          value={mockAdminStats.totalEvents}
          icon={Calendar}
        />
        <StatCard
          title="Participation Rate"
          value={`${mockAdminStats.monthlyParticipation}%`}
          icon={BarChart3}
          trend={{ value: "5%", isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Companies Leaderboard */}
        <LeaderboardCard
          entries={mockTopCompanies}
          title="Company Rankings"
          showFullRanking={true}
        />

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
              {mockPendingProofs.map((proof) => (
                <div 
                  key={proof.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                  data-testid={`pending-proof-${proof.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm" data-testid={`proof-company-${proof.id}`}>
                      {proof.companyName}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`proof-task-${proof.id}`}>
                      {proof.taskTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {proof.contentType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {proof.submittedAt}
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => handleReviewProof(proof.id, proof.companyName)}
                    data-testid={`button-review-proof-${proof.id}`}
                  >
                    Review
                  </Button>
                </div>
              ))}
              
              {mockPendingProofs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All proofs reviewed!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
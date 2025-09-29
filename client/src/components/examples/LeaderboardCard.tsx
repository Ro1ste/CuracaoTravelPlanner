import { LeaderboardCard } from '../LeaderboardCard';

export default function LeaderboardCardExample() {
  const mockEntries = [
    { id: "1", name: "TechCorp Solutions", points: 3250, rank: 1 },
    { id: "2", name: "Innovation Labs", points: 2890, rank: 2 },
    { id: "3", name: "Digital Dynamics", points: 2850, rank: 3 },
    { id: "4", name: "Future Systems", points: 2420, rank: 4 },
    { id: "5", name: "Smart Analytics", points: 2100, rank: 5 },
    { id: "6", name: "Creative Studios", points: 1950, rank: 6 },
  ];

  const handleViewAll = () => {
    console.log('View all leaderboard entries');
  };

  return (
    <div className="p-4 max-w-md">
      <LeaderboardCard
        entries={mockEntries}
        title="Top Companies"
        onViewAll={handleViewAll}
      />
    </div>
  );
}
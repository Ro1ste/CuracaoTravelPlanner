import { StatCard } from '../StatCard';
import { Award, Users, Flame, Target } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <StatCard
        title="Total Points"
        value="2,850"
        icon={Award}
        trend={{ value: "12%", isPositive: true }}
      />
      <StatCard
        title="Team Size"
        value={12}
        icon={Users}
        subtitle="Active participants"
      />
      <StatCard
        title="Calories Burned"
        value="4,240"
        icon={Flame}
        trend={{ value: "8%", isPositive: true }}
      />
      <StatCard
        title="Today's Goal"
        value="78%"
        icon={Target}
        subtitle="78/100 points"
      />
    </div>
  );
}
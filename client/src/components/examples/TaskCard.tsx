import { TaskCard } from '../TaskCard';

export default function TaskCardExample() {
  const handleSubmitProof = (taskTitle: string) => {
    console.log(`Submitting proof for: ${taskTitle}`);
  };

  return (
    <div className="grid gap-4 p-4 max-w-2xl">
      <TaskCard
        title="Morning Stretch Routine"
        description="Start your day with a 10-minute stretching session to improve flexibility and reduce muscle tension."
        pointsReward={50}
        caloriesBurned={25}
        youtubeUrl="sample-video.mp4"
        onSubmitProof={() => handleSubmitProof("Morning Stretch Routine")}
      />
      <TaskCard
        title="Team Building Walk"
        description="Take a 15-minute walk with your colleagues around the office or neighborhood."
        pointsReward={75}
        caloriesBurned={80}
        onSubmitProof={() => handleSubmitProof("Team Building Walk")}
        isCompleted={true}
      />
    </div>
  );
}
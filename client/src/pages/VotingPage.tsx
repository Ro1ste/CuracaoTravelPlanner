import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type Subject, type Poll } from "@shared/schema";
import { CheckCircle2, Circle } from "lucide-react";
import { nanoid } from "nanoid";

export default function VotingPage() {
  const [, params] = useRoute("/vote/:shortCode");
  const shortCode = params?.shortCode || "";
  const [sessionId, setSessionId] = useState<string>("");
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());

  useEffect(() => {
    let id = localStorage.getItem("poll_session_id");
    if (!id) {
      id = nanoid();
      localStorage.setItem("poll_session_id", id);
    }
    setSessionId(id);

    const voted = localStorage.getItem(`voted_${shortCode}`);
    if (voted) {
      setVotedPolls(new Set(JSON.parse(voted)));
    }
  }, [shortCode]);

  const { data: subject, isLoading: subjectLoading } = useQuery<Subject>({
    queryKey: ["/api/subjects/code", shortCode],
    enabled: !!shortCode,
  });

  const { data: polls = [], isLoading: pollsLoading } = useQuery<Poll[]>({
    queryKey: ["/api/subjects", subject?.id, "polls"],
    enabled: !!subject?.id,
  });

  const currentPoll = polls.find((p) => p.orderIndex === subject?.currentPollIndex);

  const { data: voteCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/polls", currentPoll?.id, "votes"],
    enabled: !!currentPoll?.id,
    refetchInterval: 3000,
  });

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      if (!currentPoll || !sessionId) return;
      return await apiRequest("/api/votes", "POST", {
        pollId: currentPoll.id,
        sessionId,
        optionId,
      });
    },
    onSuccess: () => {
      if (currentPoll) {
        const newVoted = new Set(votedPolls);
        newVoted.add(currentPoll.id);
        setVotedPolls(newVoted);
        localStorage.setItem(`voted_${shortCode}`, JSON.stringify(Array.from(newVoted)));
        queryClient.invalidateQueries({ queryKey: ["/api/polls", currentPoll.id, "votes"] });
      }
    },
  });

  const hasVoted = currentPoll ? votedPolls.has(currentPoll.id) : false;

  const options: Array<{ id: string; text: string }> = currentPoll?.options
    ? (currentPoll.options as Array<{ id: string; text: string }>)
    : [];

  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  if (subjectLoading || pollsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!subject || !currentPoll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg">No active poll found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-4 border-b-4 border-black pb-6">
          <div className="flex justify-center">
            <div className="text-2xl font-black uppercase tracking-wider">CISW</div>
          </div>
          <h1 className="text-4xl font-bold uppercase">{subject.title}</h1>
          {subject.description && (
            <p className="text-lg text-gray-600">{subject.description}</p>
          )}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>
              Question {(subject.currentPollIndex || 0) + 1} of {polls.length}
            </span>
          </div>
        </div>

        <Card data-testid="card-current-poll">
          <CardHeader>
            <CardTitle className="text-2xl">{currentPoll.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasVoted ? (
              <div className="space-y-3">
                {options.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    className="w-full h-auto py-4 text-lg justify-start border-2 border-black hover:bg-black hover:text-white transition-colors"
                    onClick={() => voteMutation.mutate(option.id)}
                    disabled={voteMutation.isPending}
                    data-testid={`button-vote-${option.text}`}
                  >
                    <Circle className="w-5 h-5 mr-3" />
                    {option.text}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <p className="text-green-800 font-medium">Thank you for voting!</p>
                </div>

                <div className="space-y-3">
                  {options.map((option) => {
                    const count = voteCounts[option.id] || 0;
                    const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;

                    return (
                      <div key={option.id} className="space-y-2" data-testid={`result-${option.text}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.text}</span>
                          <span className="text-sm text-gray-600">
                            {count} votes ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-3" />
                      </div>
                    );
                  })}
                </div>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Total votes: {totalVotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

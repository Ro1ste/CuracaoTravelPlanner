import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { type Subject, type Poll } from "@shared/schema";
import { CheckCircle2, ChevronRight, Lightbulb } from "lucide-react";
import { nanoid } from "nanoid";
import ciswLogo from "@assets/WhatsApp Image 2025-10-26 at 17.19.45_01be175f_1761513642893.jpg";

export default function VotingPage() {
  const [, params] = useRoute("/vote/:shortCode");
  const shortCode = params?.shortCode || "";
  const [sessionId, setSessionId] = useState<string>("");
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [aiInsight, setAiInsight] = useState<string>("");
  const [voterPollIndex, setVoterPollIndex] = useState<number>(0);
  const [showNextPollButton, setShowNextPollButton] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

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

    const savedIndex = localStorage.getItem(`voter_poll_index_${shortCode}`);
    if (savedIndex) {
      setVoterPollIndex(parseInt(savedIndex, 10));
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

  const currentPoll = polls.find((p) => p.orderIndex === voterPollIndex);

  const { data: voteCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/polls", currentPoll?.id, "votes"],
    enabled: !!currentPoll?.id,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!subject?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/polls`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", subjectId: subject.id }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "voteUpdate" && currentPoll && data.pollId === currentPoll.id) {
        queryClient.setQueryData(
          ["/api/polls", currentPoll.id, "votes"],
          data.voteCounts
        );
      } else if (data.type === "currentPollChange") {
        const adminPollIndex = data.currentPollIndex;
        if (adminPollIndex > voterPollIndex) {
          setShowNextPollButton(true);
        }
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [subject?.id, currentPoll?.id, shortCode]);

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      if (!currentPoll || !sessionId) return;
      return await apiRequest("POST", "/api/votes", {
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
        setSelectedOption("");
      }
    },
  });

  const handleNextPoll = () => {
    const newIndex = voterPollIndex + 1;
    setVoterPollIndex(newIndex);
    setShowNextPollButton(false);
    setSelectedOption("");
    localStorage.setItem(`voter_poll_index_${shortCode}`, newIndex.toString());
  };

  useEffect(() => {
    if (subject) {
      const adminPollIndex = subject.currentPollIndex || 0;
      if (adminPollIndex > voterPollIndex) {
        setShowNextPollButton(true);
      }
    }
  }, [subject?.currentPollIndex, voterPollIndex]);

  useEffect(() => {
    if (currentPoll) {
      setAiInsight("");
      const fetchAiInsight = async () => {
        try {
          const response = await fetch(`/api/polls/${currentPoll.id}/question-insight`);
          if (response.ok) {
            const data = await response.json();
            setAiInsight(data.insight);
          }
        } catch (error) {
          console.error("Failed to fetch AI insight:", error);
        }
      };
      fetchAiInsight();
    }
  }, [currentPoll?.id]);

  const handleSubmitVote = () => {
    if (selectedOption) {
      voteMutation.mutate(selectedOption);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo */}
        <header className="bg-white shadow-lg border-b-4 border-black p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <img 
                src={ciswLogo} 
                alt="Curaçao International Sports Week" 
                className="h-16 w-auto object-contain"
                data-testid="img-cisw-logo"
              />
              <div className="border-l-2 border-gray-300 pl-6">
                <h1 className="text-2xl font-bold text-black">{subject.title}</h1>
                {subject.description && (
                  <p className="text-sm text-gray-600 mt-1">{subject.description}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Poll Progress</p>
              <p className="text-xl font-bold text-black">
                {(subject.currentPollIndex || 0) + 1} / {polls.length}
              </p>
            </div>
          </div>
        </header>

        <div className="px-4 md:px-8 pb-8 space-y-6">
          {/* AI Insight */}
          {aiInsight && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg text-blue-900 mb-2">AI Insight</h3>
                    <p className="text-gray-700 leading-relaxed">{aiInsight}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Poll Question Card */}
          <Card data-testid="card-current-poll" className="shadow-xl border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl">{currentPoll.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!hasVoted ? (
              <div className="space-y-6">
                <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                  <div className="space-y-3">
                    {options.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-3 border-2 border-black rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        data-testid={`option-${option.text}`}
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label
                          htmlFor={option.id}
                          className="text-lg font-medium cursor-pointer flex-1"
                        >
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <Button
                  onClick={handleSubmitVote}
                  disabled={!selectedOption || voteMutation.isPending}
                  className="w-full h-12 text-lg font-bold bg-black text-white hover:bg-gray-800"
                  data-testid="button-submit-vote"
                >
                  {voteMutation.isPending ? "Submitting..." : "Submit Vote"}
                </Button>
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

                {/* Next Poll Button - Shows when admin advances */}
                {showNextPollButton && voterPollIndex < polls.length - 1 && (
                  <Button
                    onClick={handleNextPoll}
                    className="w-full h-12 text-lg font-bold bg-black text-white hover:bg-gray-800 mt-4"
                    data-testid="button-next-poll"
                  >
                    Next Poll
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

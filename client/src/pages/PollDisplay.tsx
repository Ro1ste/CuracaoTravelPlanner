import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Subject, type Poll } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import QRCode from "qrcode";
import ciswLogo from "@assets/WhatsApp Image 2025-10-26 at 17.19.45_01be175f_1761513642893.jpg";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const CHART_COLORS = ["#000000", "#404040", "#737373", "#A3A3A3"];

export default function PollDisplay() {
  const [, params] = useRoute("/poll-display/:shortCode");
  const shortCode = params?.shortCode || "";
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [aiCommentary, setAiCommentary] = useState<string>("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const votingUrl = `${window.location.origin}/vote/${shortCode}`;

  const { data: subject } = useQuery<Subject>({
    queryKey: ["/api/subjects/code", shortCode],
    enabled: !!shortCode,
  });

  const { data: polls = [] } = useQuery<Poll[]>({
    queryKey: ["/api/subjects", subject?.id, "polls"],
    enabled: !!subject?.id,
  });

  const currentPoll = polls.find((p) => p.orderIndex === subject?.currentPollIndex);

  const { data: voteCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/polls", currentPoll?.id, "votes"],
    enabled: !!currentPoll?.id,
  });

  useEffect(() => {
    QRCode.toDataURL(votingUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    }).then(setQrCodeUrl);
  }, [votingUrl]);

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
        // Invalidate the correct query key that PollDisplay uses
        queryClient.invalidateQueries({ queryKey: ["/api/subjects/code", shortCode] });
        queryClient.invalidateQueries({ queryKey: ["/api/subjects", subject.id, "polls"] });
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [subject?.id, currentPoll?.id]);

  const advancePollMutation = useMutation({
    mutationFn: async () => {
      if (!subject) return;
      const currentIndex = subject.currentPollIndex || 0;
      if (currentIndex < polls.length - 1) {
        return await apiRequest("PATCH", `/api/subjects/${subject.id}`, {
          currentPollIndex: currentIndex + 1,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects/code", shortCode] });
      setAiCommentary("");
    },
  });

  useEffect(() => {
    if (!currentPoll || Object.keys(voteCounts).length === 0 || isGeneratingAI) return;

    const generateAICommentary = async () => {
      setIsGeneratingAI(true);
      try {
        const pollOptions: Array<{ id: string; text: string }> = currentPoll.options
          ? (currentPoll.options as Array<{ id: string; text: string }>)
          : [];

        const results = pollOptions.map((opt) => ({
          option: opt.text,
          votes: voteCounts[opt.id] || 0,
        }));

        const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);
        
        const resultsText = results
          .map((r) => {
            const percentage = totalVotes > 0 ? ((r.votes / totalVotes) * 100).toFixed(1) : "0.0";
            return `${r.option}: ${r.votes} votes (${percentage}%)`;
          })
          .join("\n");

        const resultsWithPercentage = results.map((r) => ({
          ...r,
          percentage: totalVotes > 0 ? parseFloat(((r.votes / totalVotes) * 100).toFixed(1)) : 0,
        }));

        const response = await fetch(`/api/polls/${currentPoll.id}/commentary`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: currentPoll.question,
            results: resultsWithPercentage,
          }),
        });

        const data = await response.json();
        if (data.commentary) {
          setAiCommentary(data.commentary);
        }
      } catch (error) {
        console.error("Error generating AI commentary:", error);
      } finally {
        setIsGeneratingAI(false);
      }
    };

    const debounceTimer = setTimeout(generateAICommentary, 2000);
    return () => clearTimeout(debounceTimer);
  }, [voteCounts, currentPoll, isGeneratingAI]);

  if (!subject || !currentPoll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">No active poll</p>
          <div className="text-left bg-gray-100 p-4 rounded text-sm font-mono space-y-2">
            <p><strong>Debug Info:</strong></p>
            <p>Short Code: {shortCode}</p>
            <p>Subject: {subject ? `Found (${subject.title})` : 'Not found'}</p>
            <p>Current Poll Index: {subject?.currentPollIndex ?? 'N/A'}</p>
            <p>Polls Count: {polls.length}</p>
            {polls.length > 0 && (
              <div>
                <p>Poll Order Indexes: {polls.map(p => p.orderIndex).join(', ')}</p>
              </div>
            )}
            <p>Current Poll: {currentPoll ? 'Found' : 'Not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const options: Array<{ id: string; text: string }> = currentPoll.options
    ? (currentPoll.options as Array<{ id: string; text: string }>)
    : [];

  const chartData = options.map((option) => ({
    name: option.text,
    votes: voteCounts[option.id] || 0,
  }));

  const totalVotes = chartData.reduce((sum, d) => sum + d.votes, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-black">
      <div className="max-w-[1920px] mx-auto">
        {/* Modern Header */}
        <header className="bg-white text-black py-6 px-12 shadow-2xl border-b-4 border-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="bg-white py-2">
                <img 
                  src={ciswLogo} 
                  alt="Curaçao International Sports Week" 
                  className="h-20 w-auto object-contain"
                  data-testid="img-cisw-logo"
                />
              </div>
              <div className="border-l-2 border-gray-300 pl-8">
                <h2 className="text-3xl font-bold text-black">{subject.title}</h2>
                <p className="text-gray-600 text-sm mt-1">{subject.description}</p>
              </div>
            </div>
            <div className="text-right space-y-3">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Live Poll</p>
                <p className="text-2xl font-bold text-black">
                  Question {(subject.currentPollIndex || 0) + 1} / {polls.length}
                </p>
              </div>
              
              {/* Next Poll Button */}
              {(subject.currentPollIndex || 0) < polls.length - 1 && (
                <Button
                  onClick={() => advancePollMutation.mutate()}
                  disabled={advancePollMutation.isPending}
                  className="bg-black text-white hover:bg-gray-800 font-bold px-6"
                  data-testid="button-next-poll-display"
                >
                  {advancePollMutation.isPending ? "Loading..." : "Next Poll"}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 p-8">
          {/* Left Column - Chart & AI Commentary */}
          <div className="xl:col-span-8 space-y-8">
            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-l-8 border-black">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">{currentPoll.question}</h2>
              <div className="flex items-center gap-4">
                <span className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold">
                  {totalVotes} {totalVotes === 1 ? 'Vote' : 'Votes'}
                </span>
                <span className="text-gray-500 text-sm">Live Results</span>
              </div>
            </div>

            {/* Chart Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-2 h-8 bg-black rounded"></div>
                Live Results
              </h3>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#374151", fontSize: 16, fontWeight: 500 }}
                    angle={0}
                    textAnchor="middle"
                    height={60}
                  />
                  <YAxis tick={{ fill: "#374151", fontSize: 14 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "2px solid #000000",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="votes" fill="#000000" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* AI Commentary */}
            {aiCommentary && (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <span className="text-3xl">🤖</span>
                  AI Analysis
                </h3>
                <p className="text-lg leading-relaxed text-gray-200">{aiCommentary}</p>
              </div>
            )}
          </div>

          {/* Right Column - QR Code & Breakdown */}
          <div className="xl:col-span-4 space-y-8">
            {/* QR Code Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center sticky top-8">
              <div className="bg-black text-white py-3 px-6 rounded-xl mb-6">
                <h3 className="text-xl font-bold">Scan to Vote</h3>
              </div>
              {qrCodeUrl && (
                <div className="p-4 bg-gray-50 rounded-xl inline-block">
                  <img
                    src={qrCodeUrl}
                    alt="Voting QR Code"
                    className="mx-auto w-64 h-64"
                    data-testid="img-qr-code"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-4 font-mono break-all px-2">{votingUrl}</p>
            </div>

            {/* Vote Breakdown Card */}
            <div className="bg-gradient-to-br from-black to-gray-900 rounded-2xl shadow-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Vote Breakdown</h3>
              <div className="space-y-5">
                {chartData.map((data, index) => {
                  const percentage = totalVotes > 0 ? ((data.votes / totalVotes) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">{data.name}</span>
                        <span className="text-2xl font-bold">{percentage}%</span>
                      </div>
                      <div className="bg-gray-700 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-white h-full transition-all duration-700 ease-out rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-400">{data.votes} {data.votes === 1 ? 'vote' : 'votes'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

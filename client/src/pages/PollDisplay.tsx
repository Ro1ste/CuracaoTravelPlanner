import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { type Subject, type Poll } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import QRCode from "qrcode";

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
        queryClient.invalidateQueries({ queryKey: ["/api/subjects", subject.id] });
        queryClient.invalidateQueries({ queryKey: ["/api/subjects", subject.id, "polls"] });
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [subject?.id, currentPoll?.id]);

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-2xl">No active poll</p>
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
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2 border-b-4 border-black pb-6">
          <h1 className="text-5xl font-bold uppercase">{subject.title}</h1>
          <p className="text-xl text-gray-600">
            Live Poll Results - Question {(subject.currentPollIndex || 0) + 1} of {polls.length}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="border-4 border-black rounded-lg p-6 bg-gray-50">
              <h2 className="text-3xl font-bold mb-4">{currentPoll.question}</h2>
              <p className="text-lg text-gray-600">Total Votes: {totalVotes}</p>
            </div>

            <div className="border-4 border-black rounded-lg p-6 bg-white">
              <h3 className="text-2xl font-bold mb-4">Results</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#000000", fontSize: 14 }}
                    angle={-15}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: "#000000", fontSize: 14 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "2px solid #000000",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="votes" fill="#000000">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {aiCommentary && (
              <div className="border-4 border-black rounded-lg p-6 bg-gradient-to-r from-gray-50 to-gray-100">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span className="text-2xl">💬</span>
                  AI Commentary
                </h3>
                <p className="text-lg italic leading-relaxed">{aiCommentary}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="border-4 border-black rounded-lg p-6 bg-white text-center">
              <h3 className="text-2xl font-bold mb-4">Vote Now!</h3>
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="Voting QR Code"
                  className="mx-auto mb-4 border-2 border-black"
                  data-testid="img-qr-code"
                />
              )}
              <p className="text-sm text-gray-600 break-all">{votingUrl}</p>
            </div>

            <div className="border-4 border-black rounded-lg p-6 bg-black text-white">
              <h3 className="text-xl font-bold mb-4">Breakdown</h3>
              <div className="space-y-3">
                {chartData.map((data, index) => {
                  const percentage = totalVotes > 0 ? ((data.votes / totalVotes) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{data.name}</span>
                        <span className="text-lg font-bold">{percentage}%</span>
                      </div>
                      <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-white h-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-400">{data.votes} votes</p>
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

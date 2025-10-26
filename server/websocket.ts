import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

export class PollWebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, Set<WebSocket>> = new Map();

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: "/ws/polls" });

    this.wss.on("connection", (ws: WebSocket, req) => {
      console.log("WebSocket client connected");

      ws.on("message", (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === "subscribe" && data.subjectId) {
            // Subscribe to a specific subject
            if (!this.clients.has(data.subjectId)) {
              this.clients.set(data.subjectId, new Set());
            }
            this.clients.get(data.subjectId)!.add(ws);
            
            ws.send(JSON.stringify({
              type: "subscribed",
              subjectId: data.subjectId
            }));
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        // Remove from all subject subscriptions
        this.clients.forEach((clients) => {
          clients.delete(ws);
        });
        console.log("WebSocket client disconnected");
      });
    });
  }

  // Broadcast vote update to all clients subscribed to a subject
  broadcastVoteUpdate(subjectId: string, pollId: string, voteCounts: Record<string, number>) {
    const clients = this.clients.get(subjectId);
    if (clients) {
      const message = JSON.stringify({
        type: "voteUpdate",
        subjectId,
        pollId,
        voteCounts,
        timestamp: new Date().toISOString()
      });

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  // Broadcast current poll change
  broadcastCurrentPollChange(subjectId: string, currentPollIndex: number) {
    const clients = this.clients.get(subjectId);
    if (clients) {
      const message = JSON.stringify({
        type: "currentPollChange",
        subjectId,
        currentPollIndex,
        timestamp: new Date().toISOString()
      });

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }
}

// Global instance to be initialized in index.ts
export let pollWebSocketService: PollWebSocketService;

export function initializePollWebSocket(server: HTTPServer) {
  pollWebSocketService = new PollWebSocketService(server);
  return pollWebSocketService;
}

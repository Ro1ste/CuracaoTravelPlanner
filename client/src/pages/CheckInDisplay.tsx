import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

// Sanitized check-in type (matches API response)
type CheckInDisplay = {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  checkedInAt: string; // ISO date string from API
};

export function CheckInDisplay() {
  const { eventId } = useParams();
  const [currentCheckIn, setCurrentCheckIn] = useState<CheckInDisplay | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckInIdRef = useRef<string | null>(null);

  // Fetch event details
  const { data: event } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    refetchInterval: 60000, // Refresh event details every minute
  });

  // Poll for recent check-ins every 2 seconds
  const { data: recentCheckIns = [] } = useQuery<CheckInDisplay[]>({
    queryKey: [`/api/events/${eventId}/recent-checkins`],
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Show welcome message when a new check-in is detected
  useEffect(() => {
    if (recentCheckIns.length > 0) {
      const latestCheckIn = recentCheckIns[0];
      
      // Check if this is a new check-in by comparing ID with tracked ref
      if (latestCheckIn.id !== lastCheckInIdRef.current) {
        // Clear any existing timer
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
        
        // Update state and ref
        lastCheckInIdRef.current = latestCheckIn.id;
        setCurrentCheckIn(latestCheckIn);
        setShowWelcome(true);
        
        // Hide welcome message after 5 seconds
        hideTimerRef.current = setTimeout(() => {
          setShowWelcome(false);
          hideTimerRef.current = null;
        }, 5000);
      }
    } else if (recentCheckIns.length === 0 && lastCheckInIdRef.current !== null) {
      // Clear display and timer if no check-ins exist
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      lastCheckInIdRef.current = null;
      setCurrentCheckIn(null);
      setShowWelcome(false);
    }
  }, [recentCheckIns]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-8"
      style={{ 
        background: `linear-gradient(135deg, ${event?.brandingColor || '#ff6600'} 0%, ${event?.brandingColor || '#ff6600'}dd 100%)` 
      }}
    >
      <div className="w-full max-w-4xl">
        {showWelcome && currentCheckIn ? (
          <Card className="p-12 text-center bg-white/95 backdrop-blur-sm shadow-2xl">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
                  <UserCheck className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-6xl font-bold text-gray-900 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {currentCheckIn.firstName} {currentCheckIn.lastName}
                </h1>
                
                <div className="pt-4">
                  <p className="text-3xl font-semibold text-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    Welcome to our
                  </p>
                  <p className="text-4xl font-bold animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200" style={{ color: event?.brandingColor || '#ff6600' }}>
                    {event?.title || 'CISW 2025 Conference'}
                  </p>
                </div>
              </div>
              
              {currentCheckIn.companyName && (
                <p className="text-xl text-gray-600 animate-in fade-in duration-500 delay-300">
                  {currentCheckIn.companyName}
                </p>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center bg-white/90 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserCheck className="w-10 h-10 text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-700">
                  {event?.title || 'Event Check-In'}
                </h2>
                <p className="text-xl text-gray-500">
                  Waiting for check-ins...
                </p>
                
                {recentCheckIns.length > 0 && (
                  <div className="pt-6">
                    <p className="text-sm text-gray-400 mb-3">Recent Attendees:</p>
                    <div className="space-y-1">
                      {recentCheckIns.slice(0, 5).map((checkIn) => (
                        <p key={checkIn.id} className="text-sm text-gray-600">
                          {checkIn.firstName} {checkIn.lastName}
                          {checkIn.companyName && ` - ${checkIn.companyName}`}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
        
        <div className="text-center mt-6 text-white/80 text-sm">
          <p>Event Check-In Display • Updates every 2 seconds</p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@shared/schema";
import ciswLogo from "@assets/cisw-logo.png";

// Sanitized check-in type (matches API response)
type CheckInDisplay = {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  checkedInAt: string;
};

export function CheckInDisplay() {
  const { eventId } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch event details
  const { data: event } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    refetchInterval: 60000,
  });

  // Poll for recent check-ins every 2 seconds
  const { data: recentCheckIns = [] } = useQuery<CheckInDisplay[]>({
    queryKey: [`/api/events/${eventId}/recent-checkins`],
    refetchInterval: 2000,
  });

  // Determine if we should use dark mode based on branding color brightness
  const getBrightness = (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  };

  const brandingColor = event?.brandingColor || '#ff6600';
  const isLightColor = getBrightness(brandingColor) > 128;
  const isDarkMode = !isLightColor;

  // Cycle through attendees every 150 seconds
  useEffect(() => {
    if (recentCheckIns.length === 0) {
      setCurrentIndex(0);
      return;
    }

    // Clear existing timer
    if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
    }

    // Set up cycling timer
    cycleTimerRef.current = setTimeout(() => {
      setFadeIn(false);
      
      // After fade out, change to next attendee
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % recentCheckIns.length);
        setFadeIn(true);
      }, 500);
    }, 150000); // 150 seconds

    return () => {
      if (cycleTimerRef.current) {
        clearTimeout(cycleTimerRef.current);
      }
    };
  }, [recentCheckIns, currentIndex]);

  // Reset to first attendee when list changes
  useEffect(() => {
    if (recentCheckIns.length > 0 && currentIndex >= recentCheckIns.length) {
      setCurrentIndex(0);
      setFadeIn(true);
    }
  }, [recentCheckIns, currentIndex]);

  const currentCheckIn = recentCheckIns[currentIndex];

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8 relative"
      style={{ 
        backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
        color: isDarkMode ? '#FFFFFF' : '#000000'
      }}
      data-testid="checkin-display-container"
    >
      {/* CISW Logo - Top Right Corner */}
      <div className="absolute top-8 right-8">
        <img 
          src={ciswLogo} 
          alt="CISW Logo"
          className="w-48 h-auto"
          style={{
            filter: isDarkMode ? 'brightness(0) invert(1)' : 'none',
          }}
          data-testid="cisw-logo"
        />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-5xl">
        {recentCheckIns.length > 0 && currentCheckIn ? (
          <div 
            className={`text-center transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
            data-testid="attendee-display"
          >
            {/* Welcome Icon */}
            <div className="flex justify-center mb-12">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: brandingColor,
                }}
              >
                <svg 
                  className="w-16 h-16 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
              </div>
            </div>

            {/* Attendee Name */}
            <h1 
              className="text-8xl font-bold mb-8"
              style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
              data-testid="attendee-name"
            >
              {currentCheckIn.firstName} {currentCheckIn.lastName}
            </h1>

            {/* Welcome Message */}
            <div className="space-y-4 mb-8">
              <p 
                className="text-4xl font-semibold"
                style={{ color: isDarkMode ? '#CCCCCC' : '#333333' }}
              >
                Welcome to
              </p>
              <p 
                className="text-5xl font-bold"
                style={{ color: brandingColor }}
                data-testid="event-title"
              >
                {event?.title || 'CISW 2025 Conference'}
              </p>
            </div>

            {/* Company Name */}
            {currentCheckIn.companyName && (
              <p 
                className="text-3xl font-medium"
                style={{ color: isDarkMode ? '#999999' : '#666666' }}
                data-testid="company-name"
              >
                {currentCheckIn.companyName}
              </p>
            )}

            {/* Progress Indicator */}
            {recentCheckIns.length > 1 && (
              <div className="mt-16 flex justify-center gap-2">
                {recentCheckIns.map((_, idx) => (
                  <div
                    key={idx}
                    className="w-3 h-3 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: idx === currentIndex 
                        ? brandingColor 
                        : isDarkMode ? '#333333' : '#CCCCCC'
                    }}
                    data-testid={`progress-dot-${idx}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center" data-testid="waiting-display">
            {/* Waiting Icon */}
            <div className="flex justify-center mb-12">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: isDarkMode ? '#222222' : '#EEEEEE',
                }}
              >
                <svg 
                  className="w-16 h-16"
                  style={{ color: isDarkMode ? '#666666' : '#999999' }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
              </div>
            </div>

            <h2 
              className="text-5xl font-bold mb-4"
              style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
            >
              {event?.title || 'Event Check-In'}
            </h2>
            <p 
              className="text-3xl"
              style={{ color: isDarkMode ? '#999999' : '#666666' }}
            >
              Waiting for attendees...
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div 
        className="absolute bottom-8 left-0 right-0 text-center text-sm"
        style={{ color: isDarkMode ? '#666666' : '#999999' }}
      >
        <p>Check-In Display • Cycling every 150 seconds</p>
      </div>
    </div>
  );
}

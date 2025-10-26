import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@shared/schema";
import ciswLogo from "@assets/cisw-logo.png";
import watermarkImage from "@assets/WhatsApp Image 2025-10-26 at 11.22.13_f28a40f0_1761492297303.jpg";

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
  const [groupedAttendees, setGroupedAttendees] = useState<CheckInDisplay[]>([]);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Group attendees who checked in together (within 30 seconds of each other)
  useEffect(() => {
    if (recentCheckIns.length === 0) {
      setGroupedAttendees([]);
      return;
    }

    // Get the most recent check-in
    const mostRecent = recentCheckIns[0];
    const mostRecentTime = new Date(mostRecent.checkedInAt).getTime();
    
    // Find all attendees who checked in within 30 seconds of the most recent
    const group = recentCheckIns.filter(attendee => {
      const checkInTime = new Date(attendee.checkedInAt).getTime();
      return (mostRecentTime - checkInTime) <= 30000; // 30 seconds
    });
    
    // Limit to 4 attendees max for split screen
    setGroupedAttendees(group.slice(0, 4));
  }, [recentCheckIns]);

  // Continuous cycling through attendees every 150 seconds
  useEffect(() => {
    // Clear existing timers first and reset fade state
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    
    // Always ensure display is visible when effect re-runs
    setFadeIn(true);

    if (recentCheckIns.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (recentCheckIns.length === 1) {
      setCurrentIndex(0);
      return;
    }

    // Set up interval to cycle every 150 seconds
    const cycleToNext = () => {
      setFadeIn(false);
      
      // After fade out, change to next attendee
      fadeTimerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % recentCheckIns.length);
        setFadeIn(true);
      }, 500);
    };

    // Reset to first if current index is out of bounds
    if (currentIndex >= recentCheckIns.length) {
      setCurrentIndex(0);
    }

    // Set up interval for continuous cycling
    cycleTimerRef.current = setInterval(cycleToNext, 150000) as any;

    return () => {
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current);
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [recentCheckIns.length]);

  // Reset to first attendee when list changes substantially
  useEffect(() => {
    if (recentCheckIns.length > 0 && currentIndex >= recentCheckIns.length) {
      setCurrentIndex(0);
      setFadeIn(true);
    }
  }, [recentCheckIns.length, currentIndex]);

  const currentCheckIn = recentCheckIns[currentIndex];
  const isGroupCheckIn = groupedAttendees.length > 1;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8 relative"
      style={{ 
        backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
        color: isDarkMode ? '#FFFFFF' : '#000000'
      }}
      data-testid="checkin-display-container"
    >
      {/* Watermark Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${watermarkImage})`,
          opacity: isDarkMode ? 0.08 : 0.05,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          pointerEvents: 'none'
        }}
        data-testid="watermark-image"
      />

      {/* CISW Logo - Top Right Corner */}
      <div className="absolute top-8 right-8 z-10">
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
      <div className="w-full max-w-7xl">
        {recentCheckIns.length > 0 && currentCheckIn ? (
          isGroupCheckIn ? (
            // Group Check-In Display (Split Screen)
            <div 
              className={`transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
              data-testid="group-attendee-display"
            >
              {/* Event Title Header */}
              <div className="text-center mb-12">
                <p 
                  className="text-4xl font-semibold mb-3"
                  style={{ color: isDarkMode ? '#CCCCCC' : '#333333' }}
                >
                  Welcome to
                </p>
                <p 
                  className="text-6xl font-bold mb-8"
                  style={{ color: brandingColor }}
                  data-testid="event-title-group"
                >
                  {event?.title || 'CISW 2025 Conference'}
                </p>
              </div>

              {/* Grid of Attendees */}
              <div className={`grid gap-8 ${
                groupedAttendees.length === 2 ? 'grid-cols-2' : 
                groupedAttendees.length === 3 ? 'grid-cols-3' : 
                'grid-cols-2'
              }`}>
                {groupedAttendees.map((attendee, idx) => (
                  <div 
                    key={attendee.id}
                    className="text-center p-6 rounded-2xl"
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      border: `2px solid ${brandingColor}40`
                    }}
                    data-testid={`group-attendee-${idx}`}
                  >
                    {/* Welcome Icon */}
                    <div className="flex justify-center mb-6">
                      <div 
                        className="w-24 h-24 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: '#10b981',
                        }}
                      >
                        <svg 
                          className="w-12 h-12 text-white" 
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
                    <h2 
                      className="text-5xl font-bold mb-4"
                      style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
                    >
                      {attendee.firstName} {attendee.lastName}
                    </h2>

                    {/* Company Name */}
                    {attendee.companyName && (
                      <p 
                        className="text-2xl font-medium"
                        style={{ color: isDarkMode ? '#999999' : '#666666' }}
                      >
                        {attendee.companyName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Single Attendee Display
            <div 
              className={`text-center transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
              data-testid="attendee-display"
            >
              {/* Welcome Icon */}
              <div className="flex justify-center mb-12">
                <div 
                  className="w-32 h-32 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: '#10b981',
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
          )
        ) : (
          <div className="text-center" data-testid="waiting-display">
            {/* Waiting Icon */}
            <div className="flex justify-center mb-12">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: '#10b981',
                  opacity: 0.6
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

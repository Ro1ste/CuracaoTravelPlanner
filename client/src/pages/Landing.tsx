import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Users, Calendar, BarChart3, ArrowRight, CheckCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import fddkLogo from "@assets/FDDK_1759241722627.png";

export function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLearnMore = () => {
    document.getElementById('features-section')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const features = [
    {
      icon: Award,
      title: "Task-Based Rewards",
      description: "Complete wellness tasks and earn points for your company"
    },
    {
      icon: Users,
      title: "Team Leaderboards", 
      description: "Compete with other companies and track your progress"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track calories burned, participation rates, and more"
    }
  ];

  const benefits = [
    "Boost employee engagement through gamification",
    "Track company-wide wellness metrics",
    "Foster healthy competition between teams",
    "Generate detailed wellness reports and analytics"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation Header */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={fddkLogo} 
                alt="FDDK Logo" 
                className="h-24 w-auto"
                data-testid="logo-fddk"
              />
              <div className="border-l pl-3">
                <h1 className="font-semibold text-lg" data-testid="nav-title">
                  Corporate Wellness Platform
                </h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        {/* Dark wash overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20"></div>
        
        <div className="relative container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="text-lg px-6 py-2 bg-background/90 backdrop-blur">
              FDDK Wellness Initiative
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Transform Your
              <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                {" "}Workplace Wellness
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Engage your team with gamified wellness challenges, track progress through 
              interactive dashboards, and manage events with seamless QR code integration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleLogin}
                className="text-lg px-8 py-6"
                data-testid="button-login"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleLearnMore}
                className="text-lg px-8 py-6 bg-background/90 backdrop-blur"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features-section" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4" data-testid="features-title">
            Everything You Need for Corporate Wellness
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our comprehensive platform provides all the tools to create an engaging 
            wellness program for your organization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg" data-testid={`feature-title-${index}`}>
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm" data-testid={`feature-description-${index}`}>
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold" data-testid="benefits-title">
              Why Choose Our Platform?
            </h3>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground" data-testid={`benefit-${index}`}>
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-2" data-testid="cta-title">
                  Ready to Get Started?
                </h4>
                <p className="text-muted-foreground mb-6">
                  Join companies already using our platform to boost employee wellness and engagement.
                </p>
                <Button 
                  onClick={handleLogin}
                  className="w-full"
                  data-testid="button-cta-login"
                >
                  Sign In to Your Account
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground" data-testid="footer-text">
              Corporate Wellness Platform powered by <span className="font-semibold text-foreground">Velitt</span>, <span className="font-semibold text-foreground">Digital Adventures</span> and <span className="font-semibold text-foreground">FDDK</span>
            </p>
            <p className="text-xs text-muted-foreground">
              © 2024 FDDK. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
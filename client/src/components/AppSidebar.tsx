import { Home, Trophy, Calendar, Settings, Users, BarChart3, FileText, CheckSquare, UserPlus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";

interface AppSidebarProps {
  userType: 'company' | 'admin';
}

export function AppSidebar({ userType }: AppSidebarProps) {
  const [location] = useLocation();

  const companyMenuItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Tasks",
      url: "/",
      icon: CheckSquare,
    },
    {
      title: "Leaderboard",
      url: "/",
      icon: Trophy,
    },
    {
      title: "Profile",
      url: "/",
      icon: Settings,
    },
  ];

  const adminMenuItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Companies",
      url: "/",
      icon: Users,
    },
    {
      title: "Tasks",
      url: "/",
      icon: CheckSquare,
    },
    {
      title: "Proof Approval",
      url: "/",
      icon: FileText,
    },
    {
      title: "Events",
      url: "/",
      icon: Calendar,
    },
    {
      title: "Analytics",
      url: "/",
      icon: BarChart3,
    },
  ];

  const menuItems = userType === 'admin' ? adminMenuItems : companyMenuItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {userType === 'admin' ? 'Administration' : 'Company Portal'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    data-active={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {userType === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Events</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild data-testid="nav-event-registration">
                    <a href="/admin/event-registration">
                      <UserPlus />
                      <span>Event Registration</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
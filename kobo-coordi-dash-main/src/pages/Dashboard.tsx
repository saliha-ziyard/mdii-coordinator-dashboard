import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardOverview } from "@/components/DashboardOverview";
import { ToolSearch } from "@/components/ToolSearch";
import { ToolDetails } from "@/components/ToolDetails";
import { useData } from "@/context/DataContext";
import { Loader } from "@/components/Loader";

const DashboardContent = () => {
  const [currentView, setCurrentView] = useState("overview");
  const { coordinatorEmail, loading, error } = useData();

  const renderContent = () => {
    switch (currentView) {
      case "overview":
        return <DashboardOverview coordinatorEmail={coordinatorEmail} />;
      case "tools":
        return <ToolSearch />;
      case "tool-details":
        return <ToolDetails />;
      default:
        return <DashboardOverview coordinatorEmail={coordinatorEmail} />;
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive">
        Error: {error}
      </div>
    );

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-forest-light/30 to-earth-blue-light/30">
      <AppSidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 p-6">{renderContent()}</main>
    </div>
  );
};

const Dashboard = () => {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  );
};

export default Dashboard;
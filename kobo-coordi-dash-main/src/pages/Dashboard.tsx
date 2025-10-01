// src/components/Dashboard.tsx
import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardOverview } from "@/components/DashboardOverview";
import { ToolSearch } from "@/components/ToolSearch";
import { ToolDetails } from "@/components/ToolDetails";
import { DataProvider, useData } from "@/context/DataContext";

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-forest-light/30 to-earth-blue-light/30">
      <AppSidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 p-6">
        {renderContent()}
      </main>
    </div>
  );
};

const Dashboard = () => {
  return (
    <DataProvider>
      <SidebarProvider>
        <DashboardContent />
      </SidebarProvider>
    </DataProvider>
  );
};

export default Dashboard;
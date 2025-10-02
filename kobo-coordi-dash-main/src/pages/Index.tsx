import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Target, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-light via-background to-earth-blue-light">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-forest to-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">MDII Research Portal</h1>
                <p className="text-sm text-muted-foreground">CGIAR Tools Dashboard</p>
              </div>
            </div>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-forest to-primary hover:from-forest/90 hover:to-primary/90">
                Coordinator Access
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Research Tools Management
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Comprehensive dashboard for CGIAR coordinators to manage, monitor, and evaluate agricultural research tools and data collection instruments.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-gradient-to-r from-forest to-primary hover:from-forest/90 hover:to-primary/90 gap-2">
              Access Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-forest to-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Dashboard Overview</CardTitle>
              <CardDescription>
                Real-time statistics and summaries of all research tools and evaluations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-earth-blue to-info rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Tool Management</CardTitle>
              <CardDescription>
                Search, review submitted responses, and control tool submissions with stop functionality
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-success to-warning rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>KoBo Integration</CardTitle>
              <CardDescription>
                Seamless data synchronization with KoBo Toolbox for comprehensive research data management
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 bg-card/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-6 py-8 text-center">
          <p className="text-muted-foreground">
            © 2024 CGIAR MDII Project. Agricultural research tools management platform.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

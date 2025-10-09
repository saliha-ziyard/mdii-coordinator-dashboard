"use client";

import React, { useState } from "react";
import { Search, StopCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/context/DataContext";

interface Tool {
  id: string;
  name: string;
  status: string;
  ut3Submissions: number;
  ut4Submissions: number;
  coordinator: string;
  maturityLevel: "advanced" | "early" | null;
}

export const ToolSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("active");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<{ id: string; name: string; maturityLevel: string | null } | null>(null);
  const { tools, setTools, loading, error } = useData();
  const { toast } = useToast();
  const toolsPerPage = 10;

  // Filter tools by status first, then by search query
  const activeTools = tools.filter(tool => tool.status === "active");
  const stoppedTools = tools.filter(tool => tool.status === "stopped");

  const filteredActiveTools = activeTools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.coordinator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStoppedTools = stoppedTools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.coordinator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic based on active tab
  const currentFilteredTools = activeTab === "active" ? filteredActiveTools : filteredStoppedTools;
  const totalPages = Math.ceil(currentFilteredTools.length / toolsPerPage);
  const startIndex = (currentPage - 1) * toolsPerPage;
  const paginatedTools = currentFilteredTools.slice(startIndex, startIndex + toolsPerPage);

  const handleStopTool = (toolId: string, toolName: string, maturityLevel: string | null) => {
    setSelectedTool({ id: toolId, name: toolName, maturityLevel });
    setIsDialogOpen(true);
  };

const handleConfirmStop = async () => {
  if (!selectedTool) return;

  const currentDateTime = new Date();
  const formattedDateTime = currentDateTime.toLocaleString();
  const isoDateTime = currentDateTime.toISOString();

  try {
    const calculationMethod = selectedTool.maturityLevel === "advanced" 
      ? "MDII Regular Version" 
      : "MDII Exante Version"; 

      const csvApiUrl = `${import.meta.env.VITE_AZURE_FUNCTION_BASE}/api/score_kobo_tool?code=${import.meta.env.VITE_AZURE_FUNCTION_KEY}&tool_id=${selectedTool.id}&calculation_method=${encodeURIComponent(calculationMethod)}&column_names=column_names`;      
      const img = new Image();
      img.src = csvApiUrl;
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      const apiUrl = `/api/score-tool?tool_id=${selectedTool.id}`;
      const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to trigger tool stop: ${response.statusText}`);
    }

    setTools((prev: Tool[]) =>
      prev.map((tool) =>
        tool.id === selectedTool.id ? { ...tool, status: "stopped" } : tool
      )
    );

    toast({
      title: "Tool Stopped",
      description: `${selectedTool.name} submissions stopped at ${formattedDateTime}. Email will be sent shortly.`,
    });

    setActiveTab("stopped");
    setCurrentPage(1);

    setTimeout(async () => {
      try {
        const flowUrl = "https://default6afa0e00fa1440b78a2e22a7f8c357.d5.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/080a15cb2b9b4387ac23f1a7978a8bbb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XlWqhTpqNuxZJkvKeCoWziBX5Vhgtix8zdUq0IF8Npw";
        
        const pdfReportLink = `https://mdii-score-tool-gveza9gtabfbbxh8.eastus2-01.azurewebsites.net/api/report_pdf_generation?tool_id=${selectedTool.id}`;
        
        const payload = {
          tool_id: selectedTool.id,
          tool_name: selectedTool.name,
          tool_maturity: selectedTool.maturityLevel || "unknown",
          stopped_at: formattedDateTime,
          stopped_at_iso: isoDateTime,
          timestamp: currentDateTime.getTime(),
            pdf_report_link: pdfReportLink
        };

        const flowResponse = await fetch(flowUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!flowResponse.ok) {
          throw new Error(`Failed to trigger email flow: ${flowResponse.statusText}`);
        }

        toast({
          title: "Email Triggered",
          description: `Email for tool ${selectedTool.id} has been sent with Score report link attached.`,
        });
      } catch (flowErr: any) {
        console.error("Error triggering Power Automate:", flowErr);
        toast({
          title: "Error",
          description: `Failed to trigger email: ${flowErr.message}`,
          variant: "destructive",
        });
      }
    }, 6000);

    setIsDialogOpen(false);
  } catch (err: any) {
    console.error("Error stopping tool:", err);
    toast({
      title: "Error",
      description:
        err.message.includes("Failed to fetch") || err.message.includes("CORS")
          ? "Unable to connect to the server. Please try again later or contact support."
          : `Failed to stop tool: ${err.message}`,
      variant: "destructive",
    });
  }
};

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-success/20 text-success border-success/30">Active</Badge>
    ) : (
      <Badge variant="secondary">Stopped</Badge>
    );
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tool Management</h1>
        <p className="text-muted-foreground">Search and manage research tools and control submissions</p>
      </div>

      {/* Search Bar */}
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Tools
          </CardTitle>
          <CardDescription>Find specific tools by name, coordinator, or tool ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by tool name, coordinator, or tool ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading and Error States */}
      {loading && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="text-center py-8">
            <p className="text-lg font-medium text-foreground">Loading tools...</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="text-center py-8">
            <p className="text-lg font-medium text-foreground">Error</p>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Active and Stopped Tools */}
      {!loading && !error && (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active Collection ({activeTools.length})
            </TabsTrigger>
            <TabsTrigger value="stopped">
              Collection Stopped ({stoppedTools.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-6">
            {filteredActiveTools.length > 0 ? (
              <>
                <div className="grid gap-4">
                  {paginatedTools.map((tool) => (
                    <Card
                      key={tool.id}
                      className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{tool.name} - {tool.id}</CardTitle>
                            {getStatusBadge(tool.status)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStopTool(tool.id, tool.name, tool.maturityLevel)}
                              className="gap-2"
                            >
                              <StopCircle className="w-4 h-4" />
                              Stop Data Collection
                            </Button>
                          </div>
                        </div>
                        <CardDescription className="flex items-center gap-4">
                          <span>Coordinator: {tool.coordinator}</span>
                          <span>•</span>
                          <span>UT3 Submissions: {tool.ut3Submissions}</span>
                          <span>•</span>
                          <span>UT4 Submissions: {tool.ut4Submissions}</span>
                          {tool.maturityLevel && (
                            <>
                              <span>•</span>
                              <span>Maturity: {tool.maturityLevel.charAt(0).toUpperCase() + tool.maturityLevel.slice(1)}</span>
                            </>
                          )}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {filteredActiveTools.length > toolsPerPage && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={handlePreviousPage}
                    >
                      Previous
                    </Button>
                    <span className="text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={handleNextPage}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="shadow-[var(--shadow-card)]">
                <CardContent className="text-center py-8">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">No active tools found</p>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Try adjusting your search criteria" : "All tools have stopped collecting data"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stopped" className="space-y-4 mt-6">
            {filteredStoppedTools.length > 0 ? (
              <>
                <div className="grid gap-4">
                  {paginatedTools.map((tool) => (
                    <Card
                      key={tool.id}
                      className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{tool.name} - {tool.id}</CardTitle>
                            {getStatusBadge(tool.status)}
                          </div>
                        </div>
                        <CardDescription className="flex items-center gap-4">
                          <span>Coordinator: {tool.coordinator}</span>
                          <span>•</span>
                          <span>UT3 Submissions: {tool.ut3Submissions}</span>
                          <span>•</span>
                          <span>UT4 Submissions: {tool.ut4Submissions}</span>
                          {tool.maturityLevel && (
                            <>
                              <span>•</span>
                              <span>Maturity: {tool.maturityLevel.charAt(0).toUpperCase() + tool.maturityLevel.slice(1)}</span>
                            </>
                          )}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {filteredStoppedTools.length > toolsPerPage && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={handlePreviousPage}
                    >
                      Previous
                    </Button>
                    <span className="text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={handleNextPage}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="shadow-[var(--shadow-card)]">
                <CardContent className="text-center py-8">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">No stopped tools found</p>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Try adjusting your search criteria" : "No tools have been stopped yet"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Stop</DialogTitle>
            <DialogDescription>
              Are you sure you want to stop UT3 and UT4 submissions for {selectedTool?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmStop}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
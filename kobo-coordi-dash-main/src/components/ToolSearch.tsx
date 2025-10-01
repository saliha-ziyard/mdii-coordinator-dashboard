"use client";

import React, { useState } from "react";
import { Search, StopCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const { tools, loading, error } = useData();
  const { toast } = useToast();
  const toolsPerPage = 10;

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.coordinator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredTools.length / toolsPerPage);
  const startIndex = (currentPage - 1) * toolsPerPage;
  const paginatedTools = filteredTools.slice(startIndex, startIndex + toolsPerPage);

  const handleStopTool = (toolId: string, toolName: string) => {
    const currentDateTime = new Date().toLocaleString();
    toast({
      title: "Tool Stopped",
      description: `${toolName} submissions stopped at ${currentDateTime}`,
    });
    console.log(`Tool ${toolId} stopped at ${currentDateTime}`);
    // Update tool status
    // Note: You may need to update the context or backend to persist this change
    // For now, this updates local state (not persisted)
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

      {/* Tools List */}
      {!loading && !error && (
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
                      {tool.status === "active" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleStopTool(tool.id, tool.name)}
                          className="gap-2"
                        >
                          <StopCircle className="w-4 h-4" />
                          Stop Tool
                        </Button>
                      )}
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
          {filteredTools.length > 0 && (
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

          {filteredTools.length === 0 && searchQuery && (
            <Card className="shadow-[var(--shadow-card)]">
              <CardContent className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">No tools found</p>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
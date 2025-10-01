"use client"

import React, { useState, useEffect } from "react";
import { Search, StopCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/context/DataContext";
import { getApiUrl } from "@/config/apiConfig";
import { KOBO_CONFIG } from "@/config/koboConfig";
import { Loader } from "./Loader";

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
  const [tools, setTools] = useState<Tool[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { coordinatorEmail } = useData();
  const { toast } = useToast();
  const toolsPerPage = 10;

  useEffect(() => {
    fetchTools();
  }, [coordinatorEmail]);

  const fetchTools = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch main form
      const mainRes = await fetch(getApiUrl(`assets/${KOBO_CONFIG.MAIN_FORM_ID}/data.json`, "mainForm"));
      if (!mainRes.ok) throw new Error("Failed to fetch main form");
      const mainData = await mainRes.json();
      const mainSubs = mainData.results || [];

      // Fetch change coordinator form
      const changeRes = await fetch(
        getApiUrl(`assets/${KOBO_CONFIG.change_coordinator}/data.json`, "changeCoordinator")
      );
      if (!changeRes.ok) throw new Error("Failed to fetch change coordinator form");
      const changeData = await changeRes.json();
      const changeSubs = changeData.results || [];

      // Fetch evaluation forms
      const evalSubs = {
        advanced3: [],
        early3: [],
        advanced4: [],
        early4: [],
      };
      const formMap = {
        advanced3: { id: KOBO_CONFIG.USERTYPE3_FORMS.advanced, label: "advanced3" },
        early3: { id: KOBO_CONFIG.USERTYPE3_FORMS.early, label: "early3" },
        advanced4: { id: KOBO_CONFIG.USERTYPE4_FORMS.advanced, label: "advanced4" },
        early4: { id: KOBO_CONFIG.USERTYPE4_FORMS.early, label: "early4" },
      };

      for (const key in formMap) {
        const { id: fid, label } = formMap[key as keyof typeof formMap];
        const res = await fetch(getApiUrl(`assets/${fid}/data.json`, label));
        if (!res.ok) throw new Error(`Failed to fetch form ${key}`);
        const data = await res.json();
        evalSubs[key as keyof typeof evalSubs] = data.results || [];
      }

      // Sort change submissions by submission time
      changeSubs.sort((a: any, b: any) =>
        new Date(a._submission_time).getTime() - new Date(b._submission_time).getTime()
      );

      // Build current coordinators map and maturity levels
      const currentCoord: { [key: string]: string } = {};
      const maturityLevels: { [key: string]: "advanced" | "early" | null } = {};
      mainSubs.forEach((sub: any) => {
        const toolId = sub[KOBO_CONFIG.TOOL_ID_FIELD];
        if (sub.coordinator_email) {
          currentCoord[toolId] = sub.coordinator_email;
          maturityLevels[toolId] = sub[KOBO_CONFIG.MATURITY_FIELD] || null;
        }
      });
      changeSubs.forEach((ch: any) => {
        const toolId = ch.tool_id;
        const newEmail = ch.Email_of_the_Coordinator;
        if (toolId && newEmail) {
          currentCoord[toolId] = newEmail;
        }
      });

      // Calculate submission counts for each tool
      const submissionCounts: { [key: string]: { ut3: number; ut4: number } } = {};
      mainSubs.forEach((sub: any) => {
        const toolId = sub[KOBO_CONFIG.TOOL_ID_FIELD];
        const maturity = sub[KOBO_CONFIG.MATURITY_FIELD];
        let ut3Subs = 0;
        let ut4Subs = 0;

        if (maturity === "advanced") {
          ut3Subs = evalSubs.advanced3.filter((s: any) => {
            const recordToolId = String(s["group_intro/Q_13110000"] || s["group_requester/Q_13110000"] || s["Q_13110000"] || "").trim();
            return recordToolId === toolId;
          }).length;
          ut4Subs = evalSubs.advanced4.filter((s: any) => {
            const recordToolId = String(s["group_intro/Q_13110000"] || s["group_requester/Q_13110000"] || s["Q_13110000"] || "").trim();
            return recordToolId === toolId;
          }).length;
        } else if (maturity === "early") {
          ut3Subs = evalSubs.early3.filter((s: any) => {
            const recordToolId = String(s["group_intro/Q_13110000"] || s["group_requester/Q_13110000"] || s["Q_13110000"] || "").trim();
            return recordToolId === toolId;
          }).length;
          ut4Subs = evalSubs.early4.filter((s: any) => {
            const recordToolId = String(s["group_intro/Q_13110000"] || s["group_requester/Q_13110000"] || s["Q_13110000"] || "").trim();
            return recordToolId === toolId;
          }).length;
        }

        submissionCounts[toolId] = { ut3: ut3Subs, ut4: ut4Subs };
      });

      // Filter tools for the current coordinator
      const appointedTools = mainSubs
        .filter((sub: any) => currentCoord[sub[KOBO_CONFIG.TOOL_ID_FIELD]] === coordinatorEmail)
        .map((sub: any) => {
          const toolId = sub[KOBO_CONFIG.TOOL_ID_FIELD];
          return {
            id: toolId,
            name: sub[KOBO_CONFIG.TOOL_NAME_FIELD] || "Unknown Tool",
            status: "active", // Assume active; could be updated based on additional logic
            ut3Submissions: submissionCounts[toolId]?.ut3 || 0,
            ut4Submissions: submissionCounts[toolId]?.ut4 || 0,
            coordinator: currentCoord[toolId],
            maturityLevel: maturityLevels[toolId],
          };
        });

      setTools(appointedTools);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tools");
      toast({
        title: "Error",
        description: "Failed to load tools. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
    setTools((prev) =>
      prev.map((tool) =>
        tool.id === toolId ? { ...tool, status: "stopped" } : tool
      )
    );
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
            <p className="text-lg font-medium text-foreground"><Loader/></p>
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
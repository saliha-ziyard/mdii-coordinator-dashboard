import { useState } from "react";
import { Search, FileText, Calendar, User, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Mock data for tool details
const mockToolData = {
  "TOOL001": {
    name: "Agricultural Water Management Tool",
    coordinator: "john.doe@cgiar.org",
    status: "Active",
    createdDate: "2024-01-15",
    location: "Kenya, Ethiopia",
    description: "Tool for managing water resources in agricultural settings",
    submissions: {
      ut3: [
        {
          id: "UT3-001",
          submittedBy: "farmer@example.com",
          submissionDate: "2024-03-20 14:30",
          responses: {
            "Water source": "Borehole",
            "Irrigation method": "Drip irrigation",
            "Crop type": "Tomatoes",
            "Water quality": "Good"
          }
        },
        {
          id: "UT3-002",
          submittedBy: "extension@example.com",
          submissionDate: "2024-03-18 09:15",
          responses: {
            "Water source": "River",
            "Irrigation method": "Sprinkler",
            "Crop type": "Maize",
            "Water quality": "Fair"
          }
        }
      ],
      ut4: [
        {
          id: "UT4-001",
          submittedBy: "researcher@example.com",
          submissionDate: "2024-03-22 16:45",
          responses: {
            "Efficiency rating": "8/10",
            "Cost effectiveness": "High",
            "User satisfaction": "Very satisfied",
            "Recommendations": "Continue implementation"
          }
        }
      ],
      general: [
        {
          id: "GEN-001",
          submittedBy: "coordinator@example.com",
          submissionDate: "2024-03-25 11:20",
          responses: {
            "Overall progress": "On track",
            "Challenges": "Limited water access in some areas",
            "Next steps": "Expand to additional regions"
          }
        }
      ]
    }
  },
  "TOOL002": {
    name: "Crop Yield Optimization Tool",
    coordinator: "jane.smith@cgiar.org",
    status: "Under Review",
    createdDate: "2024-02-01",
    location: "Nigeria, Ghana",
    description: "Tool for optimizing crop yields through data analysis",
    submissions: {
      ut3: [
        {
          id: "UT3-003",
          submittedBy: "farmer2@example.com",
          submissionDate: "2024-03-21 13:00",
          responses: {
            "Crop variety": "Improved maize",
            "Fertilizer type": "NPK",
            "Yield increase": "25%",
            "Soil type": "Clay loam"
          }
        }
      ],
      ut4: [],
      general: []
    }
  }
};

export function ToolDetails() {
  const [toolId, setToolId] = useState("");
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [activeSubmissionType, setActiveSubmissionType] = useState<string>("ut3");

  const handleSearch = () => {
    if (toolId && mockToolData[toolId as keyof typeof mockToolData]) {
      setSelectedTool(mockToolData[toolId as keyof typeof mockToolData]);
    } else {
      setSelectedTool(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">Tool Details</h1>
      </div>

      {/* Tool ID Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Tool by ID
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Tool ID (e.g., TOOL001)"
              value={toolId}
              onChange={(e) => setToolId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tool Information */}
      {selectedTool && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Tool Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">Tool Name</h3>
                  <p className="text-muted-foreground">{selectedTool.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Status</h3>
                  <Badge variant={selectedTool.status === "Active" ? "default" : "secondary"}>
                    {selectedTool.status}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Coordinator
                  </h3>
                  <p className="text-muted-foreground">{selectedTool.coordinator}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created Date
                  </h3>
                  <p className="text-muted-foreground">{selectedTool.createdDate}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </h3>
                  <p className="text-muted-foreground">{selectedTool.location}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Description</h3>
                <p className="text-muted-foreground">{selectedTool.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Submissions</CardTitle>
              <div className="flex gap-2">
                {Object.keys(selectedTool.submissions).map((type) => (
                  <Button
                    key={type}
                    variant={activeSubmissionType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveSubmissionType(type)}
                  >
                    {type.toUpperCase()} ({selectedTool.submissions[type].length})
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedTool.submissions[activeSubmissionType].length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No {activeSubmissionType.toUpperCase()} submissions found
                  </p>
                ) : (
                  selectedTool.submissions[activeSubmissionType].map((submission: any, index: number) => (
                    <Card key={submission.id} className="border-l-4 border-l-forest">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{submission.id}</h4>
                            <p className="text-sm text-muted-foreground">
                              Submitted by: {submission.submittedBy}
                            </p>
                          </div>
                          <Badge variant="outline">{submission.submissionDate}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {Object.entries(submission.responses).map(([question, answer]) => (
                            <div key={question}>
                              <p className="font-medium text-sm">{question}:</p>
                              <p className="text-muted-foreground text-sm ml-4">{answer as string}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* No Tool Found */}
      {toolId && !selectedTool && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No tool found with ID: <span className="font-mono">{toolId}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try searching for TOOL001 or TOOL002
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { MessageSquare, Send, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const CoordinatorFeedback = () => {
  const [feedback, setFeedback] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { toast } = useToast();

  const coordinatorEmail = localStorage.getItem("coordinatorEmail") || "Unknown";
  const charCount = feedback.length;
  const maxChars = 2000;

  const categories = [
    { value: "technical", label: "Technical Issue" },
    { value: "feature", label: "Feature Request" },
    { value: "data", label: "Data Quality" },
    { value: "ui", label: "User Interface" },
    { value: "general", label: "General Feedback" },
    { value: "other", label: "Other" },
  ];

  const priorities = [
    { value: "low", label: "Low Priority", color: "text-blue-600" },
    { value: "medium", label: "Medium Priority", color: "text-yellow-600" },
    { value: "high", label: "High Priority", color: "text-red-600" },
  ];

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + screenshots.length > 2) {
      toast({
        title: "Too Many Screenshots",
        description: "You can only upload a maximum of 2 screenshots",
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder5MB = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isImage) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!isUnder5MB) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Add new screenshots
    setScreenshots(prev => [...prev, ...validFiles].slice(0, 2));

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreviews(prev => [...prev, reader.result as string].slice(0, 2));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
    setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !feedback.trim() || !category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const currentDateTime = new Date();
      const formattedDateTime = currentDateTime.toLocaleString();
      const isoDateTime = currentDateTime.toISOString();

      // Convert screenshots to base64
      const screenshotData = await Promise.all(
        screenshots.map(async (file, index) => ({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          base64: await convertFileToBase64(file),
          index: index + 1
        }))
      );

      // Power Automate HTTP trigger URL
      const powerAutomateUrl = import.meta.env.VITE_POWER_AUTOMATE_FEEDBACK_URL || "";

      if (!powerAutomateUrl) {
        throw new Error("Power Automate URL not configured");
      }

      // Simple JSON payload for Power Automate to parse
      const payload = {
        coordinator_email: coordinatorEmail,
        subject: subject,
        feedback: feedback,
        category: categories.find((c) => c.value === category)?.label || category,
        priority: priorities.find((p) => p.value === priority)?.label || priority,
        submitted_at: formattedDateTime,
        submitted_at_iso: isoDateTime,
        timestamp: currentDateTime.getTime(),
        screenshots: screenshotData,
        has_screenshots: screenshotData.length > 0
      };

      const response = await fetch(powerAutomateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send feedback: ${response.statusText}`);
      }

      setSubmitSuccess(true);
      toast({
        title: "Feedback Submitted",
        description: "Your feedback has been sent to the team successfully",
      });

      // Reset form
      setFeedback("");
      setSubject("");
      setCategory("");
      setPriority("medium");
      setScreenshots([]);
      setScreenshotPreviews([]);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast({
        title: "Submission Failed",
        description: err instanceof Error ? err.message : "Unable to submit feedback. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Feedback & Support</h1>
        <p className="text-muted-foreground">
          Share your thoughts, report issues, or request new features
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Feedback Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Submit Feedback
              </CardTitle>
              <CardDescription>
                Your input helps us improve the MDII Portal. All feedback is reviewed by our team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Success Alert */}
                {submitSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Your feedback has been successfully submitted and posted to the team channel!
                    </AlertDescription>
                  </Alert>
                )}

                {/* Coordinator Email Display */}
                <div className="space-y-2">
                  <Label>Submitted By</Label>
                  <Input value={coordinatorEmail} disabled className="bg-muted" />
                </div>

                {/* Category and Priority Row */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <span className={p.color}>{p.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Subject <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Brief summary of your feedback"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {subject.length}/200 characters
                  </p>
                </div>

                {/* Feedback Text */}
                <div className="space-y-2">
                  <Label htmlFor="feedback">
                    Detailed Feedback <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="feedback"
                    placeholder="Describe your feedback, issue, or suggestion in detail..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    maxLength={maxChars}
                    rows={8}
                    className="resize-none"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {charCount}/{maxChars} characters
                    </span>
                    {charCount > maxChars * 0.9 && (
                      <span className="text-yellow-600">
                        Approaching character limit
                      </span>
                    )}
                  </div>
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-2">
                  <Label htmlFor="screenshots">
                    Screenshots (Optional)
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        id="screenshots"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleScreenshotChange}
                        disabled={screenshots.length >= 2}
                        className="cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {screenshots.length}/2
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload up to 2 screenshots (PNG, JPG, max 5MB each)
                    </p>
                    
                    {/* Screenshot Previews */}
                    {screenshotPreviews.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {screenshotPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Screenshot ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeScreenshot(index)}
                            >
                              Remove
                            </Button>
                            <span className="absolute bottom-2 left-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
                              {screenshots[index]?.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !subject.trim() || !feedback.trim() || !category}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFeedback("");
                      setSubject("");
                      setCategory("");
                      setPriority("medium");
                      setScreenshots([]);
                      setScreenshotPreviews([]);
                      setSubmitSuccess(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Clear Form
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info Cards */}
        <div className="space-y-6">
          {/* Guidelines Card */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-lg">Feedback Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Do Include:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Specific details about the issue</li>
                  <li>Steps to reproduce problems</li>
                  <li>Screenshots if applicable</li>
                  <li>Expected vs. actual behavior</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Response Time:
                </h4>
                <p className="text-sm text-muted-foreground ml-6">
                  We aim to review all feedback within 2-3 business days.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="shadow-[var(--shadow-card)] border-forest/20">
            <CardHeader className="bg-gradient-to-br from-forest/5 to-primary/5">
              <CardTitle className="text-lg">Need Immediate Help?</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                For urgent technical issues or critical problems, please contact our support team directly.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-16">Email:</span>
                  <span className="text-muted-foreground">support@mdii.cgiar.org</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-16">Teams:</span>
                  <span className="text-muted-foreground">MDII Support Channel</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-lg">Your Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Feedback Submitted</span>
                  <span className="text-2xl font-bold text-forest">-</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Thank you for helping us improve the MDII Portal!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
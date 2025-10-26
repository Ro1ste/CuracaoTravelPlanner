import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSubjectSchema, insertPollSchema, type Subject, type Poll, type InsertPoll } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, QrCode, ExternalLink } from "lucide-react";
import { nanoid } from "nanoid";
import { z } from "zod";

const subjectFormSchema = insertSubjectSchema.extend({
  title: z.string().min(1, "Title is required"),
});

const pollFormSchema = z.object({
  question: z.string().min(1, "Question is required"),
  option1: z.string().min(1, "Option 1 is required"),
  option2: z.string().min(1, "Option 2 is required"),
  option3: z.string().optional(),
  option4: z.string().optional(),
});

export default function PollsManagement() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const subjectForm = useForm({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      shortCode: "",
    },
  });

  const pollForm = useForm({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      question: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof subjectFormSchema>) => {
      const shortCode = data.shortCode || nanoid(6).toUpperCase();
      return await apiRequest("POST", "/api/subjects", { ...data, shortCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setCreateDialogOpen(false);
      subjectForm.reset();
      toast({
        title: "Success",
        description: "Subject created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subject",
        variant: "destructive",
      });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subject",
        variant: "destructive",
      });
    },
  });

  const { data: polls = [] } = useQuery<Poll[]>({
    queryKey: ["/api/subjects", selectedSubject?.id, "polls"],
    enabled: !!selectedSubject,
  });

  const createPollMutation = useMutation({
    mutationFn: async (data: InsertPoll) => {
      return await apiRequest("POST", "/api/polls", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects", selectedSubject?.id, "polls"] });
      setPollDialogOpen(false);
      pollForm.reset();
      toast({
        title: "Success",
        description: "Poll created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create poll",
        variant: "destructive",
      });
    },
  });

  const deletePollMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/polls/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects", selectedSubject?.id, "polls"] });
      toast({
        title: "Success",
        description: "Poll deleted successfully",
      });
    },
  });

  const onCreateSubject = (data: z.infer<typeof subjectFormSchema>) => {
    createSubjectMutation.mutate(data);
  };

  const onCreatePoll = (data: z.infer<typeof pollFormSchema>) => {
    if (!selectedSubject) return;
    const orderIndex = polls.length;
    
    // Convert separate option fields to options array
    const options = [
      { id: "1", text: data.option1 },
      { id: "2", text: data.option2 },
      data.option3 ? { id: "3", text: data.option3 } : null,
      data.option4 ? { id: "4", text: data.option4 } : null,
    ].filter((opt): opt is { id: string; text: string } => opt !== null);
    
    createPollMutation.mutate({
      subjectId: selectedSubject.id,
      question: data.question,
      options,
      orderIndex,
    });
  };

  const votingUrl = (shortCode: string) =>
    `${window.location.origin}/vote/${shortCode}`;

  const displayUrl = (shortCode: string) =>
    `${window.location.origin}/poll-display/${shortCode}`;

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Polls Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage polling subjects and questions
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-subject">
              <Plus className="w-4 h-4 mr-2" />
              Create Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Polling Subject</DialogTitle>
            </DialogHeader>
            <Form {...subjectForm}>
              <form onSubmit={subjectForm.handleSubmit(onCreateSubject)} className="space-y-4">
                <FormField
                  control={subjectForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-subject-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={subjectForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} data-testid="input-subject-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={subjectForm.control}
                  name="shortCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Code (Optional - auto-generated if blank)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="e.g., SPORT2025"
                          data-testid="input-subject-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    data-testid="button-cancel-subject"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSubjectMutation.isPending} data-testid="button-submit-subject">
                    {createSubjectMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map((subject) => (
          <Card key={subject.id} data-testid={`card-subject-${subject.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{subject.title}</CardTitle>
                  {subject.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {subject.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                      {subject.shortCode}
                    </code>
                    <span className="text-sm text-muted-foreground">
                      {polls.filter((p) => p.subjectId === subject.id).length} polls
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteSubjectMutation.mutate(subject.id)}
                  data-testid={`button-delete-subject-${subject.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedSubject(subject);
                    setPollDialogOpen(true);
                  }}
                  data-testid={`button-add-poll-${subject.id}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Poll
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(votingUrl(subject.shortCode), "_blank")}
                  data-testid={`button-view-voting-${subject.id}`}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Voting Page
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(displayUrl(subject.shortCode), "_blank")}
                  data-testid={`button-view-display-${subject.id}`}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Live Display
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={pollDialogOpen} onOpenChange={setPollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Poll to "{selectedSubject?.title}"
            </DialogTitle>
          </DialogHeader>
          <Form {...pollForm}>
            <form onSubmit={pollForm.handleSubmit(onCreatePoll)} className="space-y-4">
              <FormField
                control={pollForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-poll-question" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pollForm.control}
                name="option1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option 1</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-poll-option1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pollForm.control}
                name="option2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option 2</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-poll-option2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pollForm.control}
                name="option3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option 3 (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-poll-option3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pollForm.control}
                name="option4"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option 4 (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-poll-option4" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPollDialogOpen(false)}
                  data-testid="button-cancel-poll"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPollMutation.isPending} data-testid="button-submit-poll">
                  {createPollMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

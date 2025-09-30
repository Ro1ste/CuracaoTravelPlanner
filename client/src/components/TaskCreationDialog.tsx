import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type InsertTask } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface TaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskCreationDialog({
  open,
  onOpenChange,
}: TaskCreationDialogProps) {
  const { toast } = useToast();

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      pointsReward: 50,
      caloriesBurned: 50,
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      return await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Task created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTask) => {
    createTaskMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-task-creation">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">Create New Task</DialogTitle>
          <DialogDescription>
            Add a new wellness task for companies to complete.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Morning Stretch Routine"
                      {...field}
                      data-testid="input-task-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the task and how to complete it..."
                      {...field}
                      value={field.value || ""}
                      data-testid="input-task-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pointsReward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points Reward</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        onBlur={field.onBlur}
                        name={field.name}
                        data-testid="input-points-reward"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="caloriesBurned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories Burned</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        onBlur={field.onBlur}
                        name={field.name}
                        data-testid="input-calories-burned"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/video.mp4"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-video-url"
                    />
                  </FormControl>
                  <FormDescription>
                    Link to an instructional video
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending}
                data-testid="button-create-task"
              >
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

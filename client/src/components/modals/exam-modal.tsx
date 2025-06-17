import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertExamSchema, Exam } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

const formSchema = insertExamSchema.extend({
  date: z.date(),
  startTime: z.date().optional().nullable(),
  endTime: z.date().optional().nullable(),
  subject: z.string().min(2, "Subject must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.coerce.number().min(1, "Total marks must be at least 1"),
  status: z.enum(["upcoming", "active", "completed"]),
});

type ExamFormValues = z.infer<typeof formSchema>;

interface ExamModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exam?: ExamFormValues & { id: number };
  mode: "create" | "edit";
}

export function ExamModal({ isOpen, onOpenChange, exam, mode }: ExamModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const defaultValues: Partial<ExamFormValues> = {
    name: exam?.name || "",
    subject: exam?.subject || "",
    date: exam?.date ? new Date(exam.date) : new Date(),
    startTime: exam?.startTime ? new Date(exam.startTime) : null,
    endTime: exam?.endTime ? new Date(exam.endTime) : null,
    duration: exam?.duration || 60,
    totalMarks: exam?.totalMarks || 100,
    status: exam?.status || "upcoming",
  };

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Auto-calculate end time when start time or duration changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if ((name === "startTime" || name === "duration") && value.startTime && value.duration) {
        const startTime = new Date(value.startTime);
        const duration = Number(value.duration);
        
        if (!isNaN(startTime.getTime()) && duration > 0) {
          const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
          form.setValue("endTime", endTime, { shouldValidate: true });
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: ExamFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting exam form with data:", data);
      
      // Convert date and times to ISO strings for API request
      const examData = {
        ...data,
        date: data.date.toISOString(),
        startTime: data.startTime ? data.startTime.toISOString() : null,
        endTime: data.endTime ? data.endTime.toISOString() : null,
      };
      
      if (mode === "create") {
        const newExam = await apiRequest<Exam>("POST", "/api/exams", examData);
        console.log("Created exam:", newExam);
        
        toast({
          title: "Success",
          description: `Exam "${newExam.name}" created successfully`,
        });
        
        // Force refresh the queries to get the latest data
        await queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
        
        // Close modal and redirect to paper creation page
        onOpenChange(false);
        navigate(`/exams/${newExam.id}/paper`);
        
        // Reset form fields on successful creation
        form.reset({
          name: "",
          subject: "",
          date: new Date(),
          duration: 60,
          totalMarks: 100,
          status: "upcoming"
        });
      } else if (mode === "edit" && exam) {
        const updatedExam = await apiRequest<Exam>("PUT", `/api/exams/${exam.id}`, examData);
        console.log("Updated exam:", updatedExam);
        
        toast({
          title: "Success",
          description: `Exam "${updatedExam.name}" updated successfully`,
        });
        
        // Force refresh the queries to get the latest data
        await queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error submitting exam form:", error);
      toast({
        title: "Error",
        description: "Failed to save exam. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Exam" : "Edit Exam"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Add a new exam to the system by filling out the form below." 
              : "Update the exam details using the form below."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Mathematics Final" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Mathematics" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          field.onChange(value);
                          
                          // Trigger end time calculation
                          const startTime = form.getValues("startTime");
                          if (startTime && value > 0) {
                            const endTime = new Date(startTime.getTime() + value * 60 * 1000);
                            form.setValue("endTime", endTime, { shouldValidate: true });
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Marks</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Exam Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPpp")
                            ) : (
                              <span>Pick start time</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(date) => {
                            field.onChange(date);
                            
                            // Auto-calculate end time when start time changes
                            if (date) {
                              const duration = form.getValues("duration");
                              if (duration && duration > 0) {
                                const endTime = new Date(date.getTime() + duration * 60 * 1000);
                                form.setValue("endTime", endTime, { shouldValidate: true });
                              }
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPpp")
                            ) : (
                              <span>Pick end time</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {mode === "edit" && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem 
                          value="upcoming"
                          disabled={exam?.status === "active"}
                        >
                          Upcoming
                        </SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    {exam?.status === "active" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Cannot change active exam back to upcoming while students may be taking it
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
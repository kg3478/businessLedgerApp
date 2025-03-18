import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";

// Define the validation schema
const partySchema = z.object({
  name: z.string().min(1, { message: "Party name is required" }),
  description: z.string().optional(),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/, {
      message: "Invalid GSTIN format",
    })
    .optional()
    .or(z.literal("")),
});

type PartyFormValues = z.infer<typeof partySchema>;

interface PartyFormProps {
  onSubmit: (data: PartyFormValues) => void;
  isSubmitting: boolean;
  defaultValues?: Partial<PartyFormValues>;
}

export default function PartyForm({
  onSubmit,
  isSubmitting,
  defaultValues = {
    name: "",
    description: "",
    gstin: "",
  },
}: PartyFormProps) {
  const form = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 py-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Party Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter party name" {...field} />
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
                  placeholder="Enter a brief description"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gstin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GSTIN</FormLabel>
              <FormControl>
                <Input placeholder="Enter GSTIN number" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Party
          </Button>
        </div>
      </form>
    </Form>
  );
}

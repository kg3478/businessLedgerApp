import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Transaction } from "@shared/schema";

// Define the validation schema
const billUploadSchema = z.object({
  transactionId: z.string().optional(),
  billReference: z.string().optional(),
  amount: z.number().positive("Amount must be positive").optional(),
});

type BillUploadFormValues = z.infer<typeof billUploadSchema>;

interface BillUploadProps {
  partyId: number;
  transactionId: number | null;
  transactions: Transaction[];
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
}

export default function BillUpload({
  partyId,
  transactionId,
  transactions,
  onSubmit,
  isSubmitting,
}: BillUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const defaultTransaction = transactionId 
    ? String(transactionId)
    : transactions.length > 0 
      ? String(transactions[0].id)
      : undefined;

  const form = useForm<BillUploadFormValues>({
    resolver: zodResolver(billUploadSchema),
    defaultValues: {
      transactionId: defaultTransaction,
      billReference: "",
      amount: undefined,
    },
  });

  const handleSubmit = (data: BillUploadFormValues) => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("partyId", String(partyId));

    if (data.transactionId) {
      formData.append("transactionId", data.transactionId);
    }

    if (data.billReference) {
      formData.append("billReference", data.billReference);
    }

    if (data.amount) {
      formData.append("amount", String(data.amount));
    }

    onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 py-4"
      >
        {!transactionId && transactions.length > 0 && (
          <FormField
            control={form.control}
            name="transactionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link to Transaction</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a transaction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {transactions.map((transaction) => (
                      <SelectItem key={transaction.id} value={String(transaction.id)}>
                        {transaction.reference ? transaction.reference : `Transaction ${transaction.id}`} - ₹{transaction.amount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="billReference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bill Reference</FormLabel>
              <FormControl>
                <Input placeholder="Enter bill reference" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!transactionId && (
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₹)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">₹</span>
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-8"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || "")}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-2">
          <FormLabel>Upload Bill *</FormLabel>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {!selectedFile ? (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 focus:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                        required
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF up to 10MB</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:text-red-500"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove file
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || !selectedFile}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload Bill
          </Button>
        </div>
      </form>
    </Form>
  );
}

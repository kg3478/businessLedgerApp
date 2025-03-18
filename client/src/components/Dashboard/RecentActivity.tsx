import { useRef, useState } from "react";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, 
  Eye, 
  Plus, 
  Upload 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TransactionForm from "@/components/TransactionForm";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Transaction, CreateTransaction, TransactionType } from "@shared/schema";

interface RecentActivityProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export default function RecentActivity({ transactions, isLoading }: RecentActivityProps) {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>("CREDIT");
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: CreateTransaction) => {
      const res = await apiRequest("POST", "/api/transactions", transactionData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      setIsAddTransactionOpen(false);
      toast({
        title: "Success",
        description: "Transaction has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create transaction: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const recentTransactions = [...(transactions || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 4);

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTransactionType("CREDIT");
                setIsAddTransactionOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    {[...Array(4)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}

                {!isLoading && recentTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No transactions recorded yet
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && recentTransactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Link 
                        href={`/parties/${transaction.partyId}`}
                        className="text-primary hover:underline"
                      >
                        {transaction.partyName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === "CREDIT" ? "destructive" : "default"}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.reference || "-"}</TableCell>
                    <TableCell className={`font-medium ${transaction.type === "CREDIT" ? "text-red-600" : "text-green-600"}`}>
                      ₹{transaction.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {transaction.type === "CREDIT" && !transaction.billId && (
                          <Button variant="ghost" size="icon">
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                        {transaction.billId && (
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 py-3">
          <Link href="/entries" className="ml-auto text-sm font-medium text-primary hover:text-primary/80">
            View all activity <span aria-hidden="true">&rarr;</span>
          </Link>
        </CardFooter>
      </Card>

      {/* Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {transactionType === "CREDIT" ? "Add Credit Entry" : "Record Deposit"}
            </DialogTitle>
          </DialogHeader>
          {selectedPartyId && (
            <TransactionForm 
              partyId={selectedPartyId} 
              type={transactionType}
              onSubmit={(data) => createTransactionMutation.mutate(data)}
              isSubmitting={createTransactionMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

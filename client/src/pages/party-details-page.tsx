import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PencilIcon, PlusIcon, Upload, Download, FileText, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import TransactionForm from "@/components/TransactionForm";
import BillUpload from "@/components/BillUpload";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Party, Transaction, Bill, TransactionType, CreateTransaction } from "@shared/schema";

export default function PartyDetailsPage() {
  const [_, navigate] = useLocation();
  const [match] = useRoute<{ id: string }>("/parties/:id");
  const partyId = match?.params.id ? parseInt(match.params.id) : null;
  
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isUploadBillOpen, setIsUploadBillOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>("CREDIT");
  const [selectedTransaction, setSelectedTransaction] = useState<number | null>(null);
  
  const { toast } = useToast();

  const { data: party, isLoading: isLoadingParty } = useQuery<Party>({
    queryKey: ["/api/parties", partyId],
    enabled: !!partyId,
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", partyId],
    enabled: !!partyId,
  });

  const { data: bills, isLoading: isLoadingBills } = useQuery<Bill[]>({
    queryKey: ["/api/bills", partyId],
    enabled: !!partyId,
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: CreateTransaction) => {
      const res = await apiRequest("POST", "/api/transactions", transactionData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", partyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parties", partyId] });
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

  const uploadBillMutation = useMutation({
    mutationFn: async ({ formData, transactionId }: { formData: FormData, transactionId?: number }) => {
      const url = transactionId 
        ? `/api/bills/upload/${transactionId}` 
        : `/api/bills/upload`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to upload bill");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bills", partyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", partyId] });
      setIsUploadBillOpen(false);
      setSelectedTransaction(null);
      toast({
        title: "Success",
        description: "Bill has been uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to upload bill: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  if (!partyId) {
    navigate("/parties");
    return null;
  }

  return (
    <MainLayout>
      <Button variant="outline" onClick={() => navigate("/parties")} className="mb-4">
        ← Back to Parties
      </Button>

      {/* Party Details Section */}
      <div className="mb-6">
        {isLoadingParty ? (
          <div className="bg-white shadow rounded-lg p-6">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{party?.name}</CardTitle>
                  <CardDescription>{party?.description || "No description"}</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
              <Separator className="my-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">GSTIN</h4>
                  <p className="text-lg font-medium">{party?.gstin || "Not provided"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Outstanding Balance</h4>
                  <p className={`text-lg font-bold ${party?.balance && party.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{party?.balance?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Last Activity</h4>
                  <p className="text-lg font-medium">
                    {party?.lastActivityDate
                      ? new Date(party.lastActivityDate).toLocaleDateString()
                      : "No activity recorded"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Party Actions */}
      <div className="flex gap-2 mb-6">
        <Button onClick={() => {
          setTransactionType("CREDIT");
          setIsAddTransactionOpen(true);
        }}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Credit Entry
        </Button>
        <Button onClick={() => {
          setTransactionType("DEPOSIT");
          setIsAddTransactionOpen(true);
        }}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Deposit Entry
        </Button>
        <Button onClick={() => setIsUploadBillOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Bill
        </Button>
      </div>

      {/* Transactions & Bills Tabs */}
      <Tabs defaultValue="transactions">
        <TabsList className="mb-6">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTransactions && (
                      [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        </TableRow>
                      ))
                    )}

                    {!isLoadingTransactions && transactions?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No transactions recorded for this party yet
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoadingTransactions && transactions?.map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === "CREDIT" ? "destructive" : "default"}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.reference || "-"}</TableCell>
                        <TableCell className={`font-medium ${transaction.type === "CREDIT" ? "text-red-600" : "text-green-600"}`}>
                          ₹{transaction.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.notes || "-"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {transaction.type === "CREDIT" && !transaction.billId && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedTransaction(transaction.id);
                                  setIsUploadBillOpen(true);
                                }}
                              >
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
          </Card>
        </TabsContent>

        <TabsContent value="bills">
          <Card>
            <CardHeader>
              <CardTitle>Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill ID</TableHead>
                      <TableHead>Date Uploaded</TableHead>
                      <TableHead>Transaction Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingBills && (
                      [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        </TableRow>
                      ))
                    )}

                    {!isLoadingBills && bills?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No bills uploaded for this party yet
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoadingBills && bills?.map(bill => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            {bill.filename}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(bill.uploadDate).toLocaleDateString()}</TableCell>
                        <TableCell>{bill.transactionReference || "-"}</TableCell>
                        <TableCell className="font-medium text-red-600">
                          ₹{bill.amount?.toFixed(2) || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {transactionType === "CREDIT" ? "Add Credit Entry" : "Record Deposit"}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm 
            partyId={Number(partyId)} 
            type={transactionType}
            onSubmit={(data) => createTransactionMutation.mutate(data)}
            isSubmitting={createTransactionMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Bill Upload Dialog */}
      <Dialog open={isUploadBillOpen} onOpenChange={setIsUploadBillOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Bill</DialogTitle>
          </DialogHeader>
          <BillUpload 
            partyId={Number(partyId)}
            transactionId={selectedTransaction}
            onSubmit={(formData) => uploadBillMutation.mutate({ 
              formData, 
              transactionId: selectedTransaction || undefined
            })}
            isSubmitting={uploadBillMutation.isPending}
            transactions={transactions?.filter(t => 
              t.type === "CREDIT" && !t.billId
            ) || []}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

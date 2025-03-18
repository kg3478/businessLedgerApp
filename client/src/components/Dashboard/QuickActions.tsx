import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, CircleDollarSign, Upload, FileText, BarChart2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PartyForm from "@/components/PartyForm";
import TransactionForm from "@/components/TransactionForm";
import BillUpload from "@/components/BillUpload";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Party, Transaction, TransactionType } from "@shared/schema";

export default function QuickActions() {
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const [isAddCreditOpen, setIsAddCreditOpen] = useState(false);
  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);
  const [isUploadBillOpen, setIsUploadBillOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<number | null>(null);
  
  const { toast } = useToast();

  const { data: parties } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const { data: creditTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/credit-without-bill"],
  });

  const createPartyMutation = useMutation({
    mutationFn: async (partyData: Omit<Party, "id" | "balance">) => {
      const res = await apiRequest("POST", "/api/parties", partyData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      setIsAddPartyOpen(false);
      toast({
        title: "Success",
        description: "Party has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create party: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const res = await apiRequest("POST", "/api/transactions", transactionData);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parties"] });
      if (variables.type === "CREDIT") {
        setIsAddCreditOpen(false);
      } else {
        setIsAddDepositOpen(false);
      }
      toast({
        title: "Success",
        description: `${variables.type === "CREDIT" ? "Credit" : "Deposit"} entry has been created successfully`,
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
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/bills/upload", {
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
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setIsUploadBillOpen(false);
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

  return (
    <>
      <Card>
        <CardHeader className="border-b border-gray-200">
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Button 
            className="w-full flex justify-center items-center"
            onClick={() => setIsAddPartyOpen(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Party
          </Button>
          
          <Button 
            className="w-full flex justify-center items-center"
            variant="outline"
            onClick={() => setIsAddCreditOpen(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Create Credit Entry
          </Button>
          
          <Button 
            className="w-full flex justify-center items-center"
            variant="outline"
            onClick={() => setIsAddDepositOpen(true)}
          >
            <CircleDollarSign className="h-4 w-4 mr-2" />
            Record Deposit
          </Button>
          
          <Button 
            className="w-full flex justify-center items-center"
            variant="outline"
            onClick={() => setIsUploadBillOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Bill
          </Button>
          
          <Button 
            className="w-full flex justify-center items-center"
            variant="outline"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            Generate Reports
          </Button>
        </CardContent>
      </Card>

      {/* Add Party Dialog */}
      <Dialog open={isAddPartyOpen} onOpenChange={setIsAddPartyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Party</DialogTitle>
          </DialogHeader>
          <PartyForm 
            onSubmit={(data) => createPartyMutation.mutate(data)}
            isSubmitting={createPartyMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Add Credit Dialog */}
      <Dialog open={isAddCreditOpen} onOpenChange={setIsAddCreditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Credit Entry</DialogTitle>
          </DialogHeader>
          {parties && parties.length > 0 ? (
            <>
              <div className="py-4">
                <label className="block text-sm font-medium mb-2">Select Party</label>
                <select 
                  className="w-full p-2 border rounded-md" 
                  value={selectedParty || ""}
                  onChange={(e) => setSelectedParty(parseInt(e.target.value))}
                >
                  <option value="" disabled>Select a party</option>
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>
                      {party.name} {party.gstin ? `(${party.gstin})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {selectedParty && (
                <TransactionForm 
                  partyId={selectedParty}
                  type="CREDIT"
                  onSubmit={(data) => createTransactionMutation.mutate(data)}
                  isSubmitting={createTransactionMutation.isPending}
                />
              )}
            </>
          ) : (
            <div className="py-6 text-center text-gray-500">
              Please add a party first before creating a transaction.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Deposit Dialog */}
      <Dialog open={isAddDepositOpen} onOpenChange={setIsAddDepositOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Deposit</DialogTitle>
          </DialogHeader>
          {parties && parties.length > 0 ? (
            <>
              <div className="py-4">
                <label className="block text-sm font-medium mb-2">Select Party</label>
                <select 
                  className="w-full p-2 border rounded-md" 
                  value={selectedParty || ""}
                  onChange={(e) => setSelectedParty(parseInt(e.target.value))}
                >
                  <option value="" disabled>Select a party</option>
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>
                      {party.name} {party.gstin ? `(${party.gstin})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {selectedParty && (
                <TransactionForm 
                  partyId={selectedParty}
                  type="DEPOSIT"
                  onSubmit={(data) => createTransactionMutation.mutate(data)}
                  isSubmitting={createTransactionMutation.isPending}
                />
              )}
            </>
          ) : (
            <div className="py-6 text-center text-gray-500">
              Please add a party first before creating a transaction.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Bill Dialog */}
      <Dialog open={isUploadBillOpen} onOpenChange={setIsUploadBillOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Bill</DialogTitle>
          </DialogHeader>
          {parties && parties.length > 0 ? (
            <>
              <div className="py-4">
                <label className="block text-sm font-medium mb-2">Select Party</label>
                <select 
                  className="w-full p-2 border rounded-md" 
                  value={selectedParty || ""}
                  onChange={(e) => setSelectedParty(parseInt(e.target.value))}
                >
                  <option value="" disabled>Select a party</option>
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>
                      {party.name} {party.gstin ? `(${party.gstin})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {selectedParty && (
                <BillUpload
                  partyId={selectedParty}
                  transactionId={null}
                  transactions={creditTransactions || []}
                  onSubmit={(formData) => uploadBillMutation.mutate(formData)}
                  isSubmitting={uploadBillMutation.isPending}
                />
              )}
            </>
          ) : (
            <div className="py-6 text-center text-gray-500">
              Please add a party first before uploading a bill.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

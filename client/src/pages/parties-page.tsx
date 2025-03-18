import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import PartyForm from "@/components/PartyForm";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Party } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function PartiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const { toast } = useToast();

  const { data: parties, isLoading } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
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

  const filteredParties = parties?.filter((party) => 
    party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    party.gstin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    party.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Parties</h1>
        <Button onClick={() => setIsAddPartyOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Party
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              All Parties
            </h3>
            <div className="w-64">
              <Input 
                placeholder="Search parties..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Party Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Outstanding Balance</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    </TableRow>
                  ))}
                </>
              )}
              
              {!isLoading && filteredParties?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {searchTerm ? "No parties match your search" : "No parties have been added yet"}
                  </TableCell>
                </TableRow>
              )}
              
              {!isLoading && filteredParties?.map(party => (
                <TableRow key={party.id} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell>
                    <Link href={`/parties/${party.id}`} className="text-primary hover:underline">
                      {party.name}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{party.description || '-'}</TableCell>
                  <TableCell>{party.gstin || '-'}</TableCell>
                  <TableCell className={`font-semibold ${party.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{party.balance?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>{party.lastActivityDate ? new Date(party.lastActivityDate).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAddPartyOpen} onOpenChange={setIsAddPartyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Party</DialogTitle>
          </DialogHeader>
          <PartyForm onSubmit={(data) => createPartyMutation.mutate(data)} isSubmitting={createPartyMutation.isPending} />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

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
import { Skeleton } from "@/components/ui/skeleton";
import { Party } from "@shared/schema";

interface TopPartiesProps {
  parties: Party[];
  isLoading: boolean;
}

export default function TopParties({ parties, isLoading }: TopPartiesProps) {
  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <CardTitle>Top Parties by Outstanding Balance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Party Name</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              {!isLoading && parties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No parties added yet
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && parties.map(party => (
                <TableRow key={party.id} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell>
                    <Link 
                      href={`/parties/${party.id}`} 
                      className="text-primary hover:underline font-medium"
                    >
                      {party.name}
                    </Link>
                  </TableCell>
                  <TableCell>{party.gstin || '-'}</TableCell>
                  <TableCell className="font-semibold text-red-600">
                    ₹{party.balance?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    {party.lastActivityDate 
                      ? new Date(party.lastActivityDate).toLocaleDateString()
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 py-3">
        <Link href="/parties" className="ml-auto text-sm font-medium text-primary hover:text-primary/80">
          View all parties <span aria-hidden="true">&rarr;</span>
        </Link>
      </CardFooter>
    </Card>
  );
}

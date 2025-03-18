import { 
  Card, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BarChart4, Users, Receipt } from "lucide-react";

interface OverviewStatsProps {
  totalOutstanding: number;
  totalParties: number;
  recentTransactions: number;
  isLoading: boolean;
}

export default function OverviewStats({
  totalOutstanding,
  totalParties,
  recentTransactions,
  isLoading
}: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-6">
      {/* Current Outstanding Balance Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <BarChart4 className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Outstanding Balance
                </dt>
                <dd className="flex items-baseline">
                  {isLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <div className="text-2xl font-semibold text-gray-900">
                      ₹{totalOutstanding.toFixed(2)}
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-6 py-3">
          <Link href="/parties" className="text-sm font-medium text-primary hover:text-primary/80">
            View all balances <span aria-hidden="true">&rarr;</span>
          </Link>
        </CardFooter>
      </Card>

      {/* Total Parties Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Parties
                </dt>
                <dd className="flex items-baseline">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-semibold text-gray-900">
                      {totalParties}
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-6 py-3">
          <Link href="/parties" className="text-sm font-medium text-primary hover:text-primary/80">
            View all parties <span aria-hidden="true">&rarr;</span>
          </Link>
        </CardFooter>
      </Card>

      {/* Recent Transactions Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
              <Receipt className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Recent Transactions
                </dt>
                <dd className="flex items-baseline">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <div className="text-2xl font-semibold text-gray-900">
                        {recentTransactions}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-gray-600">
                        last 7 days
                      </div>
                    </>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-6 py-3">
          <Link href="/entries" className="text-sm font-medium text-primary hover:text-primary/80">
            View all transactions <span aria-hidden="true">&rarr;</span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

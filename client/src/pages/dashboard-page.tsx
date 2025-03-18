import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/layouts/MainLayout";
import OverviewStats from "@/components/Dashboard/OverviewStats";
import RecentActivity from "@/components/Dashboard/RecentActivity";
import TopParties from "@/components/Dashboard/TopParties";
import QuickActions from "@/components/Dashboard/QuickActions";
import { Party, Transaction } from "@shared/schema";

export default function DashboardPage() {
  const { data: parties, isLoading: isLoadingParties } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/recent"],
  });

  // Calculate dashboard statistics
  const dashboardStats = {
    totalOutstanding: parties?.reduce((sum, party) => sum + (party.balance || 0), 0) || 0,
    totalParties: parties?.length || 0,
    recentTransactions: transactions?.length || 0,
  };

  // Get top parties by outstanding balance
  const topPartiesByBalance = [...(parties || [])]
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 5);

  return (
    <MainLayout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Dashboard content */}
      <div className="py-4">
        {/* Stats cards */}
        <OverviewStats 
          totalOutstanding={dashboardStats.totalOutstanding}
          totalParties={dashboardStats.totalParties}
          recentTransactions={dashboardStats.recentTransactions}
          isLoading={isLoadingParties || isLoadingTransactions}
        />

        {/* Recent Activity Section */}
        <RecentActivity 
          transactions={transactions || []}
          isLoading={isLoadingTransactions}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Parties Section */}
          <div className="lg:col-span-2">
            <TopParties 
              parties={topPartiesByBalance}
              isLoading={isLoadingParties}
            />
          </div>

          {/* Quick Actions Section */}
          <QuickActions />
        </div>
      </div>
    </MainLayout>
  );
}

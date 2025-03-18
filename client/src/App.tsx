import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard-page";
import PartiesPage from "@/pages/parties-page";
import PartyDetailsPage from "@/pages/party-details-page";
import LedgerEntriesPage from "@/pages/ledger-entries-page";
import ActivityLogPage from "@/pages/activity-log-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/parties" component={PartiesPage} />
      <ProtectedRoute path="/parties/:id" component={PartyDetailsPage} />
      <ProtectedRoute path="/entries" component={LedgerEntriesPage} />
      <ProtectedRoute path="/activities" component={ActivityLogPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

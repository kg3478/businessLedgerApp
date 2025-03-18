import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Activity } from "@shared/schema";

export default function ActivityLogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const filteredActivities = activities?.filter((activity) => {
    // Apply search filter
    const searchMatches =
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.entityName?.toLowerCase().includes(searchTerm.toLowerCase());

    // Apply date filters
    const dateMatches =
      (!fromDate || new Date(activity.timestamp) >= fromDate) &&
      (!toDate || new Date(activity.timestamp) <= toDate);

    return searchMatches && dateMatches;
  });

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Activity Log</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              System Activities
            </h3>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64"
              />
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {fromDate ? format(fromDate, "PP") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {toDate ? format(toDate, "PP") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-64" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              {!isLoading && filteredActivities?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {searchTerm || fromDate || toDate
                      ? "No activities match your filters"
                      : "No activities have been recorded yet"}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filteredActivities?.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{activity.performedBy}</TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell>
                      {activity.entityType === "PARTY" && activity.entityId ? (
                        <Link
                          href={`/parties/${activity.entityId}`}
                          className="text-primary hover:underline"
                        >
                          {activity.entityName}
                        </Link>
                      ) : activity.entityType === "TRANSACTION" && activity.entityId ? (
                        <Link
                          href={`/entries`}
                          className="text-primary hover:underline"
                        >
                          {activity.entityName}
                        </Link>
                      ) : (
                        activity.entityName || "-"
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {activity.details || "-"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}

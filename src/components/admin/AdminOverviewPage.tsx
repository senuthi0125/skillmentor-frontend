import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { adminGetAllSessions } from "@/lib/api";
import type { AdminSession } from "@/types";
import { Users, CalendarCheck, CheckCircle, Clock } from "lucide-react";

function normalizeStatus(status?: string | null) {
  return (status ?? "").trim().toLowerCase();
}

export default function AdminOverviewPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    async function load() {
      try {
        setLoading(true);

        if (!isSignedIn) {
          setSessions([]);
          return;
        }

        const data = await adminGetAllSessions(getToken);
        setSessions(Array.isArray(data) ? data : []);
      } catch {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [getToken, isLoaded, isSignedIn]);

  const total = sessions.length;
  const pending = sessions.filter(
    (s) => normalizeStatus(s.paymentStatus) === "pending",
  ).length;
  const confirmed = sessions.filter(
    (s) => normalizeStatus(s.sessionStatus) === "confirmed",
  ).length;
  const completed = sessions.filter(
    (s) => normalizeStatus(s.sessionStatus) === "completed",
  ).length;

  const stats = [
    {
      label: "Total Bookings",
      value: total,
      icon: CalendarCheck,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Awaiting Payment",
      value: pending,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      label: "Confirmed Sessions",
      value: confirmed,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">Admin Overview</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back. Here's what's happening on the platform.
      </p>

      {loading ? (
        <p className="text-muted-foreground">Loading stats...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className={`inline-flex p-3 rounded-lg mb-4 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
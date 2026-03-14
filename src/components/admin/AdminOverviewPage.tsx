import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { adminGetAllSessions } from "@/lib/api";
import type { AdminSession } from "@/types";
import { Users, CalendarCheck, CheckCircle, Clock } from "lucide-react";

export default function AdminOverviewPage() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await getToken({ template: "skillmentor-auth" });
      console.log("ADMIN TOKEN:", token);
      if (!token) return;
      try {
        setSessions(await adminGetAllSessions(token));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  const total     = sessions.length;
  const pending   = sessions.filter((s) => s.paymentStatus === "pending").length;
  const confirmed = sessions.filter((s) => s.sessionStatus === "confirmed").length;
  const completed = sessions.filter((s) => s.sessionStatus === "completed").length;

  const stats = [
    { label: "Total Bookings",     value: total,     icon: CalendarCheck, color: "bg-blue-50 text-blue-600"    },
    { label: "Awaiting Payment",   value: pending,   icon: Clock,         color: "bg-yellow-50 text-yellow-600" },
    { label: "Confirmed Sessions", value: confirmed, icon: Users,         color: "bg-purple-50 text-purple-600" },
    { label: "Completed",          value: completed, icon: CheckCircle,   color: "bg-green-50 text-green-600"   },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">Admin Overview</h1>
      <p className="text-muted-foreground mb-8">Welcome back. Here's what's happening on the platform.</p>
      {loading ? (
        <p className="text-muted-foreground">Loading stats…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className={`inline-flex p-3 rounded-lg mb-4 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
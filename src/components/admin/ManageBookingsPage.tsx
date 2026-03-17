import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  adminGetAllSessions,
  adminConfirmPayment,
  adminMarkComplete,
  adminSetMeetingLink,
} from "@/lib/api";
import type { AdminSession } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Link as LinkIcon,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type SortField = keyof AdminSession | null;
type SortDir = "asc" | "desc";

function statusBadgeClass(status: string) {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "confirmed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function buildFullName(person: any) {
  if (!person) return "";
  if (person.name) return String(person.name).trim();

  const firstName = person.firstName ?? "";
  const lastName = person.lastName ?? "";
  return `${firstName} ${lastName}`.trim();
}

function normalizeSession(raw: any): AdminSession {
  return {
    id: Number(raw?.id ?? 0),
    studentId: raw?.studentId ?? raw?.student?.id,
    mentorId: raw?.mentorId ?? raw?.mentor?.id,
    subjectId: raw?.subjectId ?? raw?.subject?.id,

    studentName:
      raw?.studentName ||
      buildFullName(raw?.student) ||
      raw?.student?.email ||
      "—",

    studentEmail:
      raw?.studentEmail ||
      raw?.student?.email ||
      "",

    mentorName:
      raw?.mentorName ||
      buildFullName(raw?.mentor) ||
      raw?.mentor?.email ||
      "—",

    subjectName:
      raw?.subjectName ||
      raw?.subject?.subjectName ||
      raw?.subject?.name ||
      "—",

    sessionAt:
      raw?.sessionAt ||
      raw?.scheduledAt ||
      "",

    durationMinutes:
      Number(raw?.durationMinutes ?? raw?.duration ?? 0),

    sessionStatus:
      raw?.sessionStatus ||
      raw?.status ||
      "",

    paymentStatus:
      raw?.paymentStatus ||
      raw?.payment?.status ||
      "",

    meetingLink: raw?.meetingLink ?? null,
    sessionNotes: raw?.sessionNotes ?? null,
    studentReview: raw?.studentReview ?? null,
    studentRating:
      raw?.studentRating !== undefined && raw?.studentRating !== null
        ? Number(raw.studentRating)
        : null,
    createdAt: raw?.createdAt ?? "",
  };
}

const PAGE_SIZE = 10;

export default function ManageBookingsPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("sessionAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [meetingDialog, setMeetingDialog] = useState<{ open: boolean; sessionId: number | null }>({
    open: false,
    sessionId: null,
  });
  const [meetingLinkInput, setMeetingLinkInput] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadSessions();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
      setError("You must be signed in.");
    }
  }, [isLoaded, isSignedIn]);

  async function loadSessions() {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken({ template: "skillmentor-auth" });
      if (!token) {
        setError("Authentication token not found.");
        return;
      }

      const data = await adminGetAllSessions(getToken);
      const normalized = Array.isArray(data) ? data.map(normalizeSession) : [];
      setSessions(normalized);
    } catch {
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  function notify(message: string, type: "success" | "error" = "success") {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  }

  async function handleConfirmPayment(id: number) {
    const token = await getToken({ template: "skillmentor-auth" });
    if (!token) {
      notify("Authentication token not found.", "error");
      return;
    }

    setActionLoading(id);
    try {
      const updated = await adminConfirmPayment(getToken, id);
      const normalized = normalizeSession(updated);
      setSessions((prev) => prev.map((s) => (s.id === id ? normalized : s)));
      notify("Payment confirmed successfully.");
    } catch (err: unknown) {
      notify((err as Error).message || "Failed to confirm payment.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkComplete(id: number) {
    const token = await getToken({ template: "skillmentor-auth" });
    if (!token) {
      notify("Authentication token not found.", "error");
      return;
    }

    setActionLoading(id);
    try {
      const updated = await adminMarkComplete(getToken, id);
      const normalized = normalizeSession(updated);
      setSessions((prev) => prev.map((s) => (s.id === id ? normalized : s)));
      notify("Session marked as completed.");
    } catch (err: unknown) {
      notify((err as Error).message || "Failed to mark complete.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSetMeetingLink() {
    if (!meetingDialog.sessionId) return;

    const token = await getToken({ template: "skillmentor-auth" });
    if (!token) {
      notify("Authentication token not found.", "error");
      return;
    }

    setActionLoading(meetingDialog.sessionId);
    try {
      const updated = await adminSetMeetingLink(
        getToken,
        meetingDialog.sessionId,
        meetingLinkInput,
      );
      const normalized = normalizeSession(updated);

      setSessions((prev) =>
        prev.map((s) => (s.id === meetingDialog.sessionId ? normalized : s))
      );
      notify("Meeting link updated.");
      setMeetingDialog({ open: false, sessionId: null });
      setMeetingLinkInput("");
    } catch (err: unknown) {
      notify((err as Error).message || "Failed to set meeting link.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(0);
  }

  const filtered = useMemo(() => {
    let result = sessions;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.studentName?.toLowerCase().includes(q) ||
          s.mentorName?.toLowerCase().includes(q) ||
          s.subjectName?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (s) =>
          s.sessionStatus?.toLowerCase() === statusFilter ||
          s.paymentStatus?.toLowerCase() === statusFilter
      );
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        if (sortField === "id" || sortField === "durationMinutes") {
          const aNum = Number(a[sortField] ?? 0);
          const bNum = Number(b[sortField] ?? 0);
          return sortDir === "asc" ? aNum - bNum : bNum - aNum;
        }

        if (sortField === "sessionAt" || sortField === "createdAt") {
          const aTime = a[sortField] ? new Date(String(a[sortField])).getTime() : 0;
          const bTime = b[sortField] ? new Date(String(b[sortField])).getTime() : 0;
          return sortDir === "asc" ? aTime - bTime : bTime - aTime;
        }

        const cmp = String(a[sortField] ?? "").localeCompare(String(b[sortField] ?? ""));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [sessions, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">Manage Bookings</h1>
      <p className="text-muted-foreground mb-6">View and manage all student session bookings.</p>

      {notification && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student, mentor, subject…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>

        <select
          className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading sessions…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {([
                    { label: "ID", field: "id" as SortField },
                    { label: "Student", field: "studentName" as SortField },
                    { label: "Mentor", field: "mentorName" as SortField },
                    { label: "Subject", field: "subjectName" as SortField },
                    { label: "Date", field: "sessionAt" as SortField },
                    { label: "Duration", field: "durationMinutes" as SortField },
                  ] as const).map(({ label, field }) => (
                    <th
                      key={label}
                      className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-900"
                      onClick={() => handleSort(field)}
                    >
                      <span className="flex items-center gap-1">
                        {label} <SortIcon field={field} />
                      </span>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Payment</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Session</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No sessions found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400">#{s.id}</td>
                      <td className="px-4 py-3 font-medium">{s.studentName || "—"}</td>
                      <td className="px-4 py-3">{s.mentorName || "—"}</td>
                      <td className="px-4 py-3">{s.subjectName || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {s.sessionAt ? new Date(s.sessionAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3">{s.durationMinutes}m</td>
                      <td className="px-4 py-3">
                        <Badge className={statusBadgeClass(s.paymentStatus)}>
                          {s.paymentStatus || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusBadgeClass(s.sessionStatus)}>
                          {s.sessionStatus || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {s.paymentStatus?.toLowerCase() === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50"
                              disabled={actionLoading === s.id}
                              onClick={() => handleConfirmPayment(s.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirm
                            </Button>
                          )}

                          {s.sessionStatus?.toLowerCase() === "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                              disabled={actionLoading === s.id}
                              onClick={() => handleMarkComplete(s.id)}
                            >
                              Complete
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-gray-500"
                            onClick={() => {
                              setMeetingDialog({ open: true, sessionId: s.id });
                              setMeetingLinkInput(s.meetingLink ?? "");
                            }}
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Link
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
              <span className="text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={meetingDialog.open}
        onOpenChange={(open) =>
          setMeetingDialog({ open, sessionId: open ? meetingDialog.sessionId : null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Meeting Link</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <Input
              placeholder="https://meet.google.com/..."
              value={meetingLinkInput}
              onChange={(e) => setMeetingLinkInput(e.target.value)}
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setMeetingDialog({ open: false, sessionId: null })}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetMeetingLink}
                disabled={!meetingLinkInput || actionLoading === meetingDialog.sessionId}
              >
                Save Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
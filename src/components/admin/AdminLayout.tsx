import { useUser } from "@clerk/clerk-react";
import { Link, Outlet, useNavigate, useLocation } from "react-router";
import { useEffect } from "react";
import { LayoutDashboard, Users, BookOpen, CalendarCheck, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Manage Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { label: "Create Mentor", href: "/admin/mentors/create", icon: Users },
  { label: "Create Subject", href: "/admin/subjects/create", icon: BookOpen },
];

export default function AdminLayout() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin =
    String((user?.publicMetadata as { role?: string })?.role || "").toUpperCase() === "ADMIN";

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isAdmin) navigate("/dashboard");
  }, [isLoaded, user, isAdmin, navigate]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Admin Panel</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <Link to="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900">
              <LogOut className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
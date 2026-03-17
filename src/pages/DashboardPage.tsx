import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { CalendarDays, ExternalLink, Star } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import { getMyEnrollments, submitSessionReview } from "@/lib/api";
import type { Enrollment } from "@/types";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function DashboardPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const router = useNavigate();

  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    sessionId: number | null;
  }>({
    open: false,
    sessionId: null,
  });

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewNotification, setReviewNotification] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnrollments() {
      if (!user) return;

      try {
        const token = await getToken();
        console.log("CLERK TOKEN =", token);

        if (!token) return;

        const data = await getMyEnrollments(getToken);
        setEnrollments(data);
      } catch (err) {
        console.error("Failed to fetch enrollments", err);
      }
    }

    if (isLoaded && isSignedIn) {
      fetchEnrollments();
    }
  }, [isLoaded, isSignedIn, getToken, user]);

  async function handleSubmitReview() {
    if (!reviewDialog.sessionId || reviewRating === 0) return;

    try {
      const token = await getToken();
      console.log("CLERK TOKEN =", token);

      if (!token) {
        setReviewNotification("No authentication token found.");
        return;
      }

      setReviewSubmitting(true);

      await submitSessionReview(getToken, reviewDialog.sessionId, {
        rating: reviewRating,
        review: reviewText,
      });

      const data = await getMyEnrollments(getToken);
      setEnrollments(data);

      setReviewNotification("Review submitted successfully!");
      setTimeout(() => {
        setReviewDialog({ open: false, sessionId: null });
        setReviewNotification(null);
        setReviewRating(0);
        setReviewText("");
      }, 1200);
    } catch (err: unknown) {
      setReviewNotification((err as Error).message || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  function openReviewDialog(sessionId: number) {
    setReviewRating(0);
    setReviewText("");
    setReviewNotification(null);
    setReviewDialog({ open: true, sessionId });
  }

  if (!isLoaded) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    router("/login");
    return null;
  }

  if (!enrollments.length) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">My Courses</h1>
        <p className="text-muted-foreground">No courses enrolled yet.</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">My Courses</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {enrollments.map((enrollment) => (
          <div
            key={enrollment.id}
            className="rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col"
          >
            <div className="absolute top-4 right-4">
              <StatusPill status={(enrollment.paymentStatus ?? "pending") as never} />
            </div>

            <div className="size-24 rounded-full bg-white/10 mb-4">
              {enrollment.mentorProfileImageUrl ? (
                <img
                  src={enrollment.mentorProfileImageUrl}
                  alt={enrollment.mentorName ?? "Mentor"}
                  className="w-full h-full rounded-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {(enrollment.mentorName ?? "?").charAt(0)}
                </div>
              )}
            </div>

            <div className="space-y-1 flex-1">
              <h2 className="text-xl font-semibold text-white">
                {enrollment.subjectName ?? "Untitled Subject"}
              </h2>

              <p className="text-blue-100/80">
                Mentor: {enrollment.mentorName ?? "Unknown Mentor"}
              </p>

              <div className="flex items-center text-blue-100/80 text-sm mt-2">
                <CalendarDays className="mr-2 h-4 w-4" />
                {enrollment.sessionAt
                  ? new Date(enrollment.sessionAt).toLocaleDateString()
                  : "No date"}
              </div>

              {enrollment.durationMinutes && (
                <p className="text-blue-100/60 text-xs">
                  Duration: {enrollment.durationMinutes} min
                </p>
              )}
            </div>

            {enrollment.meetingLink && (
              <a
                href={enrollment.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-white underline underline-offset-2 hover:text-blue-100"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Join Session
              </a>
            )}

            {enrollment.sessionStatus === "completed" && (
              <div className="mt-4 pt-4 border-t border-white/20">
                {enrollment.studentRating ? (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (enrollment.studentRating ?? 0)
                            ? "fill-yellow-300 text-yellow-300"
                            : "fill-white/20 text-white/20"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-blue-100 ml-1">Reviewed</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0 w-full"
                    onClick={() => openReviewDialog(enrollment.id)}
                  >
                    Write a Review
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={reviewDialog.open}
        onOpenChange={(open) =>
          setReviewDialog({
            open,
            sessionId: open ? reviewDialog.sessionId : null,
          })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div>
              <p className="text-sm font-medium mb-2">
                Your Rating <span className="text-red-500">*</span>
              </p>

              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                    aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= reviewRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {reviewRating > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewRating]}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Review (optional)</p>
              <Textarea
                placeholder="Share your experience with this mentor…"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>

            {reviewNotification && (
              <p
                className={`text-sm font-medium ${
                  reviewNotification.toLowerCase().includes("success") ||
                  reviewNotification.toLowerCase().includes("submitted")
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {reviewNotification}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setReviewDialog({ open: false, sessionId: null })}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmitReview}
                disabled={reviewRating === 0 || reviewSubmitting}
              >
                {reviewSubmitting ? "Submitting…" : "Submit Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
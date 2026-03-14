import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getMentorProfile } from "@/lib/api";
import type { MentorProfile, SubjectWithEnrollment } from "@/types";
import { SchedulingModal } from "@/components/SchedulingModel";
import { SignupDialog } from "@/components/SignUpDialog";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, BadgeCheck, BookOpen, Building2,
  Calendar, GraduationCap, Star, Users,
} from "lucide-react";

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </span>
  );
}

export default function MentorProfilePage() {
  const { mentorId } = useParams<{ mentorId: string }>();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedulingSubjectId, setSchedulingSubjectId] = useState<number | undefined>();
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!mentorId) return;
    getMentorProfile(Number(mentorId))
      .then(setProfile)
      .catch(() => setError("Could not load mentor profile. Please try again."))
      .finally(() => setLoading(false));
  }, [mentorId]);

  function handleBookSubject(subjectId: number) {
    if (!isSignedIn) { setIsSignupOpen(true); return; }
    setSchedulingSubjectId(subjectId);
    setIsSchedulingOpen(true);
  }

  if (loading) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading mentor profile…</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container py-20 text-center">
        <p className="text-red-500 mb-4">{error ?? "Mentor not found."}</p>
        <Link to="/"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Mentors</Button></Link>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const mentorForModal = {
    ...profile,
    subjects: profile.subjects.map((s) => ({
      id: s.id,
      subjectName: s.subjectName,
      description: s.description,
      courseImageUrl: s.courseImageUrl,
    })),
  };

  return (
    <>
      <div className="container py-10 max-w-5xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Mentors
        </Link>

        {/* Hero */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm mb-8">
          <div className="h-40 bg-gradient-to-br from-blue-600 to-violet-600" />
          <div className="px-8 pb-8 -mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              <div className="size-28 rounded-full border-4 border-white bg-gray-200 overflow-hidden shrink-0 shadow">
                {profile.profileImageUrl ? (
                  <img src={profile.profileImageUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                    {profile.firstName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{fullName}</h1>
                  {profile.isCertified && <BadgeCheck className="h-6 w-6 text-blue-500 shrink-0"/>}
                </div>
                <p className="text-muted-foreground">{profile.title}{profile.company ? ` · ${profile.company}` : ""}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {profile.startYear && (
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Since {profile.startYear}</span>
                  )}
                  {profile.averageRating != null && (
                    <span className="flex items-center gap-1.5">
                      <StarRating rating={profile.averageRating} />
                      <span className="font-medium text-gray-700">{profile.averageRating.toFixed(1)}</span>
                      <span>({profile.reviewCount} review{profile.reviewCount !== 1 ? "s" : ""})</span>
                    </span>
                  )}
                </div>
              </div>
              <Button size="lg" className="bg-black text-white hover:bg-black/90 shrink-0"
                onClick={() => handleBookSubject(profile.subjects[0]?.id)}
                disabled={profile.subjects.length === 0}>
                Schedule a Session
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {profile.bio && (
              <section>
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              </section>
            )}
            <section>
              <h2 className="text-lg font-semibold mb-3">Subjects Taught</h2>
              {profile.subjects.length === 0 ? (
                <p className="text-muted-foreground text-sm">No subjects available yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {profile.subjects.map((subject) => (
                    <SubjectCard key={subject.id} subject={subject} onBook={() => handleBookSubject(subject.id)} />
                  ))}
                </div>
              )}
            </section>
            {profile.recentReviews.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Recent Reviews</h2>
                <div className="space-y-4">
                  {profile.recentReviews.map((review, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{review.reviewerName}</span>
                        <StarRating rating={review.rating} />
                      </div>
                      {review.reviewText && <p className="text-sm text-muted-foreground">{review.reviewText}</p>}
                      <p className="text-xs text-gray-400 mt-2">{new Date(review.sessionDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold mb-4">Stats</h3>
              <div className="space-y-4">
                <Stat icon={<Users className="h-5 w-5 text-blue-500" />} label="Total Students" value={String(profile.totalEnrollments ?? 0)} />
                <Stat icon={<BookOpen className="h-5 w-5 text-violet-500" />} label="Subjects" value={String(profile.subjects.length)} />
                <Stat icon={<GraduationCap className="h-5 w-5 text-green-500" />} label="Experience" value={`${profile.experienceYears} year${profile.experienceYears !== 1 ? "s" : ""}`} />
                {profile.averageRating != null && (
                  <Stat icon={<Star className="h-5 w-5 text-yellow-500" />} label="Avg. Rating" value={`${profile.averageRating.toFixed(1)} / 5`} />
                )}
                {profile.positiveReviews != null && (
                  <Stat icon={<Star className="h-5 w-5 text-orange-400" />} label="Positive Reviews" value={`${profile.positiveReviews}%`} />
                )}
              </div>
            </div>
            {(profile.company || profile.profession) && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold mb-3">Background</h3>
                {profile.profession && <p className="text-sm text-muted-foreground">{profile.profession}</p>}
                {profile.company && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0" /> {profile.company}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <SignupDialog isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
      {profile && isSchedulingOpen && (
        <SchedulingModal isOpen={isSchedulingOpen} onClose={() => setIsSchedulingOpen(false)}
          mentor={mentorForModal} preselectedSubjectId={schedulingSubjectId} />
      )}
    </>
  );
}

function SubjectCard({ subject, onBook }: { subject: SubjectWithEnrollment; onBook: () => void }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {subject.courseImageUrl && (
        <img src={subject.courseImageUrl} alt={subject.subjectName} className="w-full h-32 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      )}
      <div className="p-4">
        <h4 className="font-semibold mb-1">{subject.subjectName}</h4>
        {subject.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{subject.description}</p>}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" /> {subject.enrollmentCount} enrolled
          </span>
          <Button size="sm" onClick={onBook} className="h-7 text-xs">Book Session</Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-sm">{value}</p>
      </div>
    </div>
  );
}
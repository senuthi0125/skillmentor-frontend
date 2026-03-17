export interface Subject {
  id: number;
  subjectName: string;
  description: string;
  courseImageUrl: string;
}

export interface Mentor {
  id: number;
  mentorId: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  profession: string;
  company: string;
  experienceYears: number;
  bio: string;
  profileImageUrl: string;
  positiveReviews: number;
  totalEnrollments: number;
  isCertified: boolean;
  startYear: string;
  subjects: Subject[];
}

export interface SubjectWithEnrollment extends Subject {
  enrollmentCount: number;
}

export interface ReviewSummary {
  reviewerName: string;
  rating: number;
  reviewText: string;
  sessionDate: string;
}

export interface MentorProfile extends Omit<Mentor, "subjects"> {
  subjects: SubjectWithEnrollment[];
  averageRating: number | null;
  reviewCount: number;
  recentReviews: ReviewSummary[];
  createdAt: string;
}

export interface Enrollment {
  id: number;
  mentorName: string;
  mentorProfileImageUrl: string;
  subjectName: string;
  sessionAt: string;
  durationMinutes: number;
  sessionStatus: string;
  paymentStatus: "pending" | "accepted" | "completed" | "cancelled" | "confirmed";
  meetingLink: string | null;
  studentReview: string | null;
  studentRating: number | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AdminSession {
  id: number;
  studentId?: number;
  mentorId?: number;
  subjectId?: number;
  studentName?: string;
  studentEmail?: string;
  mentorName?: string;
  subjectName?: string;
  sessionAt: string;
  durationMinutes: number;
  sessionStatus: string;
  paymentStatus: string;
  meetingLink: string | null;
  sessionNotes?: string | null;
  studentReview?: string | null;
  studentRating?: number | null;
  createdAt: string;
}

export interface CreateMentorPayload {
  mentorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  title?: string;
  profession?: string;
  company?: string;
  experienceYears?: number;
  bio?: string;
  profileImageUrl?: string;
  isCertified?: boolean;
  startYear?: string;
}

export interface CreateSubjectPayload {
  subjectName: string;
  description: string;
  courseImageUrl?: string;
  mentorId: number;
}
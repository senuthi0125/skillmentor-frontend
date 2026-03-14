import type {
  Enrollment,
  Mentor,
  MentorProfile,
  AdminSession,
  CreateMentorPayload,
  CreateSubjectPayload,
} from "@/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

async function fetchWithAuth(
  endpoint: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res;
}

// ── Public mentor endpoints ───────────────────────────────────────────────────

export async function getPublicMentors(
  page = 0,
  size = 10,
): Promise<{ content: Mentor[]; totalElements: number; totalPages: number }> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/mentors?page=${page}&size=${size}`,
  );
  if (!res.ok) throw new Error("Failed to fetch mentors");
  return res.json();
}

export async function getMentorProfile(id: number): Promise<MentorProfile> {
  const res = await fetch(`${API_BASE_URL}/api/v1/mentors/${id}`);
  if (!res.ok) throw new Error("Failed to fetch mentor profile");
  return res.json();
}

// ── Student enrollment endpoints ──────────────────────────────────────────────

export async function enrollInSession(
  token: string,
  data: {
    mentorId: number;
    subjectId: number;
    sessionAt: string;
    durationMinutes?: number;
  },
): Promise<Enrollment> {
  const res = await fetchWithAuth("/api/v1/sessions/enroll", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getMyEnrollments(token: string): Promise<Enrollment[]> {
  const res = await fetchWithAuth("/api/v1/sessions/my-sessions", token);
  return res.json();
}

export async function submitSessionReview(
  token: string,
  sessionId: number,
  data: { rating: number; review: string },
): Promise<Enrollment> {
  const res = await fetchWithAuth(`/api/v1/sessions/${sessionId}/review`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

// ── Admin API ─────────────────────────────────────────────────────────────────

export async function adminGetAllSessions(token: string): Promise<AdminSession[]> {
  const res = await fetchWithAuth("/api/v1/admin/sessions", token);
  return res.json();
}

export async function adminConfirmPayment(token: string, sessionId: number): Promise<AdminSession> {
  const res = await fetchWithAuth(`/api/v1/admin/sessions/${sessionId}/confirm-payment`, token, {
    method: "PATCH",
  });
  return res.json();
}

export async function adminMarkComplete(token: string, sessionId: number): Promise<AdminSession> {
  const res = await fetchWithAuth(`/api/v1/admin/sessions/${sessionId}/complete`, token, {
    method: "PATCH",
  });
  return res.json();
}

export async function adminSetMeetingLink(
  token: string,
  sessionId: number,
  meetingLink: string,
): Promise<AdminSession> {
  const res = await fetchWithAuth(`/api/v1/admin/sessions/${sessionId}/meeting-link`, token, {
    method: "PATCH",
    body: JSON.stringify({ meetingLink }),
  });
  return res.json();
}

export async function adminCreateMentor(token: string, data: CreateMentorPayload): Promise<Mentor> {
  const res = await fetchWithAuth("/api/v1/mentors", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function adminCreateSubject(token: string, data: CreateSubjectPayload): Promise<unknown> {
  const res = await fetchWithAuth("/api/v1/subjects", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}
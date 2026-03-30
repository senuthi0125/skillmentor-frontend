import type {
  Enrollment,
  Mentor,
  AdminSession,
  CreateMentorPayload,
  CreateSubjectPayload,
} from "@/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8081";

type GetTokenFn = (options?: {
  template?: string;
  skipCache?: boolean;
}) => Promise<string | null>;

function buildFullName(obj: any): string {
  if (!obj) return "";

  if (typeof obj.name === "string" && obj.name.trim()) {
    return obj.name.trim();
  }

  const firstName = typeof obj.firstName === "string" ? obj.firstName.trim() : "";
  const lastName = typeof obj.lastName === "string" ? obj.lastName.trim() : "";

  return `${firstName} ${lastName}`.trim();
}

function normalizeAdminSession(raw: any): AdminSession {
  const studentName =
    raw?.studentName ??
    buildFullName(raw?.student) ??
    raw?.student?.email ??
    "";

  const mentorName =
    raw?.mentorName ??
    buildFullName(raw?.mentor) ??
    raw?.mentor?.email ??
    "";

  const subjectName =
    raw?.subjectName ??
    raw?.subject?.subjectName ??
    raw?.subject?.name ??
    "";

  const paymentStatus =
    raw?.paymentStatus ??
    raw?.payment?.status ??
    "";

  const sessionStatus =
    raw?.sessionStatus ??
    raw?.status ??
    "";

  return {
    id: Number(raw?.id ?? 0),
    studentId: raw?.studentId ?? raw?.student?.id ?? undefined,
    mentorId: raw?.mentorId ?? raw?.mentor?.id ?? undefined,
    subjectId: raw?.subjectId ?? raw?.subject?.id ?? undefined,
    studentName,
    studentEmail:
      raw?.studentEmail ??
      raw?.student?.email ??
      "",
    mentorName,
    subjectName,
    sessionAt:
      raw?.sessionAt ??
      raw?.scheduledAt ??
      raw?.dateTime ??
      "",
    durationMinutes: Number(raw?.durationMinutes ?? raw?.duration ?? 0),
    sessionStatus: String(sessionStatus),
    paymentStatus: String(paymentStatus),
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

async function fetchWithAuth(
  endpoint: string,
  getToken: GetTokenFn,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getToken({
    template: "skillmentor-auth",
    skipCache: true,
  });

  if (!token) {
    throw new Error("Authentication token not found. Please sign in again.");
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;

    try {
      const cloned = res.clone();
      const error = await cloned.json();
      message = error.message || error.error || message;
    } catch {
      // ignore parse errors
    }

    if (res.status === 401) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    throw new Error(message);
  }

  return res;
}

// Public
export async function getPublicMentors(
  page = 0,
  size = 10,
): Promise<{ content: Mentor[]; totalElements: number; totalPages: number }> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/mentors?page=${page}&size=${size}`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch mentors");
  }

  return res.json();
}

export async function getMentorProfile(mentorId: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/mentors/${mentorId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch mentor profile");
  }

  return res.json();
}

// Student
export async function enrollInSession(
  getToken: GetTokenFn,
  data: {
    mentorId: number;
    subjectId: number;
    sessionAt: string;
    durationMinutes?: number;
  },
): Promise<Enrollment> {
  const res = await fetchWithAuth("/api/v1/sessions/enroll", getToken, {
    method: "POST",
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function getMyEnrollments(
  getToken: GetTokenFn,
): Promise<Enrollment[]> {
  const res = await fetchWithAuth("/api/v1/sessions/my-sessions", getToken);
  return res.json();
}

export async function submitSessionReview(
  getToken: GetTokenFn,
  sessionId: number,
  data: { rating: number; review: string },
): Promise<void> {
  await fetchWithAuth(`/api/v1/sessions/${sessionId}/review`, getToken, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Admin
export async function adminGetAllSessions(
  getToken: GetTokenFn,
): Promise<AdminSession[]> {
  const res = await fetchWithAuth("/api/v1/sessions", getToken);
  const data = await res.json();

  if (!Array.isArray(data)) return [];
  return data.map(normalizeAdminSession);
}

export async function adminConfirmPayment(
  getToken: GetTokenFn,
  sessionId: number,
): Promise<AdminSession> {
  const res = await fetchWithAuth(
    `/api/v1/sessions/${sessionId}/confirm-payment`,
    getToken,
    {
      method: "PATCH",
    },
  );

  const data = await res.json();
  return normalizeAdminSession(data);
}

export async function adminMarkComplete(
  getToken: GetTokenFn,
  sessionId: number,
): Promise<AdminSession> {
  const res = await fetchWithAuth(
    `/api/v1/sessions/${sessionId}/complete`,
    getToken,
    {
      method: "PATCH",
    },
  );

  const data = await res.json();
  return normalizeAdminSession(data);
}

export async function adminSetMeetingLink(
  getToken: GetTokenFn,
  sessionId: number,
  meetingLink: string,
): Promise<AdminSession> {
  const res = await fetchWithAuth(
    `/api/v1/sessions/${sessionId}/meeting-link`,
    getToken,
    {
      method: "PATCH",
      body: JSON.stringify({ meetingLink }),
    },
  );

  const data = await res.json();
  return normalizeAdminSession(data);
}

export async function adminCreateMentor(
  getToken: GetTokenFn,
  data: CreateMentorPayload,
): Promise<Mentor> {
  const payload = {
    ...data,
    startYear: data.startYear ? String(data.startYear) : undefined,
    experienceYears: data.experienceYears
      ? Number(data.experienceYears)
      : 0,
  };

  const res = await fetchWithAuth("/api/v1/mentors", getToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function adminCreateSubject(
  getToken: GetTokenFn,
  data: CreateSubjectPayload,
): Promise<unknown> {
  const res = await fetchWithAuth("/api/v1/subjects", getToken, {
    method: "POST",
    body: JSON.stringify(data),
  });

  return res.json();
}
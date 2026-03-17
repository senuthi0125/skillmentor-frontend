import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router";
import { adminCreateSubject, getPublicMentors } from "@/lib/api";
import type { Mentor, CreateSubjectPayload } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormErrors { [key: string]: string; }

function validate(data: Partial<CreateSubjectPayload>): FormErrors {
  const errors: FormErrors = {};
  if (!data.subjectName?.trim())               errors.subjectName = "Subject name is required.";
  else if (data.subjectName.trim().length < 5) errors.subjectName = "Subject name must be at least 5 characters.";
  if (!data.description?.trim())               errors.description = "Description is required.";
  if (!data.mentorId)                          errors.mentorId    = "Please select a mentor.";
  return errors;
}

export default function CreateSubjectPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [mentors, setMentors]               = useState<Mentor[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [form, setForm]                     = useState<Partial<CreateSubjectPayload>>({});
  const [errors, setErrors]                 = useState<FormErrors>({});
  const [submitting, setSubmitting]         = useState(false);
  const [notification, setNotification]     = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadMentors() {
      try {
        const data = await getPublicMentors(0, 100);
        setMentors(data.content);
      } catch {
        // silent
      } finally {
        setMentorsLoading(false);
      }
    }
    loadMentors();
  }, []);

  function set(field: keyof CreateSubjectPayload, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  }

  async function handleSubmit() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const token = await getToken({ template: "skillmentor-auth" });
    if (!token) return;
    setSubmitting(true);
    try {
      await adminCreateSubject(getToken, form as CreateSubjectPayload);
      setNotification({ message: "Subject created successfully!", type: "success" });
      setForm({});
      setTimeout(() => navigate("/admin"), 1500);
    } catch (err: unknown) {
      setNotification({ message: (err as Error).message || "Failed to create subject.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedMentor = mentors.find((m) => Number(m.mentorId) === form.mentorId);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Create Subject</h1>
      <p className="text-muted-foreground mb-6">Add a new subject and assign it to a mentor.</p>

      {notification && (
        <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium ${notification.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {notification.message}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Subject Details</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="subjectName">Subject Name <span className="text-red-500">*</span></Label>
            <Input id="subjectName" placeholder="e.g. Introduction to React" value={form.subjectName ?? ""} onChange={(e) => set("subjectName", e.target.value)} />
            {errors.subjectName && <p className="text-xs text-red-500">{errors.subjectName}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Textarea id="description" placeholder="What will students learn in this course?" rows={4} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            <p className="text-xs text-muted-foreground">{(form.description ?? "").length}/500</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="courseImageUrl">Course Image URL</Label>
            <Input id="courseImageUrl" placeholder="https://..." value={form.courseImageUrl ?? ""} onChange={(e) => set("courseImageUrl", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Assign to Mentor <span className="text-red-500">*</span></Label>
            {mentorsLoading ? (
              <p className="text-sm text-muted-foreground">Loading mentors…</p>
            ) : (
              <Select
                value={form.mentorId ? String(form.mentorId) : ""}
                onValueChange={(val) => set("mentorId", Number(val))}
              >
                <SelectTrigger><SelectValue placeholder="Select a mentor…" /></SelectTrigger>
                <SelectContent>
                  {mentors.map((m) => (
                    <SelectItem key={m.id} value={String(m.mentorId)}>
                      {m.firstName} {m.lastName}{m.title ? ` — ${m.title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.mentorId && <p className="text-xs text-red-500">{errors.mentorId}</p>}
          </div>

          {selectedMentor && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
              <div className="size-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                {selectedMentor.profileImageUrl
                  ? <img src={selectedMentor.profileImageUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">{selectedMentor.firstName[0]}</div>
                }
              </div>
              <div>
                <p className="text-sm font-medium">{selectedMentor.firstName} {selectedMentor.lastName}</p>
                <p className="text-xs text-muted-foreground">{selectedMentor.title || selectedMentor.profession}</p>
              </div>
            </div>
          )}

          {form.courseImageUrl && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Image Preview</Label>
              <img
                src={form.courseImageUrl}
                alt="Course"
                className="rounded-lg h-36 w-full object-cover border border-gray-200"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 mt-5">
        <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Creating…" : "Create Subject"}</Button>
        <Button variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
      </div>
    </div>
  );
}
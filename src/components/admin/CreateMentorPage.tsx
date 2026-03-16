import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router";
import { adminCreateMentor } from "@/lib/api";
import type { CreateMentorPayload, Mentor } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, User } from "lucide-react";

interface FormErrors { [key: string]: string; }

function validate(data: Partial<CreateMentorPayload>): FormErrors {
  const errors: FormErrors = {};
  if (!data.mentorId?.trim())  errors.mentorId  = "Clerk User ID is required.";
  if (!data.firstName?.trim()) errors.firstName = "First name is required.";
  if (!data.lastName?.trim())  errors.lastName  = "Last name is required.";
  if (!data.email?.trim())     errors.email     = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address.";
  return errors;
}

export default function CreateMentorPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]             = useState<Partial<CreateMentorPayload>>({ isCertified: false, experienceYears: 0 });
  const [errors, setErrors]         = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [createdMentor, setCreatedMentor] = useState<Mentor | null>(null);

  function set(field: keyof CreateMentorPayload, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  }

  async function handleSubmit() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const token = await getToken({ template: "skillmentor-auth" });
    if (!token) {
      setNotification({ message: "Could not get auth token — check your Clerk JWT template name.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const mentor = await adminCreateMentor(getToken, form as CreateMentorPayload);
      setCreatedMentor(mentor);
      setForm({ isCertified: false, experienceYears: 0 });
      setNotification({ message: "Mentor created successfully!", type: "success" });
    } catch (err: unknown) {
      setNotification({ message: (err as Error).message || "Failed to create mentor.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const previewName    = [form.firstName, form.lastName].filter(Boolean).join(" ") || "Full Name";
  const previewTitle   = form.title || "Title / Role";
  const previewCompany = form.company || "";

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">Create Mentor</h1>
      <p className="text-muted-foreground mb-6">Add a new mentor to the platform.</p>

      {notification && (
        <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium ${
          notification.type === "success"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {notification.message}
          {createdMentor && (
            <span className="ml-2">
              <button className="underline font-semibold" onClick={() => navigate("/")}>View on home page</button>
            </span>
          )}
        </div>
      )}

      <div className="flex gap-8 flex-col lg:flex-row">
        <div className="flex-1 space-y-5">

          {/* Identity */}
          <Card>
            <CardHeader><CardTitle className="text-base">Identity (Clerk)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="mentorId">Clerk User ID <span className="text-red-500">*</span></Label>
                <Input id="mentorId" placeholder="user_2abc..." value={form.mentorId ?? ""} onChange={(e) => set("mentorId", e.target.value)} />
                {errors.mentorId && <p className="text-xs text-red-500">{errors.mentorId}</p>}
                <p className="text-xs text-muted-foreground">The Clerk user ID from the user's account.</p>
              </div>
            </CardContent>
          </Card>

          {/* Personal */}
          <Card>
            <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                  <Input id="firstName" value={form.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                  <Input id="lastName" value={form.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input id="email" type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+1 234 567 8901" value={form.phoneNumber ?? ""} onChange={(e) => set("phoneNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profileImageUrl">Profile Image URL</Label>
                <Input id="profileImageUrl" placeholder="https://..." value={form.profileImageUrl ?? ""} onChange={(e) => set("profileImageUrl", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Professional */}
          <Card>
            <CardHeader><CardTitle className="text-base">Professional Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="e.g. Senior Software Engineer" value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="profession">Profession</Label>
                  <Input id="profession" value={form.profession ?? ""} onChange={(e) => set("profession", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="experienceYears">Years of Experience</Label>
                  <Input id="experienceYears" type="number" min={0} max={60}
                    value={form.experienceYears ?? 0}
                    onChange={(e) => set("experienceYears", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="startYear">Start Year</Label>
                  <Input id="startYear" type="number" min={1970} max={new Date().getFullYear()}
                    value={form.startYear ?? ""}
                    onChange={(e) => set("startYear", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  placeholder="Short description about the mentor…"
                  rows={4}
                  value={form.bio ?? ""}
                  onChange={(e) => set("bio", e.target.value)}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="isCertified" checked={form.isCertified ?? false}
                  onCheckedChange={(checked) => set("isCertified", !!checked)} />
                <Label htmlFor="isCertified" className="cursor-pointer">Certified Mentor</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating…" : "Create Mentor"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:w-72">
          <p className="text-sm font-medium text-muted-foreground mb-3">Preview</p>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-violet-500 to-blue-500" />
            <div className="px-5 pb-5 -mt-10">
              <div className="size-20 rounded-full border-4 border-white bg-gray-200 overflow-hidden mb-3">
                {form.profileImageUrl
                  ? <img src={form.profileImageUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-400"><User className="h-8 w-8" /></div>
                }
              </div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="font-bold text-lg">{previewName}</p>
                {form.isCertified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
              </div>
              <p className="text-sm text-muted-foreground">{previewTitle}</p>
              {previewCompany && <p className="text-sm text-muted-foreground">@ {previewCompany}</p>}
              {form.bio && <p className="text-xs text-gray-500 mt-3 line-clamp-3">{form.bio}</p>}
              <div className="flex gap-3 mt-4 text-xs text-muted-foreground">
                {form.experienceYears ? <span>{form.experienceYears}y exp</span> : null}
                {form.startYear ? <span>Since {form.startYear}</span> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
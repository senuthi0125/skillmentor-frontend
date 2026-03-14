import { useState } from "react";
import { Calendar } from "./ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { useNavigate } from "react-router";
import type { Mentor } from "@/types";

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor;
  preselectedSubjectId?: number;
}

const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

export function SchedulingModal({ isOpen, onClose, mentor, preselectedSubjectId }: SchedulingModalProps) {
  const [date, setDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(
    preselectedSubjectId ?? mentor.subjects[0]?.id,
  );
  const navigate = useNavigate();

  const mentorName = `${mentor.firstName} ${mentor.lastName}`;
  const subject = mentor.subjects.find((s) => s.id === selectedSubjectId) ?? mentor.subjects[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSchedule = () => {
    if (date && selectedTime && subject) {
      const sessionDateTime = new Date(date);
      const [hours, minutes] = selectedTime.split(":");
      sessionDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes));

      const sessionId = `${mentor.id}-${Date.now()}`;
      const searchParams = new URLSearchParams({
        date: sessionDateTime.toISOString(),
        courseTitle: subject?.subjectName ?? "",
        mentorName: mentorName,
        mentorId: String(mentor.id),
        mentorImg: mentor.profileImageUrl ?? "",
        subjectId: String(subject?.id ?? ""),
      });
      navigate(`/payment/${sessionId}?${searchParams.toString()}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-center space-y-0">
          <DialogTitle>Schedule a Session</DialogTitle>
          <DialogDescription className="sr-only">
            Pick a date and time for your mentoring session with {mentorName}.
          </DialogDescription>
        </DialogHeader>

        {/* Mentor info strip */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 mb-2">
          <div className="size-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
            {mentor.profileImageUrl ? (
              <img src={mentor.profileImageUrl} alt={mentorName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                {mentor.firstName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{mentorName}</p>
            <p className="text-xs text-muted-foreground">{mentor.title ?? mentor.profession}</p>
          </div>
        </div>

        {/* Subject selector — only shown if mentor has more than one subject */}
        {mentor.subjects.length > 1 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Select Subject</p>
            <div className="flex flex-wrap gap-2">
              {mentor.subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubjectId(s.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedSubjectId === s.id
                      ? "bg-black text-white border-black"
                      : "border-gray-300 text-gray-700 hover:border-gray-500"
                  }`}
                >
                  {s.subjectName}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Choose a date</h4>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              disabled={(d) => d < today}
            />
          </div>
          <div>
            <h4 className="font-medium mb-2">Choose a time</h4>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSchedule} disabled={!date || !selectedTime || !subject}>
            Continue to Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
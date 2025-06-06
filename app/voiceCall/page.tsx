"use client";
import VoiceCallWidget from "@/components/VoiceCallWidget";
import VoiceCallTimer from "@/components/VoiceCallTimer";

export default function Page() {
  return (
    <div className="w-full h-full max-w-[300px] max-h-[30vh] mx-auto my-8 relative">
      <VoiceCallTimer redirectTo="/problem" durationMinutes={5} />
      <VoiceCallWidget className="w-full h-full" />
    </div>
  );
}
"use client";
import { Room } from "livekit-client";
import React, { useContext } from "react";
import VoiceCallWidget from "@/components/VoiceCallWidget";
import VoiceCallTimer from "@/components/VoiceCallTimer";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import TranscriptionView from "@/components/TranscriptionView";
import { RoomContext } from "@livekit/components-react";

export default function Page() {
  const router = useRouter();
  const room = useContext(RoomContext);

  if (!room) return null;

  return (

      <div className="relative w-screen h-screen bg-black overflow-hidden">
        {/* Timer top left */}
        <div className="absolute top-10 left-10 z-20">
          <VoiceCallTimer redirectTo="/problem" durationMinutes={5} />
        </div>
        {/* Transcription top right */}
        <div className="absolute top-4 right-4 z-20">
          <TranscriptionView />
        </div>
        {/* VoiceCallWidget center */}
        <div className="flex items-center justify-center w-full h-full">
          <div className="max-w-[400px] w-full ">
            <VoiceCallWidget room={room} className="w-full h-full" />
          </div>
        </div>
        {/* Coding round button bottom right */}
        <Button
          className="absolute bottom-4 right-4 z-30 rounded-none border-gray-500 bg-black text-gray-500 hover:text-white hover:bg-blue-500 hover:border-gray-white"
          onClick={() => router.push("/problem")}
        >
          Go to Coding Round
        </Button>
      </div>
  );
}
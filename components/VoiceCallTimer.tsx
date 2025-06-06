"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function VoiceCallTimer({ redirectTo = "/coding-env", durationMinutes = 1 }: { redirectTo?: string; durationMinutes?: number }) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSecondsLeft(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [durationMinutes]);

  useEffect(() => {
    if (secondsLeft === 0) {
      router.push(redirectTo);
    }
  }, [secondsLeft, router, redirectTo]);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        background: "rgba(0,0,0,0.7)",
        color: "#fff",
        padding: "8px 16px",
        borderRadius: "0 0 8px 0",
        fontWeight: 600,
        fontSize: "1.1rem",
        zIndex: 50,
        letterSpacing: "1px",
      }}
      data-testid="voice-call-timer"
    >
      {minutes}:{seconds}
    </div>
  );
} 
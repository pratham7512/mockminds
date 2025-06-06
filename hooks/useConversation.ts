import { useEffect, useState } from "react";
import { ConnectionState, Track, TranscriptionSegment } from "livekit-client";
import { useVoiceAssistant, useLocalParticipant, useTrackTranscription } from "@livekit/components-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function useConversationMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { state, agentTranscriptions } = useVoiceAssistant();
  const localParticipant = useLocalParticipant();

  // Access user transcription data
  const localMessages = useTrackTranscription({
    publication: localParticipant.microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant.localParticipant,
  });

  useEffect(() => {
    if (state === ConnectionState.Disconnected) return;

    const processUserSegments = (segments: TranscriptionSegment[]): Message[] =>
      segments
        .filter((segment) => segment.text.trim() !== "")
        .map((segment) => ({
          role: "user",
          content: segment.final ? segment.text.trim() : `${segment.text.trim()} ...`,
          timestamp: segment.lastReceivedTime,
        }));

    const processAgentTranscriptions = (): Message[] =>
      Object.values(agentTranscriptions)
        .map((transcription) => ({
          role: "assistant",
          content: transcription.text.trim(),
          timestamp: transcription.lastReceivedTime,
        }));

    const mergeAndConcatenateMessages = (messages: Message[]): Message[] => {
      return messages.reduce<Message[]>((acc, msg) => {
        const lastMessage = acc[acc.length - 1];
        if (lastMessage && lastMessage.role === msg.role) {
          // If the current message has the same role as the last, concatenate the content
          lastMessage.content += ` ${msg.content}`;
        } else {
          acc.push(msg);
        }
        return acc;
      }, []);
    };

    const userMessages = processUserSegments(localMessages.segments);
    const assistantMessages = processAgentTranscriptions();

    // Combine and sort messages by timestamp
    const combinedMessages = [...userMessages, ...assistantMessages].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    // Merge subsequent messages with the same role
    setMessages(mergeAndConcatenateMessages(combinedMessages));
  }, [localMessages.segments, agentTranscriptions, state]);

  return messages;
}

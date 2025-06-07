"use client";
import { CloseIcon } from "@/components/CloseIcon";
import { NoAgentNotification } from "@/components/NoAgentNotification";

import {
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect } from "react";
import type { ConnectionDetails } from "@/app/api/connection-details/route";
import React from "react";

const CONNECTION_TIMEOUT_MS = 300 * 60 * 1000; // 30 minutes timeout

export default function VoiceCallWidget({ room, className = "", style = {} }: { room: Room; className?: string; style?: React.CSSProperties }) {
  const [isReconnecting, setIsReconnecting] = React.useState(false);

  const onConnectButtonClicked = useCallback(async () => {
    try {
      let connectionDetailsData: ConnectionDetails;
      const storedDetails = localStorage.getItem('voiceCallConnectionDetails');
      
      if (storedDetails) {
        const { details, timestamp } = JSON.parse(storedDetails);
        const isExpired = Date.now() - timestamp > CONNECTION_TIMEOUT_MS;
        
        if (!isExpired) {
          connectionDetailsData = details;
        } else {
          // Clear expired details
          localStorage.removeItem('voiceCallConnectionDetails');
          throw new Error('Connection details expired');
        }
      } else {
        const url = new URL(
          process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
          window.location.origin
        );
        const response = await fetch(url.toString());
        connectionDetailsData = await response.json();
        
        // Store the new connection details with timestamp
        localStorage.setItem('voiceCallConnectionDetails', JSON.stringify({
          details: connectionDetailsData,
          timestamp: Date.now()
        }));
      }

      await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
      await room.localParticipant.setMicrophoneEnabled(true);
      setIsReconnecting(false);
    } catch (error) {
      console.error('Connection error:', error);
      // Clear stored details if there's an error
      localStorage.removeItem('voiceCallConnectionDetails');
      throw error;
    }
  }, [room]);

  // Add reconnection logic on page load
  useEffect(() => {
    const storedDetails = localStorage.getItem('voiceCallConnectionDetails');
    if (storedDetails) {
      const { timestamp } = JSON.parse(storedDetails);
      const isExpired = Date.now() - timestamp > CONNECTION_TIMEOUT_MS;
      
      if (!isExpired) {
        setIsReconnecting(true);
        onConnectButtonClicked().catch(() => {
          setIsReconnecting(false);
        });
      } else {
        localStorage.removeItem('voiceCallConnectionDetails');
      }
    }
  }, [onConnectButtonClicked]);

  useEffect(() => {
    room.on(RoomEvent.MediaDevicesError, onDeviceFailure);
    room.on(RoomEvent.Disconnected, () => {
      // Clear stored details on disconnect
      //localStorage.removeItem('voiceCallConnectionDetails');
    });

    return () => {
      room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
      room.off(RoomEvent.Disconnected, () => {
        //localStorage.removeItem('voiceCallConnectionDetails');
      });
    };
  }, [room]);

  const handleManualDisconnect = () => {
    room.disconnect();
    localStorage.removeItem('voiceCallConnectionDetails');
  };

  return (
    <div className={className} style={style}>
      <div className="lk-room-container w-full h-full">
        <SimpleVoiceAssistant onConnectButtonClicked={onConnectButtonClicked} onManualDisconnect={handleManualDisconnect} />
      </div>
    </div>
  );
}

function SimpleVoiceAssistant(props: { onConnectButtonClicked: () => void, onManualDisconnect: () => void }) {
  const { state: agentState } = useVoiceAssistant();

  // Automatically connect on mount if disconnected
  useEffect(() => {
    if (agentState === "disconnected") {
      props.onConnectButtonClicked();
    }
    // Only run when agentState changes
  }, [agentState, props]);

  return (
    <>
      <AnimatePresence mode="wait">
        {agentState !== "disconnected" && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex flex-col items-center gap-4 h-full"
          >
            <AgentVisualizer />
            <div className="w-full">
              <ControlBar onConnectButtonClicked={props.onConnectButtonClicked} onManualDisconnect={props.onManualDisconnect} />
            </div>
            <RoomAudioRenderer />
            <NoAgentNotification state={agentState} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AgentVisualizer() {
  const { state: agentState, audioTrack } = useVoiceAssistant();

  return (
    <div className="h-[300px] w-full">
      <BarVisualizer
        state={agentState}
        barCount={5}
        trackRef={audioTrack}
        className="agent-visualizer"
        options={{ minHeight: 24 }}
      />
    </div>
  );
}

function ControlBar(props: { onConnectButtonClicked: () => void, onManualDisconnect: () => void }) {
  const { state: agentState } = useVoiceAssistant();

  return (
    <div className="relative h-[60px]">
      <AnimatePresence>
        {agentState !== "disconnected" && agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0, top: "10px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex h-8 absolute left-1/2 -translate-x-1/2  justify-center"
          >
            <VoiceAssistantControlBar controls={{ leave: false }} />
            <DisconnectButton onClick={props.onManualDisconnect}>
              <CloseIcon />
            </DisconnectButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error: Error) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
} 
import {
    AccessToken,
    AccessTokenOptions,
    VideoGrant,
  } from "livekit-server-sdk";
  import { NextResponse } from "next/server";
  
  // NOTE: you are expected to define the following environment variables in `.env.local`:
  const API_KEY = process.env.LIVEKIT_API_KEY;
  const API_SECRET = process.env.LIVEKIT_API_SECRET;
  const LIVEKIT_URL = process.env.LIVEKIT_URL;
  
  export type ConnectionDetails = {
    serverUrl: string;
    roomName: string;
    participantName: string;
    participantToken: string;
    timestamp: number; // Add timestamp to track token generation time
  };
  
  export async function GET() {
    try {
      if (LIVEKIT_URL === undefined) {
        throw new Error("LIVEKIT_URL is not defined");
      }
      if (API_KEY === undefined) {
        throw new Error("LIVEKIT_API_KEY is not defined");
      }
      if (API_SECRET === undefined) {
        throw new Error("LIVEKIT_API_SECRET is not defined");
      }
  
      // Generate participant token with timestamp for uniqueness
      const timestamp = Date.now();
      const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}_${timestamp}`;
      const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}_${timestamp}`;
      const participantToken = await createParticipantToken(
        { identity: participantIdentity },
        roomName,
      );
  
      // Return connection details
      const data: ConnectionDetails = {
        serverUrl: LIVEKIT_URL,
        roomName,
        participantToken: participantToken,
        participantName: participantIdentity,
        timestamp
      };
      
      // Create response with no-cache headers
      const response = NextResponse.json(data);
      
      // Set cache control headers to prevent caching
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');
      
      return response;
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
        return new NextResponse(error.message, { status: 500 });
      }
    }
  }
  
  function createParticipantToken(
    userInfo: AccessTokenOptions,
    roomName: string
  ) {
    const at = new AccessToken(API_KEY, API_SECRET, {
      ...userInfo,
      ttl: "15m",
    });
    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };
    at.addGrant(grant);
    return at.toJwt();
  }
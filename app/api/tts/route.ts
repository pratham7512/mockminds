import { CartesiaClient } from "@cartesia/cartesia-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const client = new CartesiaClient({ apiKey: process.env.CARTESIA_API_KEY });
  const { text } = await request.json();

  const response = await client.tts.sse({
    modelId: "sonic",
    transcript: text,
    voice: {
      mode: "id",
      id: "b7d50908-b17c-442d-ad8d-810c63997ed9",
      experimentalControls: {
        speed: 'normal',
        emotion: ["anger:lowest"]
      }
    },
    language: "en",
    outputFormat: {
      container: "raw",
      encoding: "pcm_f32le",
      sampleRate: 24000
    }
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const eventData = {
          event: chunk.type === 'done' ? 'done' : 'chunk',
          data: chunk
        };
        const eventString = `data: ${JSON.stringify(eventData)}\n\n`;
        controller.enqueue(encoder.encode(eventString));
        if (chunk.type === 'done') {
          controller.close();
          break;
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
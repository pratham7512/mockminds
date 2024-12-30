// app/api/tts/route.ts
import { CartesiaClient } from "@cartesia/cartesia-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
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
        try {
          for await (const chunk of response) {
            // Format and encode the chunk
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
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
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
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'TTS processing failed' }, { status: 500 });
  }
}
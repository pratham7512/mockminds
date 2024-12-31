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
        'Content-Type': 'audio/mpeg',
        "Transfer-Encoding": "chunked",
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'TTS processing failed' }, { status: 500 });
  }
}

// onFinish: async (message) => {
//   if (message.role !== 'assistant') return;
//   setIsLoading(true);
//   try {
//     const response = await fetch('/api/tts', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ text: message.content }),
//     });

//     if (!response.ok) {
//       throw new Error('Failed to generate speech');
//     }

//     // Create audio stream
//     const audioStream = new ReadableStream({
//       async start(controller) {
//         const reader = response.body!.getReader();
//         const textDecoder = new TextDecoder();

//         try {
//           while (true) {
//             const { done, value } = await reader.read();
//             if (done) break;

//             const text = textDecoder.decode(value);
//             const lines = text.split('\n');

//             for (const line of lines) {
//               if (!line) continue;

//               try {
//                 // Remove the `data: ` prefix
//                 const jsonString = line.replace(/^data:\s*/, '');
//                 const { event, data } = JSON.parse(jsonString);

//                 if (event === 'chunk' && data.data) {
//                   // Convert base64 to Float32Array
//                   const binaryString = atob(data.data);
//                   const audioChunk = new Float32Array(binaryString.length / 4);

//                   for (let i = 0; i < binaryString.length; i += 4) {
//                     const bytes = new Uint8Array(4);
//                     for (let j = 0; j < 4; j++) {
//                       bytes[j] = binaryString.charCodeAt(i + j);
//                     }
//                     const view = new DataView(bytes.buffer);
//                     audioChunk[i / 4] = view.getFloat32(0, true);
//                   }

//                   controller.enqueue(new Uint8Array(audioChunk.buffer));
//                 } else if (event === 'done') {
//                   controller.close();
//                   break;
//                 }
//               } catch (e) {
//                 console.error('Error parsing chunk:', e);
//               }
//             }
//           }
//         } catch (error) {
//           console.error('Stream reading error:', error);
//           controller.error(error);
//         }
//       }
//     });
//     latency.current = Date.now() - start.current;
//     setIsLoading(false)
//     // Play the audio stream
//     player.play(audioStream, () => console.log('Audio playback finished'));

//   } catch (error) {
//     console.error('Error processing audio:', error);
//   }
// }


//use above code in frontend 
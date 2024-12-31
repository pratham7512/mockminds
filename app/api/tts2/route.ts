const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;
if (!CARTESIA_API_KEY) {
  throw new Error("Missing CARTESIA_API_KEY in environment variables");
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    console.time("cartesia request " + (request.headers.get("x-vercel-id") || "local"));

    const voice = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "Cartesia-Version": "2024-06-30",
        "Content-Type": "application/json",
        "X-API-Key": CARTESIA_API_KEY!,
      },
      body: JSON.stringify({
        model_id: "sonic",
        transcript: text,
        voice: {
          mode: "id",
          id: "b7d50908-b17c-442d-ad8d-810c63997ed9",
        },
        output_format: {
          container: "raw",
          encoding: "pcm_f32le",
          sample_rate: 24000,
        },
      }),
    });
    console.timeEnd("cartesia request " + (request.headers.get("x-vercel-id") || "local"));

    if (!voice.ok) {
      console.error(await voice.text());
      return new Response("Voice synthesis failed", { status: 500 });
    }

    console.time("stream " + (request.headers.get("x-vercel-id") || "local"));
    const after = (callback: () => void) => {
      callback();
    };
    after(() => {
      console.timeEnd("stream " + (request.headers.get("x-vercel-id") || "local"));
    });

    return new Response(voice.body, {
      headers: {
        "X-Transcript": encodeURIComponent(text),
        "X-Response": encodeURIComponent(text),
      },
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return new Response("Voice synthesis failed", { status: 500 });
  }
}


// onFinish: async (message) => {
//   if (message.role !== 'assistant') return;
//   setIsLoading(true);
//   try {
//     const response = await fetch('/api/tts2', {
//         method: 'POST',
//         body: JSON.stringify({ text: message.content }),
//       });
    
//         if (!response.ok) {
//             throw new Error('Failed to generate speech');
//         }
//         latency.current = Date.now() - start.current;
//         setIsLoading(false)
//         player.play(response.body!, () => console.log('Audio playback finished'));
//         } catch (error) {
//             console.error('Error processing audio:', error);
//         }
        
//       }

//use this in frontend to access this endpoint
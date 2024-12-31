"use client";
import { v4 as uuidv4 } from 'uuid';
import { Button } from './ui/button';
import { useChat } from "ai/react";
import { useRef, useEffect, useState, useMemo } from "react";
import AlertDial from './alert';  
import { usePlayer } from '@/lib/usePlayer';
import { CartesiaClient } from "@cartesia/cartesia-js";

export default function Chat() {
  const player=usePlayer()
  const latency = useRef<number>(0);
  const start=useRef<number>(0)
  const [isLoading, setIsLoading]= useState(false);

  const client = useMemo(() => new CartesiaClient({ 
    apiKey: process.env.NEXT_PUBLIC_CARTESIA_API_KEY 
  }), []);

  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    onFinish: async (message) => {
      if (message.role !== 'assistant') return;
      setIsLoading(true);
      start.current = Date.now();

      try {
        const response = await client.tts.sse({
          modelId: "sonic",
          transcript: message.content,
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

        // Convert SSE stream to audio stream
        const audioStream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of response) {
                if (chunk.type === 'chunk' && chunk.data) {
                  // Convert base64 to binary
                  const binaryString = atob(chunk.data);
                  const audioChunk = new Float32Array(binaryString.length / 4);
                  
                  // Properly reconstruct float32 values
                  for (let i = 0; i < binaryString.length; i += 4) {
                    const bytes = new Uint8Array(4);
                    for (let j = 0; j < 4; j++) {
                      bytes[j] = binaryString.charCodeAt(i + j);
                    }
                    const view = new DataView(bytes.buffer);
                    audioChunk[i / 4] = view.getFloat32(0, true); // true for little-endian
                  }
                  
                  controller.enqueue(new Uint8Array(audioChunk.buffer));
                }
                if (chunk.type === 'done') {
                  controller.close();
                  break;
                }
              }
            } catch (error) {
              controller.error(error);
              console.error('Stream processing error:', error);
            }
          }
        });
        latency.current = Date.now() - start.current;
        setIsLoading(false);
        player.play(audioStream, () => console.log('Playback finished'));

      } catch (error) {
        console.error('TTS error:', error);
        setIsLoading(false);
      }
    }
  });

  
  const messagesEndRef = useRef<HTMLDivElement>(null); // Specify the type as HTMLDivElement


  
  // Automatically scroll to the bottom when a new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);


  const newChat = () => {
    setMessages(prevMessages => {
        // Create a new array with the new message as the first element
        prevMessages=[{id:"1",content:"", role:"system", data:uuidv4()}];
        // Return the updated messages array
        return prevMessages;
    });
  };
  useEffect(newChat,[]);


  return (
    <>
    <AlertDial><Button className="ml-8 absolute bg-red-700 z-10 hover:bg-red-700 hover:text-white">end interview</Button></AlertDial>  
    <div className="flex-grow overflow-y-auto custom-scrollbar h-[calc(100vh-200px)]">
    <div className="mx-auto w-full max-w-xl pb-24 flex flex-col text-white">
      <div>
        {messages.length > 1
          ? messages.map((m) => (
              <div key={m.id} className="mb-4">
                {m.content && (<div
                  className={`flex ${
                    m.role === "user"
                      ? "text-white justify-end"
                      : "text-muted-foreground justify-start"
                  } `}
                >
                
                  <div className={`${
                    m.role === "user" ? "bg-muted p-2 px-4" : ""
                  }`}>
                    {m.content}
                  </div>
                </div>)}
                <br></br>
              </div>
            ))
          :(
            <div className="absolute inset-0 z-0 flex items-center justify-center">
              <h1 className="text-6xl font-medium text-muted-foreground opacity-20">
                mockminds
              </h1>
            </div>
      )}
      <div ref={messagesEndRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); start.current=Date.now(), setIsLoading(true); handleSubmit(e); }} className="flex-shrink-0">
      {messages.length>2&&<div className="text-sm text-green-500 font-mono">{isLoading ? "latency: calculating..." : `latency: ${latency.current} ms`}</div>}
        <input
          className="fixed w-full max-w-xl bottom-0 mb-8 p-3 focus:outline-none bg-background rounded-none border border-muted placeholder:text-muted-foreground"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
    </div>
    </>
  );
}

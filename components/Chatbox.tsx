"use client";
import { v4 as uuidv4 } from 'uuid';
import { Button } from './ui/button';
import { useChat } from "ai/react";
import { useRef, useEffect } from "react";
import AlertDial from './alert';  
import { createAudioStreamFromText } from '@/actions/tts';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    onFinish: async (message) => {
      if (message.role !== 'assistant') return;
  
      try {
        // Split message into sentences more efficiently
        const sentences = message.content
          .split(/([.!?]+\s+)/)
          .filter(Boolean)
          .map(sentence => sentence.trim())
          .filter(sentence => sentence.length > 0);
  
        // Create and play audio streams concurrently
        await playMessageAudio(sentences);
      } catch (error) {
        console.error('Error processing audio:', error);
      }
    },
  });
  
  // Separate audio processing logic
  const playMessageAudio = async (sentences: string[]) => {
    try {
      // Create audio streams concurrently
      const audioPromises = sentences.map(async (sentence) => {
        const stream = await createAudioStreamFromText(sentence);
        return createAudioElement(stream);
      });
  
      // Wait for all audio elements to be created
      const audioElements = await Promise.all(audioPromises);
  
      // Play audio sequentially
      for (const audio of audioElements) {
        await playAudio(audio);
        // Cleanup
        URL.revokeObjectURL(audio.src);
      }
    } catch (error) {
      console.error('Error in audio playback:', error);
    }
  };
  
  // Helper function to create audio element
  const createAudioElement = (stream: ArrayBuffer): HTMLAudioElement => {
    const audio = new Audio();
    const uint8Array = new Uint8Array(stream);
    const blob = new Blob([uint8Array], { type: 'audio/mpeg' });
    audio.src = URL.createObjectURL(blob);
    return audio;
  };
  
  // Promise-based audio playback
  const playAudio = (audio: HTMLAudioElement): Promise<void> => {
    return new Promise((resolve) => {
      audio.onended = () => resolve();
      audio.play().catch(error => {
        console.error('Audio playback failed:', error);
        resolve();
      });
    });
  };
  
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
      <form onSubmit={handleSubmit} className="flex-shrink-0">
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

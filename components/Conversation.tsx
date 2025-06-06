import { useEffect, useCallback } from 'react';
import { useConversationMessages } from "@/hooks/useConversation";
import { saveChat } from '@/actions/saveChat';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

export default function Conversation() {
  const messages = useConversationMessages();
  const { data: session } = useSession();
  
  // Generate a stable chatId for this conversation session
  const chatId = useCallback(() => {
    const existingChatId = sessionStorage.getItem('currentChatId');
    if (existingChatId) return existingChatId;
    
    const newChatId = uuidv4();
    sessionStorage.setItem('currentChatId', newChatId);
    return newChatId;
  }, []);

  useEffect(() => {
    // Save messages to localStorage whenever they change
    if (messages.length > 0) {
      localStorage.setItem('conversationMessages', JSON.stringify(messages));
      
      // Save to database if user is authenticated and has an ID
      const userId = (session?.user as any)?.id;
      if (userId) {
        saveChat({
          chatid: chatId(),
          userId: userId,
          messages: messages
        });
      }
    }
  }, [messages, session?.user, chatId]); 

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Clear the chatId from sessionStorage when conversation ends
      sessionStorage.removeItem('currentChatId');
    };
  }, []);

  return (
    <div className="p-4">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`mb-4 p-3 rounded-lg ${
            msg.role === "assistant" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
          }`}
        >
          <span className="font-bold">{msg.role === "assistant" ? "AI: " : "You: "}</span>
          {msg.content}
        </div>
      ))}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface Evaluation {
  completeness: number;
  clarity: number;
  technical_accuracy: number;
}

export default function FeedbackPage() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [referenceAnswers, setReferenceAnswers] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<(Evaluation | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    const savedMessages = localStorage.getItem("conversationMessages");
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      setMessages(parsedMessages);
      setEvaluations(new Array(parsedMessages.length).fill(null));
    }
  }, []);

  useEffect(() => {
    async function fetchReferenceAnswers() {
      if (messages.length === 0) return;

      const answers = new Array(messages.length).fill("");
      setReferenceAnswers(answers);

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (message.role === "assistant") {
          try {
            // Fetch reference answer
            const response = await fetch("/api/feed", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ messages: [message] }),
            });

            if (response.ok) {
              const result = await response.json();
              answers[i] = result.result;
              setReferenceAnswers([...answers]);

              // Check for subsequent user answer
              const nextMessage = messages[i + 1];
              if (nextMessage?.role === "user") {
                // Fetch evaluation
                try {
                  const evalResponse = await fetch(
                    "https://mockminds-feedback.onrender.com/evaluate-feedback",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        question: message.content,
                        user_answer: nextMessage.content,
                        reference_answer: result.result,
                      }),
                    }
                  );

                  if (evalResponse.ok) {
                    const evalData = await evalResponse.json();
                    setEvaluations(prev => {
                      const newEvals = [...prev];
                      newEvals[i] = evalData;
                      return newEvals;
                    });
                  }
                } catch (error) {
                  console.error("Evaluation fetch error:", error);
                }
              }
            }
          } catch (error) {
            answers[i] = "Error fetching reference answer";
            setReferenceAnswers([...answers]);
          }

          await delay(1000); // 1 second delay between requests
        }
      }
    }

    fetchReferenceAnswers();
  }, [messages]);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Conversation Feedback</CardTitle>
          <p className="text-gray-600">Review your conversation and feedback</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Conversation History</h3>
              <div className="space-y-3">
                {messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div key={index}>
                      <div
                        className={`p-4 rounded-lg ${
                          message.role === "user" ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {message.role === "user" ? "You" : "Assistant"}
                        </p>
                        <p className="">{message.content}</p>
                      </div>
                      {message.role === "assistant" && (
                        <>
                          <div className="mt-2 bg-green-900 p-4 rounded-lg">
                            <p className="text-sm font-medium text-white">Reference Answer:</p>
                            <p className="text-gray-100">
                              {referenceAnswers[index] || "Loading reference answer..."}
                            </p>
                          </div>
                          {evaluations[index] && (
                            <div className="mt-2 bg-purple-900 p-4 rounded-lg">
                              <p className="text-sm font-medium text-white">Evaluation:</p>
                              <div className="text-gray-100 space-y-1">
                                <p>Completeness: {evaluations[index]?.completeness}</p>
                                <p>Clarity: {evaluations[index]?.clarity}</p>
                                <p>Technical Accuracy: {evaluations[index]?.technical_accuracy}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No conversation history found</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"use client"
import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Pen, Eraser, Send, X} from 'lucide-react'
import CodeEditor from '@uiw/react-textarea-code-editor'
import { Appbar } from './Appbar'
import { useChat } from "ai/react";
import { v4 as uuidv4 } from 'uuid';
import MarkdownPreview from '@uiw/react-markdown-preview';
import VoiceCallWidget from './VoiceCallWidget'



export default function Component() {
  const [mode, setMode] = useState('code')
  const [language, setLanguage] = useState('javascript')
  const [drawTool, setDrawTool] = useState('pen')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [codeContent, setCodeContent] = useState<{ [key: string]: string }>({})
  const [textContent, setTextContent] = useState('')

  const languages = ['javascript', 'python', 'java', 'cpp', 'sql', 'typescript']

  const { messages, input, handleInputChange, handleSubmit,setMessages,append} = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null); // Specify the type as HTMLDivElement

  const base_problem_generation = `
    You are an AI acting as an interviewer for a big-tech company, tasked with generating a clear, well-structured problem statement. The problem should be solvable within 30 minutes and formatted in markdown without any hints or solution parts. Ensure the problem:
    - Is reviewed by multiple experienced interviewers for clarity, relevance, and accuracy.
    - Includes necessary constraints and examples to aid understanding without leading to a specific solution.
    - Don't provide any detailed requirements or constraints or anything that can lead to the solution, let candidate ask about them.
    - Allows for responses in text or speech form only; do not expect diagrams or charts.
    - Maintains an open-ended nature if necessary to encourage candidate exploration.
    - Do not include any hints or parts of the solution in the problem statement.
    - Provide necessary constraints and examples to aid understanding without leading the candidate toward any specific solution.
    - Return only the problem statement in markdown format; refrain from adding any extraneous comments or annotations that are not directly related to the problem itself.
    The type of interview you are generating a problem for is a coding interview. Focus on:
    - Testing the candidate's ability to solve real-world coding, algorithmic, and data structure challenges efficiently.
    - Assessing problem-solving skills, technical proficiency, code quality, and the ability to handle edge cases.
    - Avoiding explicit hints about complexity or edge cases to ensure the candidate demonstrates their ability to infer and handle these on their own.
  `

  const base_interviewer = `
      You are an AI conducting an interview. Your role is to manage the interview effectively by:
      - Understanding the candidate’s intent, especially when using voice recognition which may introduce errors.
      - Asking follow-up questions to clarify any doubts without leading the candidate.
      - Focusing on collecting and questioning about the candidate’s formulas, code, or comments.
      - Avoiding assistance in problem-solving; maintain a professional demeanor that encourages independent candidate exploration.
      - Probing deeper into important parts of the candidate's solution and challenging assumptions to evaluate alternatives.
      - Providing replies every time, using concise responses focused on guiding rather than solving.
      - Ensuring the interview flows smoothly, avoiding repetitions or direct hints, and steering clear of unproductive tangents.

      - You can make some notes that is not visible to the candidate but can be useful for you or for the feedback after the interview, return it after the #NOTES# delimiter:
      "<You message here> - visible for the candidate, never leave it empty
      #NOTES#
      <You message here>"
      - Make notes when you encounter: mistakes, bugs, incorrect statements, missed important aspects, any other observations.
      - There should be no other delimiters in your response. Only #NOTES# is a valid delimiter, everything else will be treated just like text.

      - Your visible messages will be read out loud to the candidate.
      - Use mostly plain text, avoid markdown and complex formatting, unless necessary avoid code and formulas in the visible messages.
      - Use '\n\n' to split your message in short logical parts, so it will be easier to read for the candidate.

      - You should direct the interview strictly rather than helping the candidate solve the problem.
      - Be very concise in your responses. Allow the candidate to lead the discussion, ensuring they speak more than you do.
      - Never repeat, rephrase, or summarize candidate responses. Never provide feedback during the interview.
      - Never repeat your questions or ask the same question in a different way if the candidate already answered it.
      - Never give away the solution or any part of it. Never give direct hints or part of the correct answer.
      - Never assume anything the candidate has not explicitly stated.
      - When appropriate, challenge the candidate's assumptions or solutions, forcing them to evaluate alternatives and trade-offs.
      - Try to dig deeper into the most important parts of the candidate's solution by asking questions about different parts of the solution.
      - Make sure the candidate explored all areas of the problem and provides a comprehensive solution. If not, ask about the missing parts.
      - If the candidate asks appropriate questions about data not mentioned in the problem statement (e.g., scale of the service, time/latency requirements, nature of the problem, etc.), you can make reasonable assumptions and provide this information.
      You are conducting a coding interview. Ensure to:
      - Initially ask the candidate to propose a solution in a theoretical manner before coding.
      - Probe their problem-solving approach, choice of algorithms, and handling of edge cases and potential errors.
      - Allow them to code after discussing their initial approach, observing their coding practices and solution structuring.
      - Guide candidates subtly if they deviate or get stuck, without giving away solutions.
      - After coding, discuss the time and space complexity of their solutions.
      - Encourage them to walk through test cases, including edge cases.
      - Ask how they would adapt their solution if problem parameters changed.
      - Avoid any direct hints or solutions; focus on guiding the candidate through questioning and listening.
      - If you found any errors or bugs in the code, don't point on them directly, and let the candidate find and debug them.
      - Actively listen and adapt your questions based on the candidate's responses. Avoid repeating or summarizing the candidate's responses.
    `
  const topics = [
    "Arrays",
    "Strings",
    "Linked Lists",
    "Hash Tables",
    "Dynamic Programming",
    "Trees",
    "Graphs",
    "Sorting Algorithms",
    "Binary Search",
    "Recursion",
    "Greedy Algorithms",
    "Stack",
    "Queue",
    "Heaps",
    "Depth-First Search (DFS)",
    "Breadth-First Search (BFS)",
    "Backtracking",
    "Bit Manipulation",
    "Binary Search Trees",
    "Tries",
  ];
  
  const generateProblem = async (type="coding", difficulty="medium", requirements="") => {
    const randomTopic =await  topics[Math.floor(Math.random() * topics.length)];
    const instructPrompt = `Create a ${type} problem. Difficulty: ${difficulty}. Topic: ${randomTopic}. Additional requirements: ${requirements}.`;
    append({
      id: "-1",
      content: base_problem_generation + instructPrompt,
      role: 'system'
    });
  };
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen]); // Add chatOpen to dependencies

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1
      }
    }
  }, [])

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.beginPath()
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx && canvas) {
      ctx.strokeStyle = 'white'
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (drawTool === 'pen') {
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y)
      } else {
        ctx.clearRect(x - 10, y - 10, 20, 20)
      }
    }
  }

  const [code, setCode] = useState(
    `function add(a, b) {\n  return a + b;\n}`
  );

  useEffect(() => {
    switch (language) {
      case 'javascript':
        setCode(`function add(a, b) {\n  return a + b;\n}`);
        break;
      case 'python':
        setCode(`def add(a, b):\n    return a + b`);
        break;
      case 'java':
        setCode(`public class Main {\n    public static int add(int a, int b) {\n        return a + b;\n    }\n\n    public static void main(String[] args) {\n        // Your code here\n    }\n}`);
        break;
      case 'cpp':
        setCode(`#include <iostream>\n\nint add(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    // Your code here\n    return 0;\n}`);
        break;
      case 'typescript':
        setCode(`function add(a: number, b: number): number {\n  return a + b;\n}`);
        break;
      case 'sql':
        setCode(`CREATE FUNCTION add(a INT, b INT)\nRETURNS INT\nBEGIN\n  RETURN a + b;\nEND;`);
        break;
      default:
        setCode(`// Start coding here`);
    }
  }, [language]);



  const setBaseInterviewer = () => {
    setMessages(prevMessages => {
      if (prevMessages.length > 0) {
        
        return [
          { ...prevMessages[0], content: base_interviewer },
          ...prevMessages.slice(1)
        ];
      }
      return prevMessages;
    });
  };

  const initializeInterview = async () => {
    await new Promise(resolve => {
      setMessages(prevMessages => {
        prevMessages = [{ id: "-1", content: "", role: "system", data: uuidv4() }];
        resolve(null);
        return prevMessages;
      });
    });
    await generateProblem('coding', 'medium', '');
    setBaseInterviewer();
  };

  useEffect(() => {
    initializeInterview();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-white">
      <Appbar/>

      {/* Main content */}
      <div className="flex-1 pb-4 flex space-x-10 overflow-hidden mx-10">
        {/* Problem Statement Area */}
        <Card className="w-2/5 overflow-hidden bg-background border-muted ">
          <CardContent className="p-0 h-full">
            <div className="h-full overflow-y-auto p-4">
              <div className="prose prose-invert">
              <MarkdownPreview source={messages.length > 2 ? messages[2].content : 'Loading...'} style={{ backgroundColor: "#09090b",fontSize: '0.95rem'}} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coding Area */}
        <Card className="w-3/5 overflow-hidden bg-background border-muted">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {mode === 'code' && (
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-[180px] bg-border text-white border-border">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {mode === 'draw' && (
                  <ToggleGroup type="single" value={drawTool} onValueChange={(value) => value && setDrawTool(value)}>
                    <ToggleGroupItem value="pen" className="data-[state=on]:bg-white data-[state=on]:text-black">
                      <Pen className="w-4 h-4 mr-2" />
                      Pen
                    </ToggleGroupItem>
                    <ToggleGroupItem value="eraser" className="data-[state=on]:bg-white data-[state=on]:text-black">
                      <Eraser className="w-4 h-4 mr-2" />
                      Eraser
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
              </div>
              <ToggleGroup type="single" value={mode} onValueChange={(value) => value && setMode(value)}>
                <ToggleGroupItem value="code" className="data-[state=on]:bg-white data-[state=on]:text-black">Code</ToggleGroupItem>
                <ToggleGroupItem value="text" className="data-[state=on]:bg-white data-[state=on]:text-black">Text</ToggleGroupItem>
                <ToggleGroupItem value="draw" className="data-[state=on]:bg-white data-[state=on]:text-black">Draw</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex-1 p-4 relative overflow-hidden">
              {mode === 'code' && (
                <div className="overflow-y-auto h-full bg-background rounded-xl">
                    <CodeEditor
                      value={code}
                      language={language}
                      minHeight={200}
                      maxLength={300}
                      placeholder="Please enter JS code."
                      onChange={(evn) => setCode(evn.target.value)}
                      padding={15}
                      style={{
                        backgroundColor: "#09090b",
                        fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                        fontSize: "15px"
                      }}
                    />
                </div>
              )}
              {mode === 'text' && (
                <Textarea
                  className="w-full h-full p-5 bg-background text-white"
                  placeholder="Write your text here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                />
              )}
              {mode === 'draw' && (
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={400}
                  className="w-full h-full bg-background focus:outline-none rounded cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  onMouseMove={draw}
                />
              )}
            </div>
            <div className="w-full h-full max-w-[300px] max-h-[30vh] mx-auto my-8">
              <VoiceCallWidget className="w-full h-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Button Bar */}
      <div className="flex justify-end p-1 px-6 bg-background">
        <button className="mx-4 my-2 px-3 pt-1 pb-2 rounded-lg text-center bg-white font-medium text-black hover:bg-gray-300">restart</button>
        <button className="mx-4 my-2 px-3 pt-1 pb-2 rounded-lg text-center bg-white font-medium text-black hover:bg-gray-300">submit</button>
      </div>
    </div>
  )
}
import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';
import { base_problem_generation } from '@/lib/prompts';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { topic, base_prompt } = await req.json();
    
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: base_prompt || base_problem_generation
        },
        {
          role: "user",
          content: topic
        }
      ],
      model: "mistral-saba-24b",
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null
    });

    const problem = chatCompletion.choices[0]?.message?.content || '';

    return NextResponse.json({ problem }, { status: 200 });
  } catch (error) {
    console.error('Error generating problem:', error);
    return NextResponse.json(
      { error: 'Failed to generate problem' },
      { status: 500 }
    );
  }
}
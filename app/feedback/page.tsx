"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, MessageSquare, TrendingUp } from "lucide-react"

interface FeedbackData {
  clarity: number
  relevance: number
  technicalAccuracy: number
  communication: number
  overallScore: number
  strengths: string[]
  areasForImprovement: string[]
  detailedFeedback: string
}

export default function InterviewFeedback() {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch("https://mockmindsnode.onrender.com/dummy-feedback")
        if (!response.ok) {
          throw new Error("Failed to fetch feedback")
        }
        const data = await response.json()
        setFeedback(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchFeedback()
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-400"
    if (score >= 6) return "text-amber-400"
    return "text-red-400"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 8) return "default"
    if (score >= 6) return "secondary"
    return "destructive"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading feedback...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">Error: {error}</p>
        </div>
      </div>
    )
  }

  if (!feedback) return null

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold text-white mb-3">Interview Feedback</h1>
          <p className="text-lg text-gray-400">Performance analysis and recommendations</p>
        </div>

        <div className="space-y-8">
          {/* Overall Score */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Overall Score</span>
                </div>
                <div className="text-5xl font-bold mb-6">
                  <span className={getScoreColor(feedback.overallScore)}>{feedback.overallScore}</span>
                  <span className="text-xl text-gray-500 ml-1">/10</span>
                </div>
                <Progress value={feedback.overallScore * 10} className="w-full max-w-sm mx-auto h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-white">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: "Clarity", score: feedback.clarity },
                { label: "Relevance", score: feedback.relevance },
                { label: "Technical Accuracy", score: feedback.technicalAccuracy },
                { label: "Communication", score: feedback.communication },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="font-medium text-gray-200">{item.label}</span>
                  <div className="flex items-center gap-4">
                    <Progress value={item.score * 10} className="w-32 h-2" />
                    <Badge variant={getScoreBadgeVariant(item.score)} className="min-w-[3rem] font-medium">
                      {item.score}/10
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Strengths */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-white">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2.5 flex-shrink-0"></div>
                      <span className="text-gray-300 leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-white">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {feedback.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2.5 flex-shrink-0"></div>
                      <span className="text-gray-300 leading-relaxed">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Feedback */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                Detailed Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed text-base">{feedback.detailedFeedback}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import React, { useEffect, useState } from 'react'
import { MockInterview } from '@/utils/schema'
import { db } from '@/utils/db'
import { eq } from 'drizzle-orm'
import QuestionSection from './_components/QuestionSection'
import RecordAnswer from './_components/RecordAnswer'
import Feedback from './_components/Feedback'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useParams } from 'next/navigation'

const StartInterview = () => {
  const params = useParams();
  const interviewId = params.interview;
  
  const [interviewData, setInterviewData] = useState(null);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (interviewId) {
      getInterviewDetails();
    }
  }, [interviewId]);

  const getInterviewDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching interview with ID:", interviewId);
      
      const result = await db.select().from(MockInterview)
        .where(eq(MockInterview.mockId, interviewId));
      
      if (result && result.length > 0) {
        setInterviewData(result[0]);
        console.log("Raw interview data:", result[0]);
        
        // Parse the JSON questions with improved error handling
        try {
          let parsedQuestions;
          const jsonString = result[0].jsonMockResp;
          
          // Try different parsing approaches
          try {
            // First attempt - direct parse
            parsedQuestions = JSON.parse(jsonString);
            console.log("Successfully parsed JSON directly:", parsedQuestions);
          } catch (e) {
            console.log("First parse attempt failed, trying to clean the string");
            // Second attempt - try to extract JSON if it's wrapped in markdown code blocks
            if (jsonString.includes("```json")) {
              const jsonContent = jsonString.split("```json")[1].split("```")[0].trim();
              parsedQuestions = JSON.parse(jsonContent);
              console.log("Parsed JSON from markdown code block:", parsedQuestions);
            } else if (jsonString.includes("```")) {
              const jsonContent = jsonString.split("```")[1].split("```")[0].trim();
              parsedQuestions = JSON.parse(jsonContent);
              console.log("Parsed JSON from generic code block:", parsedQuestions);
            } else {
              // Try to find any JSON-like structure in the string
              const possibleJson = jsonString.match(/\[.*\]|\{.*\}/s);
              if (possibleJson) {
                parsedQuestions = JSON.parse(possibleJson[0]);
                console.log("Parsed JSON from extracted structure:", parsedQuestions);
              }
            }
          }
          
          // Ensure we have an array of questions
          if (parsedQuestions) {
            // Handle different possible formats
            let questionsArray;
            
            if (Array.isArray(parsedQuestions)) {
              questionsArray = parsedQuestions;
            } else if (parsedQuestions.questions && Array.isArray(parsedQuestions.questions)) {
              questionsArray = parsedQuestions.questions;
            } else if (typeof parsedQuestions === 'object') {
              // Try to convert object with numbered keys to array
              questionsArray = Object.values(parsedQuestions).filter(q => 
                q && typeof q === 'object' && (q.question || q.Question)
              );
            }
            
            // Normalize question format if needed
            if (questionsArray && questionsArray.length > 0) {
              const normalizedQuestions = questionsArray.map(q => ({
                question: q.question || q.Question || '',
                answer: q.answer || q.Answer || ''
              }));
              
              console.log("Normalized questions:", normalizedQuestions);
              setInterviewQuestions(normalizedQuestions);
            } else {
              setError("No valid questions found in the parsed data");
              console.error("No valid questions found in:", parsedQuestions);
            }
          } else {
            setError("Failed to parse questions from JSON");
          }
        } catch (parseError) {
          console.error("Error parsing interview questions:", parseError);
          setError("Error parsing interview questions: " + parseError.message);
        }
      } else {
        console.error("Interview not found");
        setError("Interview not found with ID: " + interviewId);
      }
    } catch (error) {
      console.error("Error fetching interview details:", error);
      setError("Error fetching interview details: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAnswerSubmitted = () => {
    // Increment the count of answered questions
    setAnsweredQuestions(prev => prev + 1);
    
    // If this was the last question, mark the interview as complete
    if (currentQuestionIndex === interviewQuestions.length - 1) {
      setTimeout(() => {
        setInterviewComplete(true);
      }, 1500); // Short delay to show the success message
    } else {
      // Otherwise, move to the next question after a short delay
      setTimeout(() => {
        handleNextQuestion();
      }, 1500);
    }
  };

  // Add a function to end the interview
  const handleEndInterview = () => {
    setInterviewComplete(true);
  };

  // Check if we have a valid current question
  const currentQuestion = interviewQuestions.length > 0 ? 
    interviewQuestions[currentQuestionIndex] : null;

  // If interview is complete, show the feedback component
  if (interviewComplete) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h2 className="font-bold text-2xl text-center mb-8">Interview Complete</h2>
        <Feedback mockId={interviewId} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h2 className="font-bold text-2xl text-center mb-8">Interview in Progress</h2>
      
      {/* Add End Interview button at the top */}
      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleEndInterview}
          variant="outline" 
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          End Interview & See Feedback
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center flex-col">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
          <p className="text-lg">Loading interview questions...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center">
          <p className="text-lg text-red-500">{error}</p>
        </div>
      ) : interviewQuestions.length === 0 ? (
        <div className="flex justify-center">
          <p className="text-lg text-red-500">No questions found for this interview.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left side - Questions */}
          <QuestionSection 
            questions={interviewQuestions}
            currentIndex={currentQuestionIndex}
            onNext={handleNextQuestion}
            onPrevious={handlePreviousQuestion}
          />
          
          {/* Right side - Video recording */}
          {currentQuestion && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <RecordAnswer 
                webcamEnabled={webcamEnabled}
                setWebcamEnabled={setWebcamEnabled}
                currentQuestion={currentQuestion}
                mockId={interviewId}
                onAnswerSubmitted={handleAnswerSubmitted}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Progress indicator */}
      {!loading && interviewQuestions.length > 0 && (
        <div className="mt-8">
          <div className="bg-gray-100 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${(answeredQuestions / interviewQuestions.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-center text-sm text-gray-600">
            {answeredQuestions} of {interviewQuestions.length} questions answered
          </p>
        </div>
      )}
    </div>
  );
};

export default StartInterview;
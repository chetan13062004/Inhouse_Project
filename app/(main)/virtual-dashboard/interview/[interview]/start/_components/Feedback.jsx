import React, { useEffect, useState } from 'react'
import { Star, Award, CheckCircle, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { db } from '@/utils/db'
import { UserAnswer } from '@/utils/schema'
import { eq } from 'drizzle-orm'
import confetti from 'canvas-confetti'

const Feedback = ({ mockId }) => {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAnswer, setExpandedAnswer] = useState(null);
  const [overallScore, setOverallScore] = useState(0);
  
  useEffect(() => {
    // Trigger confetti effect when component mounts
    if (typeof window !== 'undefined') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    
    // Fetch all answers for this mock interview
    const fetchAnswers = async () => {
      try {
        setLoading(true);
        const results = await db.select().from(UserAnswer)
          .where(eq(UserAnswer.mockidRef, mockId))
          .orderBy(UserAnswer.createdAt);
        
        // Process the results
        const processedAnswers = results.map(answer => {
          let feedbackObj = { rating: 0, feedback: "No feedback available", improvements: [] };
          try {
            feedbackObj = JSON.parse(answer.feedback);
          } catch (e) {
            console.error("Error parsing feedback JSON:", e);
          }
          
          return {
            ...answer,
            parsedFeedback: feedbackObj
          };
        });
        
        // Filter out answers with no content or very short answers
        const validAnswers = processedAnswers.filter(answer => 
          answer.userAns && answer.userAns.trim().length > 10
        );
        
        setAnswers(validAnswers);
        
        // Calculate overall score only for valid answers
        if (validAnswers.length > 0) {
          const totalRating = validAnswers.reduce((sum, answer) => 
            sum + (answer.parsedFeedback.rating || 0), 0);
          const avgRating = Math.round((totalRating / validAnswers.length) * 10) / 10;
          setOverallScore(avgRating);
        } else {
          setOverallScore(0);
        }
      } catch (error) {
        console.error("Error fetching answers:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (mockId) {
      fetchAnswers();
    }
  }, [mockId]);
  
  const toggleExpandAnswer = (index) => {
    if (expandedAnswer === index) {
      setExpandedAnswer(null);
    } else {
      setExpandedAnswer(index);
    }
  };
  
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };
  
  const getPerformanceText = (score) => {
    if (score === 0) return "No Rating";
    if (score >= 4.5) return "Outstanding";
    if (score >= 4) return "Excellent";
    if (score >= 3.5) return "Very Good";
    if (score >= 3) return "Good";
    if (score >= 2.5) return "Satisfactory";
    return "Needs Improvement";
  };
  
  const getPerformanceColor = (score) => {
    if (score === 0) return "text-gray-500";
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-blue-600";
    if (score >= 2) return "text-yellow-600";
    return "text-red-600";
  };
  
  const downloadFeedback = () => {
    // Create a text representation of the feedback
    let feedbackText = `INTERVIEW FEEDBACK SUMMARY\n\n`;
    
    if (overallScore === 0) {
      feedbackText += `Overall Performance: No Rating\n\n`;
    } else {
      feedbackText += `Overall Performance: ${getPerformanceText(overallScore)} (${overallScore}/5)\n\n`;
    }
    
    if (answers.length === 0) {
      feedbackText += `No answers were provided for this interview.\n`;
    } else {
      answers.forEach((answer, index) => {
        feedbackText += `QUESTION ${index + 1}: ${answer.question}\n`;
        feedbackText += `Your Answer: ${answer.userAns}\n`;
        feedbackText += `Rating: ${answer.parsedFeedback.rating}/5\n`;
        feedbackText += `Feedback: ${answer.parsedFeedback.feedback}\n`;
        feedbackText += `Areas to Improve: ${answer.parsedFeedback.improvements.join(', ')}\n\n`;
      });
    }
    
    // Create a download link
    const blob = new Blob([feedbackText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interview-feedback.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p>Loading your interview feedback...</p>
      </div>
    );
  }
  
  if (answers.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Award className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Interview Complete</h2>
          <p className="text-gray-600 mt-2">
            No answers were recorded for this interview. Try again with voice recording enabled.
          </p>
        </div>
        <Button 
          onClick={() => window.location.href = '/virtual-dashboard'}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* Congratulations header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Award className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Congratulations!</h2>
        <p className="text-gray-600 mt-2">
          You've completed your interview. Here's your personalized feedback.
        </p>
      </div>
      
      {/* Overall score */}
      <div className="bg-gray-50 border rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Overall Performance</h3>
            <p className={`text-xl font-bold mt-1 ${getPerformanceColor(overallScore)}`}>
              {getPerformanceText(overallScore)}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex items-center">
              {overallScore > 0 ? (
                <>
                  <span className="text-3xl font-bold text-gray-800 mr-2">{overallScore}</span>
                  <div className="flex">
                    {renderStars(Math.round(overallScore))}
                  </div>
                </>
              ) : (
                <span className="text-gray-500">No rating available</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {overallScore > 0 
                ? "Average rating across all questions" 
                : "Complete questions to receive ratings"}
            </p>
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            onClick={downloadFeedback}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Feedback
          </Button>
        </div>
      </div>
      
      {/* Question-by-question feedback */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Question-by-Question Feedback</h3>
      
      <div className="space-y-4">
        {answers.map((answer, index) => (
          <div key={index} className="border rounded-lg overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer bg-gray-50"
              onClick={() => toggleExpandAnswer(index)}
            >
              <div>
                <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                <h4 className="font-medium text-gray-800 mt-1">{answer.question}</h4>
              </div>
              
              <div className="flex items-center">
                <div className="flex mr-3">
                  {renderStars(answer.parsedFeedback.rating)}
                </div>
                {expandedAnswer === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
            
            {expandedAnswer === index && (
              <div className="p-4 border-t">
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Your Answer</h5>
                  <p className="text-gray-700">{answer.userAns}</p>
                </div>
                
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Feedback</h5>
                  <p className="text-gray-700">{answer.parsedFeedback.feedback}</p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Areas to Improve</h5>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    {answer.parsedFeedback.improvements.map((improvement, i) => (
                      <li key={i}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Next steps */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Next Steps</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-blue-700">Review your feedback and identify patterns in areas for improvement</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-blue-700">Practice addressing the specific improvement areas highlighted</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-blue-700">Try another mock interview to apply what you've learned</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Feedback
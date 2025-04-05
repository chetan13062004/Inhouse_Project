"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/utils/db';
import { MockInterview, UserAnswer } from '@/utils/schema';
import { eq, desc, and } from 'drizzle-orm';
import { Star, Calendar, ArrowRight, Video, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';

const PreviousInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchInterviews();
    }
  }, [user]);

  const fetchInterviews = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get current user's email
      const userEmail = user.primaryEmailAddress.emailAddress;
      
      // Fetch only mock interviews created by the current user
      const mockInterviews = await db.select().from(MockInterview)
        .where(eq(MockInterview.createdBy, userEmail))
        .orderBy(desc(MockInterview.createdAt))
        .limit(6);
      
      // For each interview, get the average rating and count of answers
      const interviewsWithStats = await Promise.all(
        mockInterviews.map(async (interview) => {
          // Get answers for this interview
          const answers = await db.select().from(UserAnswer)
            .where(eq(UserAnswer.mockidRef, interview.mockId));
          
          // Calculate average rating
          let totalRating = 0;
          let validAnswers = 0;
          
          answers.forEach(answer => {
            try {
              const feedback = JSON.parse(answer.feedback);
              if (feedback && feedback.rating && answer.userAns && answer.userAns.trim().length > 10) {
                totalRating += feedback.rating;
                validAnswers++;
              }
            } catch (e) {
              console.error("Error parsing feedback:", e);
            }
          });
          
          const avgRating = validAnswers > 0 ? (totalRating / validAnswers).toFixed(1) : "N/A";
          
          // Parse the questions to get the count
          let questionCount = 0;
          try {
            const questions = JSON.parse(interview.jsonMockResp);
            questionCount = questions.length;
          } catch (e) {
            console.error("Error parsing questions:", e);
          }
          
          return {
            ...interview,
            avgRating,
            answeredCount: answers.length,
            totalQuestions: questionCount,
            completionPercentage: questionCount > 0 ? 
              Math.round((answers.length / questionCount) * 100) : 0
          };
        })
      );
      
      setInterviews(interviewsWithStats);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFeedback = (interviewId) => {
    router.push(`/virtual-dashboard/interview/${interviewId}/feedback`);
  };

  const handleContinueInterview = (interviewId) => {
    router.push(`/virtual-dashboard/interview/${interviewId}/start`);
  };

  // Delete interview function
  const handleDeleteInterview = async (interviewId) => {
    if (confirm("Are you sure you want to delete this interview? This action cannot be undone.")) {
      try {
        setDeleting(interviewId);
        
        // First delete all answers associated with this interview
        await db.delete(UserAnswer)
          .where(eq(UserAnswer.mockidRef, interviewId));
        
        // Then delete the interview itself
        await db.delete(MockInterview)
          .where(eq(MockInterview.mockId, interviewId));
        
        // Update the UI by removing the deleted interview
        setInterviews(interviews.filter(interview => interview.mockId !== interviewId));
        
        alert("Interview deleted successfully");
      } catch (error) {
        console.error("Error deleting interview:", error);
        alert("Failed to delete interview. Please try again.");
      } finally {
        setDeleting(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Previous Interviews</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="h-10 bg-gray-200 rounded w-full mt-6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Previous Interviews</h3>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">Please sign in to view your interviews.</p>
        </div>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Previous Interviews</h3>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No previous interviews found. Start a new interview to see results here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Previous Interviews</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interviews.map((interview) => (
          <div key={interview.mockId} className="bg-white rounded-lg shadow-md overflow-hidden relative">
            {/* Delete button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteInterview(interview.mockId);
              }}
              className="absolute top-2 right-2 p-1.5 bg-red-50 hover:bg-red-100 rounded-full text-red-500 transition-colors"
              disabled={deleting === interview.mockId}
              title="Delete interview"
            >
              {deleting === interview.mockId ? (
                <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>
            
            <div className="p-6">
              <h4 className="font-semibold text-lg mb-2">{interview.jobPosition} Interview</h4>
              
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Rating:</span>
                  {interview.avgRating !== "N/A" ? (
                    <div className="flex items-center">
                      <span className="font-bold text-lg mr-1">{interview.avgRating}</span>
                      <Star className={`h-5 w-5 ${parseFloat(interview.avgRating) >= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                    </div>
                  ) : (
                    <span className="text-gray-500">Not rated</span>
                  )}
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">{interview.answeredCount}/{interview.totalQuestions}</span> questions
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className={`h-2.5 rounded-full ${
                    interview.completionPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${interview.completionPercentage}%` }}
                ></div>
              </div>
              
              {interview.completionPercentage < 100 ? (
                <Button 
                  onClick={() => handleContinueInterview(interview.mockId)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Continue Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={() => handleViewFeedback(interview.mockId)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  View Feedback
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviousInterviews;
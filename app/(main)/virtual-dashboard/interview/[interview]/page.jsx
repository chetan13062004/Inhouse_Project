

"use client"

import { MockInterview } from '@/utils/schema'
import { db } from '@/utils/db'
import { eq } from 'drizzle-orm'
import React, { useEffect, useState, use } from 'react'
import { WebcamIcon, InfoIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactWebcam from 'react-webcam'
import { useRouter } from 'next/navigation'

const Interview = ({ params }) => {
    const router = useRouter();
    const [interviewData, setInterviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [webcamEnable, setWebCamEnable] = useState(false);
    
    // Unwrap params using React.use()
    const unwrappedParams = use(params);
    const interviewId = unwrappedParams.interview;

    useEffect(() => {
        // Only run when interviewId is available
        if (interviewId) {
            console.log("Interview ID:", interviewId);
            GetInterviewDetails();
        }
    }, [interviewId]);

    const GetInterviewDetails = async () => {
        try {
            setLoading(true);
            console.log("Searching for mockId:", interviewId);
            
            const result = await db.select().from(MockInterview)
                .where(eq(MockInterview.mockId, interviewId));
            
            console.log("Raw query result:", result);
            
            if (result && result.length > 0) {
                setInterviewData(result[0]);
                // Log each property to see what's available
                console.log("Interview data details:");
                Object.keys(result[0]).forEach(key => {
                    console.log(`${key}: ${result[0][key]}`);
                });
            } else {
                if (!isNaN(Number(interviewId)) && interviewId.trim() !== '') {
                    console.log("Trying with numeric ID:", Number(interviewId));
                    const numericId = Number(interviewId);
                    
                    const altResult = await db.select().from(MockInterview)
                        .where(eq(MockInterview.id, numericId));
                    
                    console.log("Alternative query result:", altResult);
                    
                    if (altResult && altResult.length > 0) {
                        setInterviewData(altResult[0]);
                        // Log each property to see what's available
                        console.log("Interview data details (alt):");
                        Object.keys(altResult[0]).forEach(key => {
                            console.log(`${key}: ${altResult[0][key]}`);
                        });
                    } else {
                        setError("No interview found with the provided ID");
                    }
                } else {
                    setError("Invalid interview ID format");
                }
            }
        } catch (error) {
            console.error("Error fetching interview details:", error);
            setError("Failed to fetch interview details: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    // Function to parse JSON safely
    const parseJsonField = (jsonString, fallback = null) => {
        if (!jsonString) return fallback;
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Error parsing JSON:", e);
            return fallback;
        }
    };

    // Extract job details from the interview data
    const getJobDetails = () => {
        if (!interviewData) return { role: null, experience: null, description: null };
        
        // Use the correct field names from the database
        return {
            role: interviewData.jobPosition || "Not specified",
            experience: interviewData.jobExperience || "Not specified",
            description: interviewData.jobDesc || "No job description available"
        };
    };

    const jobDetails = getJobDetails();

    return (
        <div className='container mx-auto py-8 px-4'>
            <h2 className='font-bold text-2xl text-center mb-8'>Let's Get Started With Your Interview</h2>
            
            {loading ? (
                <div className="flex justify-center">
                    <p className="text-lg">Loading interview details...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p>{error}</p>
                </div>
            ) : interviewData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left side - Webcam */}
                    <div className="flex flex-col items-center">
                        <div className="bg-white shadow-md rounded-lg p-4 w-full">
                            <h3 className="font-semibold text-lg mb-4 text-center">Video Interview</h3>
                            <div className="flex justify-center mb-4">
                                {webcamEnable ? (
                                    <ReactWebcam 
                                        onUserMedia={() => setWebCamEnable(true)}
                                        onUserMediaError={() => setWebCamEnable(false)}
                                        style={{
                                            height: 300,
                                            width: '100%',
                                            objectFit: 'cover',
                                            borderRadius: '8px'
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <WebcamIcon className='h-64 w-64 p-4 bg-gray-100 text-gray-400 rounded-lg border' />
                                        <Button 
                                            onClick={() => setWebCamEnable(true)}
                                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                                        >
                                            Enable Webcam and Microphone
                                        </Button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Yellow instruction block */}
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mt-4">
                                <div className="flex items-start">
                                    <InfoIcon className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-amber-800">Important Information</h4>
                                        <ul className="mt-2 text-sm text-amber-700 space-y-1">
                                            <li>• This interview session will not record your video</li>
                                            <li>• Please ensure you have a stable internet connection</li>
                                            <li>• Find a quiet place with good lighting</li>
                                            <li>• Speak clearly and maintain eye contact with the camera</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right side - Interview details */}
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h3 className="font-semibold text-lg mb-4">Interview Details</h3>
                        
                        <div className="space-y-6">
                            {/* Job Role */}
                            <div className="border-b pb-4">
                                <h4 className="font-medium text-gray-800 mb-2">Job Role</h4>
                                <p className="text-gray-700">{jobDetails.role}</p>
                            </div>
                            
                            {/* Experience Level */}
                            <div className="border-b pb-4">
                                <h4 className="font-medium text-gray-800 mb-2">Experience Level</h4>
                                <p className="text-gray-700">{jobDetails.experience}</p>
                            </div>
                            
                            {/* Job Description */}
                            <div>
                                <h4 className="font-medium text-gray-800 mb-2">Job Description</h4>
                                <p className="text-gray-700 whitespace-pre-line">
                                    {jobDetails.description}
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-8">
                            <Button 
                                onClick={() => router.push(`/virtual-dashboard/interview/${interviewId}/start`)}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                Start Interview
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Interview
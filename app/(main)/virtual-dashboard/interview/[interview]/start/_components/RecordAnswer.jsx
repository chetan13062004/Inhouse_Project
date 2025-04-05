
// import React, { useState, useEffect, useRef } from 'react'
// import { Mic, Video, StopCircle, Loader2 } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import ReactWebcam from 'react-webcam'
// import { db } from '@/utils/db'
// import { UserAnswer } from '@/utils/schema'
// import { generateInterviewFeedback } from '@/utils/GeminiAiModel'

// const RecordAnswer = ({ 
//   webcamEnabled, 
//   setWebcamEnabled, 
//   currentQuestion, 
//   mockId,
//   onAnswerSubmitted,
//   isLastQuestion
// }) => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [transcript, setTranscript] = useState('');
//   const [recognition, setRecognition] = useState(null);
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [hasSubmitted, setHasSubmitted] = useState(false);
//   const recognitionRef = useRef(null);

//   useEffect(() => {
//     // Initialize speech recognition
//     if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       const recognitionInstance = new SpeechRecognition();
      
//       recognitionInstance.continuous = true;
//       recognitionInstance.interimResults = true;
//       recognitionInstance.lang = 'en-US';
      
//       recognitionInstance.onresult = (event) => {
//         let interimTranscript = '';
//         let finalTranscript = '';
        
//         for (let i = event.resultIndex; i < event.results.length; i++) {
//           const transcript = event.results[i][0].transcript;
//           if (event.results[i].isFinal) {
//             finalTranscript += transcript + ' ';
//           } else {
//             interimTranscript += transcript;
//           }
//         }
        
//         setTranscript(finalTranscript + interimTranscript);
//       };
      
//       recognitionInstance.onerror = (event) => {
//         console.error('Speech recognition error', event.error);
//         setIsRecording(false);
//       };
      
//       setRecognition(recognitionInstance);
//       recognitionRef.current = recognitionInstance;
//     } else {
//       console.error('Speech recognition not supported in this browser');
//     }
    
//     // Cleanup
//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//       }
//     };
//   }, []);

//   // Reset state when question changes
//   useEffect(() => {
//     setTranscript('');
//     setHasSubmitted(false);
    
//     if (isRecording && recognitionRef.current) {
//       recognitionRef.current.stop();
//       setIsRecording(false);
//     }
//   }, [currentQuestion]);

//   const toggleRecording = () => {
//     if (!recognition) return;
    
//     if (isRecording) {
//       recognition.stop();
//       setIsRecording(false);
//     } else {
//       setTranscript('');
//       recognition.start();
//       setIsRecording(true);
//     }
//   };

//   const analyzeAnswer = async () => {
//     if (!transcript.trim()) {
//       alert("Please record an answer before submitting");
//       return;
//     }

//     setIsAnalyzing(true);
    
//     try {
//       // Evaluate answer quality based on content
//       const wordCount = transcript.split(/\s+/).filter(Boolean).length;
//       const keywordMatches = currentQuestion?.answer 
//         ? currentQuestion.answer.toLowerCase().split(/\s+/).filter(word => 
//             transcript.toLowerCase().includes(word) && word.length > 3
//           ).length
//         : 0;
      
//       // Calculate a more dynamic rating based on answer quality
//       let calculatedRating = 3; // Default rating
      
//       if (wordCount < 15) {
//         calculatedRating = 2;
//       } else if (wordCount > 50 && keywordMatches > 3) {
//         calculatedRating = 4;
//       } else if (wordCount > 100 && keywordMatches > 5) {
//         calculatedRating = 5;
//       }
      
//       // Call Gemini AI for feedback
//       const aiResponse = await generateInterviewFeedback(
//         [{role: 'user', content: transcript}],
//         currentQuestion?.question || 'Interview Question',
//         'Experienced'
//       );
      
//       // Create a concise feedback
//       const conciseFeedback = aiResponse.length > 150 
//         ? aiResponse.substring(0, 150) + "..." 
//         : aiResponse;
      
//       // Create structured result
//       const result = {
//         rating: calculatedRating,
//         feedback: conciseFeedback,
//         improvements: [
//           "Be more specific in your answer",
//           "Provide concrete examples from your experience",
//           "Structure your answer with a clear beginning, middle, and conclusion"
//         ]
//       };
      
//       // Save to database
//       const now = new Date().toISOString();
//       try {
//         await db.insert(UserAnswer).values({
//           mockidRef: mockId,
//           question: currentQuestion?.question,
//           correctAns: currentQuestion?.answer || '',
//           userAns: transcript,
//           feedback: JSON.stringify(result),
//           userEmail: 'anonymous',
//           createdAt: now
//         });
//         console.log("Successfully saved answer to database");
//       } catch (dbError) {
//         console.error("Database error:", dbError);
//       }

//       setHasSubmitted(true);
      
//       // Notify parent component that answer has been submitted
//       if (onAnswerSubmitted) {
//         onAnswerSubmitted();
//       }
//     } catch (error) {
//       console.error('Error analyzing answer:', error);
//       // Still mark as submitted even if there was an error
//       setHasSubmitted(true);
//       if (onAnswerSubmitted) {
//         onAnswerSubmitted();
//       }
//     } finally {
//       setIsAnalyzing(false);
//     }
//   };

//   return (
//     <div className="bg-white shadow-md rounded-lg p-6">
//       <div className="flex items-center mb-6">
//         <Video className="h-6 w-6 text-blue-500 mr-2" />
//         <h3 className="font-semibold text-lg">Your Interview</h3>
//       </div>
      
//       <div className="flex flex-col items-center">
//         {webcamEnabled ? (
//           <ReactWebcam 
//             audio={true}
//             muted={true}
//             onUserMedia={() => console.log("Webcam and mic access granted")}
//             onUserMediaError={(error) => console.error("Webcam or mic error:", error)}
//             style={{
//               width: '100%',
//               height: 300,
//               objectFit: 'cover',
//               borderRadius: '8px'
//             }}
//           />
//         ) : (
//           <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg w-full h-[300px]">
//             <Video className="h-16 w-16 text-gray-400 mb-4" />
//             <p className="text-gray-500 mb-4">Enable your camera to see yourself</p>
//             <Button 
//               onClick={() => setWebcamEnabled(true)}
//               className="bg-blue-600 hover:bg-blue-700"
//             >
//               <Mic className="h-4 w-4 mr-2" />
//               Enable Camera & Mic
//             </Button>
//           </div>
//         )}
//       </div>
      
//       {webcamEnabled && (
//         <div className="mt-4">
//           {!hasSubmitted ? (
//             <>
//               <Button 
//                 onClick={toggleRecording}
//                 className={`w-full ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
//                 disabled={isAnalyzing}
//               >
//                 {isRecording ? (
//                   <>
//                     <StopCircle className="h-4 w-4 mr-2" />
//                     Stop Recording
//                   </>
//                 ) : (
//                   <>
//                     <Mic className="h-4 w-4 mr-2" />
//                     {transcript ? 'Record Again' : 'Start Recording Answer'}
//                   </>
//                 )}
//               </Button>
              
//               {transcript && !isRecording && (
//                 <Button 
//                   onClick={analyzeAnswer}
//                   className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
//                   disabled={isAnalyzing}
//                 >
//                   {isAnalyzing ? (
//                     <>
//                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                       Analyzing Your Answer...
//                     </>
//                   ) : (
//                     isLastQuestion ? 'Submit & See Results' : 'Submit Answer & Continue'
//                   )}
//                 </Button>
//               )}
//             </>
//           ) : (
//             <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-center">
//               <p className="text-green-700 font-medium">Answer submitted successfully!</p>
//               {isLastQuestion ? (
//                 <p className="text-green-600 mt-2">Preparing your feedback...</p>
//               ) : (
//                 <p className="text-green-600 mt-2">Moving to next question...</p>
//               )}
//             </div>
//           )}
          
//           {isRecording && (
//             <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center">
//               <div className="h-3 w-3 rounded-full bg-red-500 mr-2 animate-pulse"></div>
//               <p className="text-sm text-red-700">Recording in progress... Speak clearly.</p>
//             </div>
//           )}
          
//           {transcript && !isRecording && !isAnalyzing && !hasSubmitted && (
//             <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
//               <h4 className="font-medium mb-2">Your Recorded Answer:</h4>
//               <p className="text-gray-700">{transcript}</p>
//               <p className="text-sm text-gray-500 mt-2">Submit your answer to continue.</p>
//             </div>
//           )}
//         </div>
//       )}
      
//       <div className="mt-6 bg-gray-50 p-4 rounded-lg">
//         <h4 className="font-medium mb-2">Tips for this question:</h4>
//         <ul className="text-sm text-gray-700 space-y-1">
//           <li>• Speak clearly and maintain eye contact with the camera</li>
//           <li>• Structure your answer with a beginning, middle, and conclusion</li>
//           <li>• Use specific examples from your experience when possible</li>
//           <li>• Keep your answer concise and focused on the question</li>
//         </ul>
//       </div>
//     </div>
//   )
// }

// export default RecordAnswer

import React, { useState, useEffect, useRef } from 'react'
import { Mic, Video, StopCircle, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactWebcam from 'react-webcam'
import { db } from '@/utils/db'
import { UserAnswer } from '@/utils/schema'
import { generateInterviewFeedback } from '@/utils/GeminiAiModel'

const RecordAnswer = ({ 
  webcamEnabled, 
  setWebcamEnabled, 
  currentQuestion, 
  mockId,
  onAnswerSubmitted,
  isLastQuestion
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
      recognitionRef.current = recognitionInstance;
    } else {
      console.error('Speech recognition not supported in this browser');
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Reset state when question changes
  useEffect(() => {
    setTranscript('');
    setHasSubmitted(false);
    
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [currentQuestion]);

  const toggleRecording = () => {
    if (!recognition) return;
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      recognition.start();
      setIsRecording(true);
    }
  };

  const analyzeAnswer = async () => {
    // Check if there's any meaningful content in the transcript
    const hasContent = transcript && transcript.trim().length > 10;

    setIsAnalyzing(true);
    
    try {
      // If no meaningful content, create a default feedback with 0 rating
      if (!hasContent) {
        const defaultFeedback = {
          rating: 0,
          feedback: "No answer was provided for this question.",
          improvements: [
            "Make sure your microphone is working properly",
            "Speak clearly and directly into the microphone",
            "Try to provide a complete answer to each question"
          ]
        };
        
        // Save to database with empty answer
        const now = new Date().toISOString();
        try {
          await db.insert(UserAnswer).values({
            mockidRef: mockId,
            question: currentQuestion?.question,
            correctAns: currentQuestion?.answer || '',
            userAns: transcript || "No answer provided",
            feedback: JSON.stringify(defaultFeedback),
            userEmail: 'anonymous',
            createdAt: now
          });
          console.log("Successfully saved empty answer to database");
        } catch (dbError) {
          console.error("Database error:", dbError);
        }

        setHasSubmitted(true);
        
        // Notify parent component that answer has been submitted
        if (onAnswerSubmitted) {
          onAnswerSubmitted();
        }
        
        setIsAnalyzing(false);
        return;
      }

      // Continue with normal analysis for answers with content
      // Evaluate answer quality based on content
      const wordCount = transcript.split(/\s+/).filter(Boolean).length;
      const keywordMatches = currentQuestion?.answer 
        ? currentQuestion.answer.toLowerCase().split(/\s+/).filter(word => 
            transcript.toLowerCase().includes(word) && word.length > 3
          ).length
        : 0;
      
      // Calculate a more dynamic rating based on answer quality
      let calculatedRating = 3; // Default rating
      
      if (wordCount < 15) {
        calculatedRating = 2;
      } else if (wordCount > 50 && keywordMatches > 3) {
        calculatedRating = 4;
      } else if (wordCount > 100 && keywordMatches > 5) {
        calculatedRating = 5;
      }
      
      // Call Gemini AI for feedback
      const aiResponse = await generateInterviewFeedback(
        [{role: 'user', content: transcript}],
        currentQuestion?.question || 'Interview Question',
        'Experienced'
      );
      
      // Create a concise feedback
      const conciseFeedback = aiResponse.length > 150 
        ? aiResponse.substring(0, 150) + "..." 
        : aiResponse;
      
      // Create structured result
      const result = {
        rating: calculatedRating,
        feedback: conciseFeedback,
        improvements: [
          "Be more specific in your answer",
          "Provide concrete examples from your experience",
          "Structure your answer with a clear beginning, middle, and conclusion"
        ]
      };
      
      // Save to database
      const now = new Date().toISOString();
      try {
        await db.insert(UserAnswer).values({
          mockidRef: mockId,
          question: currentQuestion?.question,
          correctAns: currentQuestion?.answer || '',
          userAns: transcript,
          feedback: JSON.stringify(result),
          userEmail: 'anonymous',
          createdAt: now
        });
        console.log("Successfully saved answer to database");
      } catch (dbError) {
        console.error("Database error:", dbError);
      }

      setHasSubmitted(true);
      
      // Notify parent component that answer has been submitted
      if (onAnswerSubmitted) {
        onAnswerSubmitted();
      }
    } catch (error) {
      console.error('Error analyzing answer:', error);
      // Still mark as submitted even if there was an error
      setHasSubmitted(true);
      if (onAnswerSubmitted) {
        onAnswerSubmitted();
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center mb-6">
        <Video className="h-6 w-6 text-blue-500 mr-2" />
        <h3 className="font-semibold text-lg">Your Interview</h3>
      </div>
      
      <div className="flex flex-col items-center">
        {webcamEnabled ? (
          <ReactWebcam 
            audio={true}
            muted={true}
            onUserMedia={() => console.log("Webcam and mic access granted")}
            onUserMediaError={(error) => console.error("Webcam or mic error:", error)}
            style={{
              width: '100%',
              height: 300,
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg w-full h-[300px]">
            <Video className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Enable your camera to see yourself</p>
            <Button 
              onClick={() => setWebcamEnabled(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Mic className="h-4 w-4 mr-2" />
              Enable Camera & Mic
            </Button>
          </div>
        )}
      </div>
      
      {webcamEnabled && (
        <div className="mt-4">
          {!hasSubmitted ? (
            <>
              <Button 
                onClick={toggleRecording}
                className={`w-full ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                disabled={isAnalyzing}
              >
                {isRecording ? (
                  <>
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    {transcript ? 'Record Again' : 'Start Recording Answer'}
                  </>
                )}
              </Button>
              
              <Button 
                onClick={analyzeAnswer}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Your Answer...
                  </>
                ) : (
                  isLastQuestion ? 'Submit & See Results' : 'Submit Answer & Continue'
                )}
              </Button>
            </>
          ) : (
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-center">
              <p className="text-green-700 font-medium">Answer submitted successfully!</p>
              {isLastQuestion ? (
                <p className="text-green-600 mt-2">Preparing your feedback...</p>
              ) : (
                <p className="text-green-600 mt-2">Moving to next question...</p>
              )}
            </div>
          )}
          
          {isRecording && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center">
              <div className="h-3 w-3 rounded-full bg-red-500 mr-2 animate-pulse"></div>
              <p className="text-sm text-red-700">Recording in progress... Speak clearly.</p>
            </div>
          )}
          
          {transcript && !isRecording && !isAnalyzing && !hasSubmitted && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium mb-2">Your Recorded Answer:</h4>
              <p className="text-gray-700">{transcript}</p>
              <p className="text-sm text-gray-500 mt-2">Submit your answer to continue.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Tips for this question:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Speak clearly and maintain eye contact with the camera</li>
          <li>• Structure your answer with a beginning, middle, and conclusion</li>
          <li>• Use specific examples from your experience when possible</li>
          <li>• Keep your answer concise and focused on the question</li>
        </ul>
      </div>
    </div>
  )
}

export default RecordAnswer
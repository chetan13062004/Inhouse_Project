import React, { useState } from 'react'
import { FileQuestion, Info, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'

const QuestionSection = ({ 
  questions, 
  currentIndex, 
  onNext, 
  onPrevious 
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Ensure questions is an array
  const questionsArray = Array.isArray(questions) ? questions : [];

  if (!questionsArray.length) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-red-500">No questions found for this interview.</p>
      </div>
    )
  }

  const speakQuestion = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const currentQuestion = questionsArray[currentIndex]?.question;
      if (currentQuestion) {
        const utterance = new SpeechSynthesisUtterance(currentQuestion);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // Slightly slower than default
        utterance.pitch = 1;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      }
    } else {
      console.error('Text-to-speech not supported in this browser');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center mb-4">
        <FileQuestion className="h-6 w-6 text-blue-500 mr-2" />
        <h3 className="font-semibold text-lg">Question {currentIndex + 1} of {questionsArray.length}</h3>
      </div>
      
      {/* Question progress indicator */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-500">Progress</span>
          <span className="text-sm font-medium">{Math.round(((currentIndex + 1) / questionsArray.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${((currentIndex + 1) / questionsArray.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Question indicators */}
      <div className="flex mb-6 overflow-x-auto py-2">
        {questionsArray.map((_, index) => (
          <div 
            key={index}
            className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${
              index === currentIndex 
                ? 'bg-blue-600 text-white' 
                : index < currentIndex 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            {index + 1}
          </div>
        ))}
      </div>
      
      {/* Current question with text-to-speech button */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 min-h-[150px] relative">
        <div className="flex justify-between items-start">
          <p className="font-medium text-lg pr-10">{questionsArray[currentIndex]?.question}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2"
            onClick={isSpeaking ? stopSpeaking : speakQuestion}
          >
            {isSpeaking ? (
              <VolumeX className="h-5 w-5 text-gray-600" />
            ) : (
              <Volume2 className="h-5 w-5 text-blue-600" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button 
          variant="outline" 
          onClick={() => {
            stopSpeaking();
            onPrevious();
          }}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        
        <Button 
          onClick={() => {
            stopSpeaking();
            onNext();
          }}
          disabled={currentIndex === questionsArray.length - 1}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Next Question
        </Button>
      </div>

      {/* Professional note about camera and mic access */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700">
              <span className="font-medium">Important:</span> Please enable your camera and microphone access for the best interview experience. This allows us to provide you with more accurate feedback and results after the interview session.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionSection
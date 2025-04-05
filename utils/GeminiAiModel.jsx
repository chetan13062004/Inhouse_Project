import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function getGeminiResponse(prompt, role, experience) {
  try {
    // Make sure API key is available
    if (!API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    // Get the model - updated to use the correct model name
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Create a context-aware prompt
    const contextPrompt = `You are an AI interviewer for a ${role} position. 
    The candidate has ${experience} level of experience. 
    Please respond to the following message from the candidate: ${prompt}`;

    // Generate content
    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Error with Gemini AI:', error);
    return 'Sorry, I encountered an error processing your request. Please try again later.';
  }
}

// Function to generate interview feedback
export async function generateInterviewFeedback(messages, role, experience) {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    // Updated model name here too
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Extract only user messages for analysis
    const userMessages = messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n\n');
    
    const feedbackPrompt = `You are an expert interviewer for ${role} positions.
    Please analyze the following responses from a candidate with ${experience} experience level
    and provide constructive feedback about their interview performance.
    Focus on communication skills, technical knowledge, and areas for improvement.
    
    Candidate responses:
    ${userMessages}
    
    Provide a detailed but concise feedback (maximum 250 words).`;
    
    const result = await model.generateContent(feedbackPrompt);
    const response = await result.response;
    const feedback = response.text();
    
    return feedback;
  } catch (error) {
    console.error('Error generating feedback:', error);
    return 'Unable to generate feedback at this time. Please try again later.';
  }
}

// Function to export chat sessions remains unchanged
export function exportChatSession(messages, interviewData) {
  try {
    // Format the chat session for export
    const formattedMessages = messages.map(msg => {
      return {
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        isFeedback: msg.isFeedback || false
      };
    });
    
    // Create the export object with interview metadata
    const exportData = {
      interview: {
        role: interviewData.role,
        experience: interviewData.experience,
        startTime: interviewData.startTime,
        endTime: new Date().toISOString()
      },
      messages: formattedMessages
    };
    
    // Convert to JSON string for easy transport
    const jsonData = JSON.stringify(exportData, null, 2);
    
    return {
      success: true,
      data: exportData,
      json: jsonData
    };
  } catch (error) {
    console.error('Error exporting chat session:', error);
    return {
      success: false,
      error: 'Failed to export chat session'
    };
  }
}
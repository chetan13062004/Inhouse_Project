import { NextResponse } from 'next/server';
import { getGeminiResponse } from '@/utils/GeminiAiModel';
export async function POST(request) {
  try {
    const { question, answer } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    // Create a prompt for analysis
    const prompt = `
      Analyze this interview answer:
      
      Question: "${question}"
      Answer: "${answer}"
      
      Provide feedback in JSON format with:
      {
        "rating": (number between 1-5),
        "feedback": "detailed feedback on strengths and weaknesses",
        "improvements": ["improvement tip 1", "improvement tip 2", "improvement tip 3"]
      }
    `;

    // Use your existing function with a generic role and experience
    const response = await getGeminiResponse(prompt, "Software Developer", "intermediate");
    
    // Extract JSON from the response
    let parsedResponse;
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                        response.match(/```\s*([\s\S]*?)\s*```/) || 
                        [null, response];
      
      parsedResponse = JSON.parse(jsonMatch[1] || response);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      // Fallback response
      parsedResponse = {
        rating: 3,
        feedback: "Your answer addressed some key points, but could be improved with more structure and specific examples.",
        improvements: [
          "Be more concise and focused on directly answering the question",
          "Include specific examples from your experience",
          "Structure your answer with a clear beginning, middle, and conclusion"
        ]
      };
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Error analyzing answer:', error);
    return NextResponse.json(
      { error: 'Failed to analyze answer' },
      { status: 500 }
    );
  }
}
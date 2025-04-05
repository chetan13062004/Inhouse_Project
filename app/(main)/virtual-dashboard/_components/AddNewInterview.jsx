"use client"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getGeminiResponse } from "@/utils/GeminiAiModel"
import { MockInterview } from "@/utils/schema"
import { v4 as uuidv4 } from "uuid"
import { useUser } from "@clerk/nextjs"
import moment from "moment"
import { db } from "@/utils/db"
import { useRouter } from "next/navigation"

const AddNewInterview = () => {
    const [openDialog, setOpenDialog] = useState(false)
    const [jobPosition, setJobPosition] = useState("");
    const [jobDesc, setJobDesc] = useState("");
    const [jobExperience, setJobExperience] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [jsonResponse, setJsonResponse] = useState([]);
    const router = useRouter();
    const { user } = useUser();

    const onSubmit = async(e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const inputPrompt = `job role: ${jobPosition}, job description: ${jobDesc}, job experience: ${jobExperience}. Based on this information, give me 10 interview questions with answers in JSON format.`;
            
            // Use the getGeminiResponse function from your utility
            const responseText = await getGeminiResponse(inputPrompt, jobPosition, jobExperience);
            
            // Clean up the response text to extract JSON
            let cleanedResponse = responseText;
            if (responseText.includes("```json")) {
                cleanedResponse = responseText.split("```json")[1].split("```")[0].trim();
            } else if (responseText.includes("```")) {
                cleanedResponse = responseText.split("```")[1].split("```")[0].trim();
            } else if (responseText.includes("'''json")) {
                cleanedResponse = responseText.replace("'''json", "").replace("'''", "").trim();
            }
            
            console.log("Cleaned response:", cleanedResponse);
            
            try {
                const parsedJson = JSON.parse(cleanedResponse);
                console.log("Parsed JSON:", parsedJson);
                setResult(responseText);
                setJsonResponse(parsedJson);
                
                if (parsedJson) {
                    try {
                        // Generate a unique ID for this interview
                        const uniqueId = uuidv4();
                        
                        // Insert data with field names matching your schema
                        const insertData = {
                            jsonMockResp: JSON.stringify(parsedJson),
                            jobPosition: jobPosition,
                            jobDesc: jobDesc,
                            jobExperience: jobExperience,
                            createdBy: user?.primaryEmailAddress?.emailAddress || "anonymous",
                            createdAt: moment().format('YYYY-MM-DD'),
                            mockId: uniqueId
                        };
                        
                        console.log("Attempting to insert:", insertData);
                        
                        const resp = await db.insert(MockInterview).values(insertData);
                        
                        console.log("Database response:", resp);
                        alert("Interview questions generated successfully!");
                        setOpenDialog(false);
                        
                        // Navigate to the interview page with the correct path
                        router.push(`/virtual-dashboard/interview/${uniqueId}/start`);
                    } catch (dbError) {
                        console.error("Database insertion error:", dbError);
                        alert("Failed to save to database. Please try again.");
                    }
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
                alert("Failed to process AI response. Please try again.");
            }
        } catch (error) {
            console.error("Error getting Gemini response:", error);
            alert("Failed to communicate with AI. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <div className='p-10 border rounded-lg hover:shadow-2xl cursor-pointer' onClick={()=>setOpenDialog(true)}>
                <h2 className='font-bold text-lg text-center'>+ Add New </h2>
            </div>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger></DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Tell Us More About Your Job Interview</DialogTitle>
                        <DialogDescription>
                            <form onSubmit={onSubmit}>
                                <div>
                                    <h3>
                                        Add All Details
                                    </h3>
                                    <div className="mt-7 my-3">
                                        <label>Job Role</label>
                                        <Input placeholder="Ex. Full stack Developer"
                                        onChange={(event)=>setJobPosition(event.target.value)} required/>
                                    </div>
                                    <div className="my-3">
                                        <label>Job Description</label>
                                        <Textarea placeholder="Ex. React,Angular"
                                        onChange={(event)=>setJobDesc(event.target.value)} required/>
                                    </div>
                                    <div className="my-3">
                                        <label>Years of Experience</label>
                                        <Input placeholder="Ex. 2" type="number" Mx="70" 
                                        onChange={(event)=>setJobExperience(event.target.value)} required/>
                                    </div>
                                </div>
                                <div className="flex gap-5 justify-end">
                                    <Button type="button" variant="ghost" onClick={()=>setOpenDialog(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-blue-500 text-white hover:bg-blue-600" disabled={loading}>
                                        {loading ? "Processing..." : "Start Interview"}
                                    </Button>
                                </div>
                            </form>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AddNewInterview
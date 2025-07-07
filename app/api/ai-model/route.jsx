import { QUESTIONS_PROMPT } from "@/services/Constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Vercel Edge Runtime optimization
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds max for free tier

export async function POST(req) {
    try {
        const {
            jobPosition,
            jobDescription,
            duration,
            type,
            experienceLevel = '',
            requiredSkills = '',
            companyCriteria = '',
            questionCount = '10'
        } = await req.json();

        // Replace all placeholders in the prompt
        const FINAL_PROMPT = QUESTIONS_PROMPT
            .replace('{{jobTitle}}', jobPosition)
            .replace('{{jobDescription}}', jobDescription)
            .replace('{{duration}}', duration)
            .replace('{{type}}', type)
            .replace('{{experienceLevel}}', experienceLevel)
            .replace('{{requiredSkills}}', requiredSkills)
            .replace('{{companyCriteria}}', companyCriteria)
            .replace('{{questionCount}}', questionCount);

        console.log("Sending prompt to AI model for question generation...");

        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: "google/gemini-flash-1.5",
            messages: [
                { role: "user", content: FINAL_PROMPT }
            ],
        });

        return NextResponse.json(completion.choices[0].message);
    } catch (error) {
        console.error("Error in AI question generation:", error);
        return NextResponse.json(
            { error: "Failed to generate questions" },
            { status: 500 }
        );
    }
}
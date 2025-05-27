import { FEEDBACK_PROMPT } from "@/services/Constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {
    try {
        const {
            conversation,
            jobTitle = '',
            jobDescription = '',
            requiredSkills = '',
            companyCriteria = ''
        } = await req.json();

        // Replace all placeholders in the prompt
        let FINAL_PROMPT = FEEDBACK_PROMPT
            .replace('{{conversation}}', conversation)
            .replace('{{jobTitle}}', jobTitle)
            .replace('{{jobDescription}}', jobDescription)
            .replace('{{requiredSkills}}', requiredSkills)
            .replace('{{companyCriteria}}', companyCriteria);

        console.log("Sending prompt to AI model...");

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
        console.error("Error in AI feedback generation:", error);
        return NextResponse.json(
            { error: "Failed to generate feedback" },
            { status: 500 }
        );
    }
}
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const difficulty = formData.get("difficulty");
    const questionCount = formData.get("questionCount") || "10";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert Web File to ArrayBuffer, then base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "application/pdf"; // Support both images and pdfs

    // Initialize Gemini API
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      You are an expert teacher creating questions for a classroom smartboard game.
      Read the attached document/image and generate exactly ${questionCount} multiple-choice questions.
      
      Difficulty Level: ${difficulty}. 
      - If Easy: Very short simple questions. One answer is clearly correct. Good for Grade 1-2.
      - If Medium: Normal grade-level questions. Some thinking needed. Good for Grade 3-4.
      - If Hard: Tricky questions with close options. Requires strong understanding. Good for Grade 5.

      Return only a valid JSON array. No explanation, no markdown, no extra text.
      
      Each object must follow this exact format:
      {
        "id": "a unique string identifier",
        "question": "The question text",
        "correctAnswer": "The correct answer",
        "wrongOptions": ["wrong1", "wrong2", "wrong3"]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: prompt },
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ],
      config: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    });

    let questions = [];
    try {
      const responseText = response.text || "";
      const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      questions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", response.text);
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

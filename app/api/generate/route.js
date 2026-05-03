import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Extend Vercel serverless function timeout to 60 seconds (max for Hobby plan)
export const maxDuration = 60;

export async function POST(req) {
  try {
    const formData = await req.formData();
    const pdfText = formData.get("pdfText");    // text extracted client-side from PDF
    const file = formData.get("file");           // compressed image (if image upload)
    const difficulty = formData.get("difficulty");
    const questionCount = formData.get("questionCount") || "10";

    if (!pdfText && !file) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      You are an expert teacher creating questions for a classroom smartboard game.
      Read the provided content and generate exactly ${questionCount} multiple-choice questions.
      
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

    let parts = [{ text: prompt }];

    if (pdfText) {
      // PDF: just send the extracted text — no file payload!
      parts.push({ text: `\n\nDocument Content:\n${pdfText}` });
    } else {
      // Image: send as base64 inline data
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString("base64");
      const mimeType = file.type || "image/jpeg";
      parts.push({
        inlineData: { data: base64Data, mimeType }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: { temperature: 0.7 }
    });

    let questions = [];
    try {
      const responseText = response.text ? response.text() : (response.candidates?.[0]?.content?.parts?.[0]?.text || "");
      const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      questions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ 
      error: error?.message || "Internal Server Error",
      details: error?.toString() || ""
    }, { status: 500 });
  }
}

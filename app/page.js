"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("AI is reading your file...");
  const router = useRouter();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.type.startsWith("image/")) {
        setFile(droppedFile);
      } else {
        alert("Please upload a PDF or an Image file.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Extract text from PDF using pdfjs-dist (runs entirely in the browser)
  const extractTextFromPDF = async (pdfFile) => {
    setLoadingMsg("Reading your PDF...");
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += `\n--- Page ${i} ---\n${pageText}`;
    }
    return fullText;
  };

  // Compress image to stay under Vercel's 4.5MB limit
  const compressImage = async (imageFile) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 1200;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height / width) * maxSize; width = maxSize; }
          else { width = (width / height) * maxSize; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.75);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  const generateQuestions = async () => {
    if (!file) {
      alert("Please upload a file or take a picture first!");
      return;
    }
    if (questionCount < 5 || questionCount > 20) {
      alert("Please choose between 5 and 20 questions.");
      return;
    }

    setIsLoading(true);
    setLoadingMsg("Preparing your file...");

    try {
      const formData = new FormData();
      formData.append("difficulty", difficulty);
      formData.append("questionCount", questionCount);

      if (file.type === "application/pdf") {
        // Extract text client-side — no file upload to Vercel!
        const text = await extractTextFromPDF(file);
        if (!text.trim()) throw new Error("Could not extract text from PDF. Try an image instead.");
        formData.append("pdfText", text);
      } else {
        // Compress image before sending
        setLoadingMsg("Compressing image...");
        const compressed = await compressImage(file);
        formData.append("file", compressed, "image.jpg");
      }

      setLoadingMsg("AI is generating questions...");
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate questions");

      sessionStorage.setItem("eduplay_questions", JSON.stringify(data.questions));
      router.push("/editor");
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <main className="container center-flex">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <div className="loading-text">{loadingMsg}</div>
        </div>
      )}

      <h1>EduPlay</h1>
      <p className="mb-4 text-center">Upload a PDF or take a picture of a chapter!</p>

      <div className="upload-controls" style={{ display: 'flex', gap: '2rem', width: '100%', maxWidth: '800px', marginBottom: '2rem' }}>
        <div 
          className={`upload-box ${isDragging ? "drag-active" : ""}`}
          style={{ flex: 1, height: '300px', margin: 0 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input").click()}
        >
          <div className="upload-icon">📄</div>
          <div className="upload-text">
            {file && !file.type.startsWith("image/") ? file.name : "Upload PDF or Image"}
          </div>
          <div className="upload-subtext">Click or Drag & Drop</div>
          <input 
            id="file-input"
            type="file" 
            accept="application/pdf,image/png,image/jpeg,image/webp" 
            className="file-input" 
            onChange={handleFileChange}
            onClick={(e) => { e.stopPropagation(); e.target.value = null; }}
          />
        </div>

        <div 
          className="upload-box"
          style={{ flex: 1, height: '300px', margin: 0, backgroundColor: 'rgba(0, 166, 153, 0.05)', borderColor: 'var(--secondary)' }}
          onClick={() => document.getElementById("camera-input").click()}
        >
          <div className="upload-icon" style={{ color: 'var(--secondary)' }}>📸</div>
          <div className="upload-text">
            {file && file.type.startsWith("image/") ? "Picture Ready ✅" : "Take a Picture"}
          </div>
          <div className="upload-subtext">Use device camera</div>
          <input 
            id="camera-input"
            type="file" 
            accept="image/*" 
            capture="environment"
            className="file-input" 
            onChange={handleFileChange}
            onClick={(e) => { e.stopPropagation(); e.target.value = null; }}
          />
        </div>
      </div>

      <div className="settings-row" style={{ display: 'flex', gap: '4rem', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Difficulty</h3>
          <div className="difficulty-group" style={{ margin: 0 }}>
            {["Easy", "Medium", "Hard"].map((level) => (
              <button
                key={level}
                className={`difficulty-btn ${difficulty === level ? "selected" : ""}`}
                onClick={() => setDifficulty(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Questions</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input 
              type="number" 
              min="5" max="20" 
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
              className="input-field"
              style={{ width: '100px', margin: 0, textAlign: 'center', fontSize: '2rem', fontWeight: 'bold' }}
            />
          </div>
        </div>
      </div>

      <button className="btn btn-primary mt-2" onClick={generateQuestions} style={{ fontSize: '2rem', padding: '1.5rem 4rem' }}>
        Generate Questions ✨
      </button>
    </main>
  );
}

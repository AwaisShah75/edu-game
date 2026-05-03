"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("difficulty", difficulty);
      formData.append("questionCount", questionCount);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();
      
      sessionStorage.setItem("eduplay_questions", JSON.stringify(data.questions));
      router.push("/editor");
    } catch (error) {
      console.error(error);
      alert("Error generating questions. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="container center-flex">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <div className="loading-text">AI is reading your file...</div>
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
            {file && file.type.startsWith("image/") ? "Picture Ready" : "Take a Picture"}
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

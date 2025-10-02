import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { TextItem, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = pdfWorker;

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store/index'; // Assuming store.ts exports these types
import { startEvaluation, evaluationError } from '../store/candidatesSlice';
import {addProfile} from '../store/candidatesSlice';
import type { CandidateProfile } from '../store/candidatesSlice';
import { updateInProgress } from '../store/candidatesSlice';


// --- TYPE DEFINITIONS ---
interface CandidateDetails { name: string | null; email: string | null; phone: string | null; }
interface ChatMessage { sender: 'bot' | 'user'; text: string; }
interface InterviewRecord { question: string; answer: string; difficulty: 'Easy' | 'Medium' | 'Hard'; }

// --- CONSTANTS ---
const INTERVIEW_QUESTIONS_CONFIG: { difficulty: 'Easy' | 'Medium' | 'Hard'; duration: number; }[] = [
  { difficulty: 'Easy', duration: 30 },
  { difficulty: 'Medium', duration: 60 },
];

// Add missing type definition for in-progress interview session
interface InProgressInterview {
  step: 'upload' | 'collectingInfo' | 'ready' | 'interviewing' | 'finished';
  details: CandidateDetails;
  interviewRecords: InterviewRecord[];
}

function IntervieweeView() {
  const dispatch = useDispatch<AppDispatch>();
  const inProgressSession = useSelector((state: RootState) => state.candidates.inProgress);
  const { currentEvaluation } = useSelector((state: RootState) => state.candidates);

  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  const [step, setStep] = useState<'upload' | 'collectingInfo' | 'ready' | 'interviewing' | 'finished'>('upload');
  const [candidateDetails, setCandidateDetails] = useState<CandidateDetails>({ name: null, email: null, phone: null });
  
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');

  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [timer, setTimer] = useState<number>(0);
  const [interviewRecords, setInterviewRecords] = useState<InterviewRecord[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);



  useEffect(() => {
    if (inProgressSession) {
      setStep(inProgressSession.step);
      setCandidateDetails(inProgressSession.details);
      setInterviewRecords(inProgressSession.interviewRecords);

      if (inProgressSession.step === 'interviewing') {
        setQuestionIndex(inProgressSession.interviewRecords.length);
      }
    }
  }, []);

  // --- TIMER ---
  useEffect(() => {
    if (step === 'interviewing') {
      if (timer > 0) {
        timerRef.current = setInterval(() => {
          setTimer((prev) => prev - 1);
        }, 1000);
      } else if (timer === 0 && currentQuestion) {
        handleNextQuestion();
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, timer, currentQuestion]);

  useEffect(() => {
    // We only want to save an active session, not the initial or finished states
    if (step !== 'upload' && step !== 'finished') {
      const currentSessionState: InProgressInterview = {
        step,
        details: candidateDetails,
        interviewRecords,
      };
      dispatch(updateInProgress(currentSessionState));
    }
  }, [step, candidateDetails, interviewRecords, dispatch]);


  // --- AI API FUNCTIONS ---
  const extractDetailsWithAI = async (text: string) => {
    setIsExtracting(true);
    const prompt = `From the following resume text, extract the full name, email address, and phone number. Return a JSON object with keys "name", "email", and "phone".\n\nText: "${text.substring(0, 4000)}"`;
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key not configured.");
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const payload = { contents: [{ parts: [{ text: prompt }] }] };
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`API call failed: ${response.status}`);
      const result = await response.json();
      const rawJson = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleanedJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedDetails: CandidateDetails = JSON.parse(cleanedJson);
      setCandidateDetails(parsedDetails);

      const missing: string[] = [];
      if (!parsedDetails.name) missing.push('name');
      if (!parsedDetails.email) missing.push('email');
      if (!parsedDetails.phone) missing.push('phone');

      if (missing.length > 0) {
        setStep('collectingInfo');
        setMissingFields(missing);
        setChatMessages([{ sender: 'bot', text: "Thanks for the resume. I just need a bit more info." }]);
      } else {
        setStep('ready');
      }
    } catch (err) {
      console.error("AI extraction error:", err);
      setError(err instanceof Error ? err.message : "Failed to extract details.");
    } finally {
      setIsExtracting(false);
    }
  };

  const getInterviewQuestion = async (difficulty: "Easy" | "Medium" | "Hard") => {
    setIsLoading(true);
    setCurrentQuestion("");
    const prompt = `Generate one ${difficulty}-level interview question for a full stack developer role focusing on React and Node.js. Provide only the question text, with no extra words.`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key not configured.");

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const payload = { contents: [{ parts: [{ text: prompt }] }] };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`API call failed: ${response.status}`);

      const result = await response.json();
      const questionText =
        result.candidates?.[0]?.content?.parts?.[0]?.text.trim() ||
        "Could not generate a question.";
      setCurrentQuestion(questionText);
      setTimer(INTERVIEW_QUESTIONS_CONFIG[questionIndex].duration);
    } catch (err) {
      console.error("Question generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate question.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const getAIEvaluation = async (records: InterviewRecord[]) => {
    dispatch(startEvaluation());
    const transcript = records.map((r) => `Question (${r.difficulty}): ${r.question}\nAnswer: ${r.answer}`).join("\n\n");
    const prompt = `As a senior technical interviewer, evaluate the following transcript for a full stack developer role. Provide a final score out of 100 and a concise 2-sentence summary. Return a JSON object with keys "score" and "summary".\n\nTranscript:\n${transcript}`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key not configured.");
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const payload = { contents: [{ parts: [{ text: prompt }] }] };
      const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`API call failed: ${response.status}`);
      const result = await response.json();
      const rawJson = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const cleanedJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
      const evaluation = JSON.parse(cleanedJson);

      const completeProfile: Omit<CandidateProfile, 'id' | 'timestamp'> = {
        details: candidateDetails,
        interviewRecords: records,
        finalScore: evaluation.score || null,
        finalSummary: evaluation.summary || "No summary available.",
      };
      // FIX: This dispatch call now correctly uses the addProfile action creator.
      dispatch(addProfile(completeProfile));
    } catch (err) {
      console.error("Evaluation error:", err);
      dispatch(evaluationError(err instanceof Error ? err.message : "Failed to evaluate."));
    }
  };

  useEffect(() => {
    if (step === "finished" && interviewRecords.length > 0) {
      getAIEvaluation(interviewRecords);
    }
  }, [step, interviewRecords]);

  // --- Handlers ---
  const handleStartInterview = () => {
    setStep('interviewing');
    getInterviewQuestion(INTERVIEW_QUESTIONS_CONFIG[0].difficulty); 
   };

  const handleNextQuestion = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Save the current record
    const record: InterviewRecord = {
      question: currentQuestion,
      answer: currentAnswer,
      difficulty: INTERVIEW_QUESTIONS_CONFIG[questionIndex].difficulty,
    };
    setInterviewRecords((prev: InterviewRecord[]) => [...prev, record]);

    // Reset for next question
    setCurrentAnswer('');

    const nextIndex = questionIndex + 1;
    if (nextIndex < INTERVIEW_QUESTIONS_CONFIG.length) {
      setQuestionIndex(nextIndex);
      getInterviewQuestion(INTERVIEW_QUESTIONS_CONFIG[nextIndex].difficulty);
    } else {
      setStep('finished'); // End of interview
    }
   };

  // FIXED: This function now calls extractDetailsWithAI.
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setIsLoading(true);
    const file = event.target.files?.[0];
    if (!file) { setIsLoading(false); return; }
    if (file.type !== "application/pdf") { setError("Invalid file type."); setIsLoading(false); return; }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf: PDFDocumentProxy = await getDocument(arrayBuffer).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item) => (item as TextItem).str).join(" ") + "\n";
      }
      // Call the AI to get name/email/phone
      await extractDetailsWithAI(fullText);
    } catch (err) {
      console.error("PDF parsing error:", err);
      setError("Error parsing your PDF file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = (e: FormEvent) => { e.preventDefault(); if (!userInput.trim() || missingFields.length === 0) return; const currentField = missingFields[0] as keyof CandidateDetails; setChatMessages(prev => [...prev, { sender: 'user', text: userInput }]); setCandidateDetails(prev => ({ ...prev, [currentField]: userInput })); setMissingFields(prev => prev.slice(1)); setUserInput(''); };

  return (
    <div>
      {step === "upload" && ( <div><h2>Step 1: Upload Your Resume</h2> <p>Please upload your resume in PDF format to begin.</p> <input type="file" accept=".pdf" onChange={handleFileChange} disabled={isLoading || isExtracting} /> {isLoading && <p>Parsing your resume...</p>} {isExtracting && <p>Extracting details with AI...</p>} </div> )}
      
      {step === "collectingInfo" && ( <div> <h3>Chat</h3> <div style={{ height: '300px', border: '1px solid #ccc', overflowY: 'auto', padding: '10px' }}> {chatMessages.map((msg, index) => ( <p key={index} style={{ textAlign: msg.sender === 'bot' ? 'left' : 'right' }}> <strong>{msg.sender === 'bot' ? 'Bot' : 'You'}:</strong> {msg.text} </p> ))} </div> <form onSubmit={handleChatSubmit}> <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} style={{ width: '80%', padding: '8px' }} placeholder="Type your answer..."/> <button type="submit" style={{ width: '18%', padding: '8px' }}>Send</button> </form> </div> )}

      {step === "ready" && (
        <div>
          <h3>Candidate Details</h3>
          {/* Display confirmed details before starting */}
          <p><strong>Name:</strong> {candidateDetails.name}</p>
          <p><strong>Email:</strong> {candidateDetails.email}</p>
          <p><strong>Phone:</strong> {candidateDetails.phone}</p>
          <button onClick={handleStartInterview}>Start Interview</button>
        </div>
      )}

      {step === "interviewing" && ( 
        <div> 
          <h3>Question {questionIndex + 1} of {INTERVIEW_QUESTIONS_CONFIG.length}</h3>
          <p><strong>Time Remaining: {timer}s</strong></p>
          <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #eee', background: '#f9f9f9' }}>
            <p>{isLoading ? 'Generating question...' : currentQuestion}</p>
          </div>
          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            disabled={isLoading}
            style={{ width: '100%', minHeight: '150px', padding: '10px' }}
            placeholder="Type your answer here..."
          />
          <button onClick={handleNextQuestion} disabled={isLoading} style={{ marginTop: '10px', padding: '10px 20px' }}>
            Submit and Next Question
          </button>
         </div> 
        )}

      {step === "finished" && (
        <div>
          <h3>Interview Finished</h3>
          {currentEvaluation.status === 'loading' && <p>Evaluating...</p>}
          {currentEvaluation.status === 'succeeded' && currentEvaluation.data && (
            <div>
              <p><strong>Score:</strong> {currentEvaluation.data.score}/100</p>
              <p><strong>Summary:</strong> {currentEvaluation.data.summary}</p>
            </div>
          )}
          {currentEvaluation.status === 'failed' && (
            <p style={{ color: "red" }}>{currentEvaluation.error}</p>
          )}
        </div>
      )}



      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default IntervieweeView;
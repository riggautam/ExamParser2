
import React, { useState, useCallback } from 'react';
import { Exam } from './types';
import { parseExam, getFirstPdfPageAsImage } from './services/geminiService';
import FileUpload from './components/FileUpload';
import ExamDisplay from './components/ExamDisplay';
import Loader from './components/Loader';
import ErrorMessage from './components/ErrorMessage';

function App() {
  const [examData, setExamData] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Fix: Removed direct API key handling from the component.
  // The service layer is now responsible for using the environment variable.

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setExamData(null);
    
    // Generate preview
    if (file.type === 'application/pdf') {
      try {
        const previewUrl = await getFirstPdfPageAsImage(file);
        setFilePreview(previewUrl);
      } catch (e) {
          console.error("Failed to generate PDF preview", e);
          setFilePreview(null);
      }
    } else {
      setFilePreview(URL.createObjectURL(file));
    }

    try {
      const data = await parseExam(file);
      setExamData(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const renderContent = () => {
    // Fix: Removed manual API key check. Errors are handled by the try/catch in handleFileUpload.
    return (
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
              <h2 className="text-xl font-semibold mb-4 text-center">Upload Your Exam Paper</h2>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Upload an image or PDF of a biomedical exam paper. The AI will analyze it, extract the questions, and provide answers.
              </p>
              <FileUpload onFileUpload={handleFileUpload} disabled={isLoading} />
            </div>

            {isLoading && <Loader />}
            {error && <ErrorMessage message={error} />}
            
            {examData && filePreview && (
              <div className="mt-8 flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Uploaded File Preview</h3>
                    <img src={filePreview} alt="Exam paper preview" className="rounded-lg shadow-md w-full" />
                </div>
                <div className="lg:w-2/3">
                  <ExamDisplay exam={examData} />
                </div>
              </div>
            )}

            {!isLoading && !examData && !error && (
               <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="mt-4 text-lg">Your parsed exam will appear here.</p>
              </div>
            )}
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">
            Gemini Exam Parser
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">AI-Powered Exam Analysis</p>
        </div>
      </header>
      {renderContent()}
    </div>
  );
}

export default App;

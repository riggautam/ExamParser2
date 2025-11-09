
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
import { Exam } from '../types';

// Configure the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const pdfToGenerativeParts = async (file: File) => {
    const fileBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const numPages = pdf.numPages;
    const parts = [];

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // Higher scale for better quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        const base64EncodedData = canvas.toDataURL('image/jpeg').split(',')[1];
        parts.push({
            inlineData: { data: base64EncodedData, mimeType: 'image/jpeg' },
        });
    }
    return parts;
};

export const getFirstPdfPageAsImage = async (file: File): Promise<string> => {
    const fileBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    
    if (pdf.numPages === 0) {
        throw new Error("PDF has no pages.");
    }

    const page = await pdf.getPage(1); // Get the first page
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    return canvas.toDataURL('image/jpeg');
};


const systemPrompt = `You are an expert exam parser specialized in extracting structured data from biomedical examination PDFs or images. Your task is to process a series of exam paper images (which may be pages from a single PDF document) and output well-organized JSON containing all questions, options, metadata, and answers.

Output Structure:
You MUST return ONLY a single valid JSON object. Do not include any other text or markdown formatting. The JSON structure should be as follows:
{
  "exam_metadata": {
    "course_code": "string",
    "course_name": "string",
    "institution": "string",
    "year": integer,
    "semester": "string",
    "exam_duration_minutes": integer,
    "total_marks": integer | null
  },
  "sections": [
    {
      "section_id": "string",
      "section_name": "string",
      "recommended_time_minutes": integer | null,
      "total_questions": integer,
      "questions": [
        {
          "question_number": integer,
          "question_text": "string",
          "marks": number | null,
          "type": "one of 'multiple_choice', 'short_answer', etc.",
          "options": [ { "option_id": "string", "text": "string" } ],
          "correct_answer": "string (option_id for MCQs)",
          "explanation": "string (for MCQs)",
          "model_answer": "string (for short/long answers)",
          "topic_tags": ["string"]
        }
      ]
    }
  ]
}

Extraction Rules:
1.  **Question Identification:** Detect question numbers. Preserve all question text including context paragraphs. Collate information across all pages into a single, cohesive JSON output. Questions might span across page breaks.
2.  **Mark Allocation:** Look for patterns like "[1.5 marks]", "(5 marks)", "Total Q41: 5 marks".
3.  **Answer Inference:** For MCQs without provided answers, use your biomedical knowledge to determine the most likely correct answer. For short answers, generate a concise model answer.
4.  **Topic Tagging:** Auto-tag questions with relevant topics (e.g., cardiovascular, respiratory, neuromuscular).
5.  **Data Integrity:** Ensure all text is extracted accurately. Pay close attention to details from all provided exam paper images.
`;


export const parseExam = async (file: File): Promise<Exam> => {
  // Fix: Use process.env.API_KEY as per @google/genai guidelines.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Configuration Error: The API_KEY environment variable is not set. Please add it to your deployment settings and redeploy.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const text_prompt = {
    text: "Analyze the following exam paper images and extract the content into the specified JSON format."
  };

  let imageParts;
  if (file.type === 'application/pdf') {
      imageParts = await pdfToGenerativeParts(file);
  } else {
      imageParts = [await fileToGenerativePart(file)];
  }
  
  const contents = {
    parts: [text_prompt, ...imageParts],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
    }
  });

  const resultText = response.text;
  if (!resultText) {
      throw new Error("The AI returned an empty response. The document might be unreadable or contain no relevant content.");
  }
  
  try {
    // Clean up potential markdown formatting before parsing.
    const cleanedText = resultText.trim().replace(/^```json\n?/, '').replace(/```\n?$/, '');
    const parsedJson = JSON.parse(cleanedText);
    return parsedJson as Exam;
  } catch (e) {
    console.error("Failed to parse JSON response from Gemini:", resultText);
    throw new Error("The AI returned data in an unexpected format. Please try again with a different file.");
  }
};

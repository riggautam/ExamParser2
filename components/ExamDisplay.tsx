
import React from 'react';
import { Exam, Question, Option } from '../types';

interface ExamDisplayProps {
  exam: Exam;
}

const MetadataCard: React.FC<{ metadata: Exam['exam_metadata'] }> = ({ metadata }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
    <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">{metadata.course_name} ({metadata.course_code})</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
      <div>
        <p className="font-semibold text-gray-600 dark:text-gray-400">Institution</p>
        <p>{metadata.institution}</p>
      </div>
      <div>
        <p className="font-semibold text-gray-600 dark:text-gray-400">Year</p>
        <p>{metadata.year}</p>
      </div>
      <div>
        <p className="font-semibold text-gray-600 dark:text-gray-400">Semester</p>
        <p>{metadata.semester}</p>
      </div>
      <div>
        <p className="font-semibold text-gray-600 dark:text-gray-400">Duration</p>
        <p>{metadata.exam_duration_minutes} mins</p>
      </div>
      {metadata.total_marks && (
        <div>
          <p className="font-semibold text-gray-600 dark:text-gray-400">Total Marks</p>
          <p>{metadata.total_marks}</p>
        </div>
      )}
    </div>
  </div>
);

const McqOption: React.FC<{ option: Option, isCorrect: boolean }> = ({ option, isCorrect }) => {
    const baseClasses = "flex items-start p-3 rounded-md transition-all duration-200";
    const correctClasses = "bg-green-100 dark:bg-green-900/50 border border-green-400 dark:border-green-600";
    const incorrectClasses = "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700";
    return (
        <div className={`${baseClasses} ${isCorrect ? correctClasses : incorrectClasses}`}>
            <div className={`w-6 h-6 flex-shrink-0 mr-3 rounded-full flex items-center justify-center font-bold text-sm ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>
                {option.option_id}
            </div>
            <span className="flex-1">{option.text}</span>
        </div>
    );
};


const QuestionCard: React.FC<{ question: Question }> = ({ question }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md mb-4 border-l-4 border-blue-500">
    <div className="flex justify-between items-start mb-3">
      <h4 className="font-bold text-lg">Question {question.question_number}</h4>
      {question.marks && <span className="text-sm font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-full">{question.marks} marks</span>}
    </div>
    <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">{question.question_text}</p>
    
    {question.type === 'multiple_choice' && question.options && (
      <div className="space-y-3">
        {question.options.map(opt => (
          <McqOption key={opt.option_id} option={opt} isCorrect={opt.option_id === question.correct_answer} />
        ))}
        {question.explanation && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-sm">
            <p><span className="font-bold">Explanation:</span> {question.explanation}</p>
          </div>
        )}
      </div>
    )}

    {question.type === 'short_answer' && question.model_answer && (
       <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-sm">
         <p className="font-bold mb-1">Model Answer:</p>
         <p className="whitespace-pre-wrap">{question.model_answer}</p>
       </div>
    )}

    {question.topic_tags && (
        <div className="mt-4 flex flex-wrap gap-2">
            {question.topic_tags.map((tag, index) => (
                <span key={index} className="text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full">{tag}</span>
            ))}
        </div>
    )}
  </div>
);


const ExamDisplay: React.FC<ExamDisplayProps> = ({ exam }) => {
  return (
    <div>
      <MetadataCard metadata={exam.exam_metadata} />

      {exam.sections.map((section, index) => (
        <div key={index} className="mb-8">
          <div className="border-b-2 border-gray-200 dark:border-gray-700 pb-2 mb-4">
            <h3 className="text-xl font-semibold">Section {section.section_id}: {section.section_name}</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex space-x-4">
                <span>{section.total_questions} questions</span>
                {section.recommended_time_minutes && <span>~{section.recommended_time_minutes} minutes</span>}
            </div>
          </div>
          {section.questions.map(q => (
            <QuestionCard key={q.question_number} question={q} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ExamDisplay;

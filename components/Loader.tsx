
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Analyzing Exam...</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while the AI processes the document.</p>
    </div>
  );
};

export default Loader;

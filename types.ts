
export interface ExamMetadata {
  course_code: string;
  course_name: string;
  institution: string;
  year: number;
  semester: string;
  exam_duration_minutes: number;
  total_marks: number | null;
}

export interface Option {
  option_id: string;
  text: string;
}

export interface Question {
  question_number: number;
  question_text: string;
  marks: number | null;
  type: 'multiple_choice' | 'short_answer' | 'extended_response' | 'diagram' | 'calculation';
  options?: Option[];
  correct_answer?: string;
  explanation?: string;
  model_answer?: string;
  topic_tags?: string[];
  sub_parts?: any;
}

export interface Section {
  section_id: string;
  section_name: string;
  recommended_time_minutes: number | null;
  total_questions: number;
  questions: Question[];
}

export interface Exam {
  exam_metadata: ExamMetadata;
  sections: Section[];
}

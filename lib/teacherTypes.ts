export type TeacherClass = {
  id: string;
  name: string;
  classCode: string;
  createdAt: string;
};

export type StudentEnrollment = {
  id: string;
  classId: string;
  displayName: string;
  joinedAt: string;
};

export type TeacherAssignment = {
  id: string;
  classId: string;
  category: string;
  question: string;
  dueDate?: string;
  createdAt: string;
};

export type GrowthLevel = "emerging" | "developing" | "strong";

export type StudentProgress = {
  id: string;
  assignmentId: string;
  studentName: string;
  status: "not_started" | "in_progress" | "completed";
  completedAt?: string;
  reasoningGrowth: {
    evidenceUse: GrowthLevel;
    reflectionQuality: GrowthLevel;
    perspectiveTaking: GrowthLevel;
  };
};

export type TeacherComment = {
  id: string;
  assignmentId: string;
  studentName: string;
  comment: string;
  createdAt: string;
};

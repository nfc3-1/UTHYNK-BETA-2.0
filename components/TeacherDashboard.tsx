'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  GrowthLevel,
  StudentProgress,
  TeacherAssignment,
  TeacherClass,
  TeacherComment,
} from '@/lib/teacherTypes';

type QuestionBank = Record<string, string[]>;

type Props = {
  questionBank: QuestionBank;
};

type PersistedTeacherState = {
  classes: TeacherClass[];
  assignments: TeacherAssignment[];
  comments: TeacherComment[];
};

const storageKey = 'uthynk-teacher-v1';

const demoStudents = ['Maya Chen', 'Jordan Ellis', 'Avery Brooks', 'Sam Rivera'];

const statusLabels: Record<StudentProgress['status'], string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const growthLabels: Record<GrowthLevel, string> = {
  emerging: 'Emerging',
  developing: 'Developing',
  strong: 'Strong',
};

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function createClassCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `UTH-${code}`;
}

function demoProgressForAssignment(assignment: TeacherAssignment): StudentProgress[] {
  return demoStudents.map((studentName, index) => {
    const status: StudentProgress['status'] =
      index === 0 ? 'completed' : index === 1 ? 'in_progress' : 'not_started';
    const completedAt = status === 'completed'
      ? new Date(Date.now() - 86_400_000).toISOString()
      : undefined;

    return {
      id: `${assignment.id}-${index}`,
      assignmentId: assignment.id,
      studentName,
      status,
      completedAt,
      reasoningGrowth: {
        evidenceUse: index === 0 ? 'strong' : index === 1 ? 'developing' : 'emerging',
        reflectionQuality: index === 2 ? 'emerging' : 'developing',
        perspectiveTaking: index === 0 ? 'strong' : index === 3 ? 'emerging' : 'developing',
      },
    };
  });
}

function formatDate(value?: string) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export default function TeacherDashboard({ questionBank }: Props) {
  const categories = useMemo(() => Object.keys(questionBank), [questionBank]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [comments, setComments] = useState<TeacherComment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [className, setClassName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
  const [selectedQuestion, setSelectedQuestion] = useState(questionBank[categories[0]]?.[0] || '');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(demoStudents[0]);
  const [commentDraft, setCommentDraft] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        setHydrated(true);
        return;
      }

      const parsed = JSON.parse(stored) as PersistedTeacherState;
      setClasses(parsed.classes || []);
      setAssignments(parsed.assignments || []);
      setComments(parsed.comments || []);
      setSelectedClassId(parsed.classes?.[0]?.id || '');
    } catch {
      localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!categories.length) return;

    if (!selectedCategory || !questionBank[selectedCategory]) {
      setSelectedCategory(categories[0]);
      setSelectedQuestion(questionBank[categories[0]]?.[0] || '');
    }
  }, [categories, questionBank, selectedCategory]);

  useEffect(() => {
    const questions = questionBank[selectedCategory] || [];

    if (!questions.includes(selectedQuestion)) {
      setSelectedQuestion(questions[0] || '');
    }
  }, [questionBank, selectedCategory, selectedQuestion]);

  useEffect(() => {
    if (!hydrated) return;

    const payload: PersistedTeacherState = { classes, assignments, comments };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [assignments, classes, comments, hydrated]);

  const selectedClass = classes.find((item) => item.id === selectedClassId) || classes[0];
  const selectedClassAssignments = assignments.filter((item) => item.classId === selectedClass?.id);
  const activeAssignment =
    selectedClassAssignments.find((item) => item.id === selectedAssignmentId) ||
    selectedClassAssignments[0];
  const progressRows = activeAssignment ? demoProgressForAssignment(activeAssignment) : [];
  const selectedAssignmentComments = comments.filter((item) => item.assignmentId === activeAssignment?.id);

  function createClass() {
    const cleanName = className.trim();
    if (!cleanName) return;

    const nextClass: TeacherClass = {
      id: createId('class'),
      name: cleanName,
      classCode: createClassCode(),
      createdAt: new Date().toISOString(),
    };

    setClasses((current) => [nextClass, ...current]);
    setSelectedClassId(nextClass.id);
    setClassName('');
    setSelectedAssignmentId('');
  }

  function assignChallenge() {
    if (!selectedClass || !selectedCategory || !selectedQuestion) return;

    const nextAssignment: TeacherAssignment = {
      id: createId('assignment'),
      classId: selectedClass.id,
      category: selectedCategory,
      question: selectedQuestion,
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString(),
    };

    setAssignments((current) => [nextAssignment, ...current]);
    setSelectedAssignmentId(nextAssignment.id);
    setDueDate('');
  }

  async function copyClassCode() {
    if (!selectedClass?.classCode) return;

    try {
      await navigator.clipboard.writeText(selectedClass.classCode);
      setCopyStatus('Demo class code copied; enrollment is not available yet.');
    } catch {
      setCopyStatus('Demo class code is shown below; enrollment is not available yet.');
    }
  }

  function saveComment() {
    if (!activeAssignment || !commentDraft.trim()) return;

    const nextComment: TeacherComment = {
      id: createId('comment'),
      assignmentId: activeAssignment.id,
      studentName: selectedStudent,
      comment: commentDraft.trim(),
      createdAt: new Date().toISOString(),
    };

    setComments((current) => [nextComment, ...current]);
    setCommentDraft('');
  }

  return (
    <section className="teacherShell">
      <section className="card teacherPanel" aria-label="Teacher demo notice" style={{ marginBottom: 18 }}>
        <div className="panelLabel">Demo workspace</div>
        <h2>Fictional students and sample results</h2>
        <p>All student names, completion statuses, dates, and reasoning indicators below are generated examples. They are not student submissions or measured learning gains.</p>
        <p>Classes, assignments, and comments are saved only in this browser. Nothing is sent to students, and class codes do not enroll students yet. Use fictional information while trying this demo.</p>
      </section>
      <div className="teacherGrid">
        <aside className="teacherStack">
          <section className="card teacherPanel">
            <div className="panelLabel">Create Demo Class</div>
            <h2>Try a demo class</h2>
            <label className="teacherField">
              <span>Class name</span>
              <input
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                placeholder="Example: Period 2 Reasoning Lab"
              />
            </label>
            <button className="btn btnPrimary" type="button" onClick={createClass}>
              Create Demo Class
            </button>
          </section>

          <section className="card teacherPanel">
            <div className="panelLabel">Demo Classes</div>
            {classes.length ? (
              <div className="teacherClassList">
                {classes.map((item) => (
                  <button
                    className={item.id === selectedClass?.id ? 'active' : ''}
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedClassId(item.id);
                      setSelectedAssignmentId('');
                    }}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.classCode}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="teacherMuted">Create a demo class to explore the sample workflow.</p>
            )}
          </section>
        </aside>

        <section className="card teacherPanel teacherDetailPanel">
          {selectedClass ? (
            <>
              <div className="teacherDetailHeader">
                <div>
                  <div className="panelLabel">Selected Class</div>
                  <h2>{selectedClass.name}</h2>
                  <p className="teacherMuted">Created {formatDate(selectedClass.createdAt)}</p>
                </div>
                <div className="teacherCodeBox">
                  <span>Class Code</span>
                  <strong>{selectedClass.classCode}</strong>
                  <button className="btn" type="button" onClick={copyClassCode}>Copy</button>
                </div>
              </div>

              <div className="teacherInvite">
                <p>This is a sample class code. It cannot enroll students.</p>
                <span>Student enrollment and persistent classroom records are planned for the classroom backend sprint.</span>
                {copyStatus ? <small>{copyStatus}</small> : null}
              </div>

              <div className="teacherTwoColumn">
                <section className="teacherSubPanel">
                  <div className="panelLabel">Save Demo Assignment</div>
                  <label className="teacherField">
                    <span>Category</span>
                    <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label className="teacherField">
                    <span>Question</span>
                    <select value={selectedQuestion} onChange={(event) => setSelectedQuestion(event.target.value)}>
                      {(questionBank[selectedCategory] || []).map((question) => (
                        <option key={question} value={question}>{question}</option>
                      ))}
                    </select>
                  </label>
                  <label className="teacherField">
                    <span>Due date optional</span>
                    <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                  </label>
                  <button className="btn btnPrimary" type="button" onClick={assignChallenge}>
                    Save Demo Assignment
                  </button>
                </section>

                <section className="teacherSubPanel">
                  <div className="panelLabel">Assignments</div>
                  {selectedClassAssignments.length ? (
                    <div className="teacherAssignmentList">
                      {selectedClassAssignments.map((assignment) => (
                        <button
                          className={assignment.id === activeAssignment?.id ? 'active' : ''}
                          key={assignment.id}
                          type="button"
                          onClick={() => setSelectedAssignmentId(assignment.id)}
                        >
                          <span>{assignment.category}</span>
                          <strong>{assignment.question}</strong>
                          <small>{assignment.dueDate ? `Due ${formatDate(assignment.dueDate)}` : 'No due date'}</small>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="teacherMuted">Assigned questions will appear here for the selected class.</p>
                  )}
                </section>
              </div>

              <section className="teacherSubPanel">
                <div className="teacherSectionHeader">
                  <div>
                    <div className="panelLabel">Sample Student Progress</div>
                    <h3>{activeAssignment ? activeAssignment.category : 'No assignment selected'}</h3>
                  </div>
                  {activeAssignment ? <span>{formatDate(activeAssignment.createdAt)}</span> : null}
                </div>
                {activeAssignment ? (
                  <div className="teacherProgressTable" aria-label="Fictional student results">
                    <div className="teacherProgressHead">
                      <span>Student name</span>
                      <span>Sample status</span>
                      <span>Sample completion date</span>
                      <span>Evidence Use</span>
                      <span>Reflection Quality</span>
                      <span>Perspective Taking</span>
                    </div>
                    {progressRows.map((row) => (
                      <div className="teacherProgressRow" key={row.id}>
                        <strong>{row.studentName} (demo)</strong>
                        <span>{statusLabels[row.status]}</span>
                        <span>{formatDate(row.completedAt)}</span>
                        <span>{growthLabels[row.reasoningGrowth.evidenceUse]}</span>
                        <span>{growthLabels[row.reasoningGrowth.reflectionQuality]}</span>
                        <span>{growthLabels[row.reasoningGrowth.perspectiveTaking]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="teacherMuted">Save a demo assignment to see fictional progress examples.</p>
                )}
              </section>

              <section className="teacherSubPanel">
                <div className="panelLabel">Demo Comments</div>
                <p className="teacherMuted">Try a practice comment. It stays in this browser and is not delivered to a student.</p>
                <div className="teacherCommentGrid">
                  <label className="teacherField">
                    <span>Assignment</span>
                    <select
                      value={activeAssignment?.id || ''}
                      onChange={(event) => setSelectedAssignmentId(event.target.value)}
                      disabled={!selectedClassAssignments.length}
                    >
                      {selectedClassAssignments.map((assignment) => (
                        <option key={assignment.id} value={assignment.id}>{assignment.category} - {assignment.question}</option>
                      ))}
                    </select>
                  </label>
                  <label className="teacherField">
                    <span>Student</span>
                    <select value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)}>
                      {demoStudents.map((student) => (
                        <option key={student} value={student}>{student} (demo)</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="teacherField">
                  <span>Comment</span>
                  <textarea
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Example: Strong use of evidence. Next time, compare one opposing perspective before concluding."
                  />
                </label>
                <button className="btn btnPrimary" type="button" onClick={saveComment} disabled={!activeAssignment}>
                  Save Demo Comment
                </button>

                {selectedAssignmentComments.length ? (
                  <div className="teacherCommentList">
                    {selectedAssignmentComments.map((comment) => (
                      <article key={comment.id}>
                        <span>{comment.studentName} - {formatDate(comment.createdAt)}</span>
                        <p>{comment.comment}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="teacherMuted">Saved comments for the selected assignment will appear here.</p>
                )}
              </section>
            </>
          ) : (
            <div className="teacherEmptyState">
              <div className="panelLabel">Selected Class</div>
              <h2>Create a demo class to explore the teacher workflow.</h2>
              <p>This preview stores demo classes, assignments, and practice comments only in this browser.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

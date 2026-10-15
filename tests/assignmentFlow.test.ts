import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import Lesson from "../components/LessonQuestionClient";
import {
  challengeSessionKey,
  createChallengeSession,
} from "../lib/challengeSession";
import { lessonQuestions } from "../lib/lessonQuestions";
import { setStoredLanguageValue } from "../lib/reasoningI18n";
vi.mock("next/link", () => ({ default: "a" }));
vi.mock("../lib/telemetry", () => ({
  createTelemetryEvent: () => ({}),
  trackEvent() {},
}));
let page: ReactTestRenderer;
afterEach(() => {
  if (page) act(() => page.unmount());
  vi.unstubAllGlobals();
});
describe("assigned lesson server recovery", () => {
  it("restores a submitted first answer on another browser and preserves the assignment identity through languages and completion", async () => {
    const q = lessonQuestions[0],
      assignmentId = "33333333-3333-4333-8333-333333333333";
    const server = {
      ...createChallengeSession({
        assignmentId,
        userId: "learner-1",
        ageBand: "18_plus",
        category: q.category,
        language: "es",
        questionId: q.id,
        questionIndex: 0,
        originalQuestion: q.source,
        sessionId: "saved-session",
        conversationId: "saved-session",
      }),
      firstResponse: "Previously submitted answer",
      perspectiveExpansion: "A saved angle.",
      secondaryQuestion: "What evidence matters?",
      step: "secondary_question" as const,
    };
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => storage.get(k) || null,
      setItem: (k: string, v: string) => storage.set(k, v),
    });
    const events = new EventTarget();
    vi.stubGlobal("window", {
      localStorage,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events),
      setTimeout() {},
    });
    const requests: any[] = [];
    vi.stubGlobal("fetch", async (_url: string, options: any) => {
      requests.push(JSON.parse(options.body));
      return Response.json({
        finalSynthesis: "A saved final synthesis.",
        assessment: {
          rubricVersion: "reasoning-20-v1",
          earned: 16,
          possible: 20,
          percentage: 80,
          criteria: ["claim", "evidence", "alternatives", "conclusion"].map(
            (id) => ({
              id,
              points: 4,
              possible: 5,
              evidence: ["My second answer"],
            }),
          ),
        },
      });
    });
    act(() => {
      page = create(
        createElement(Lesson, {
          assignmentId,
          category: q.category,
          questions: [q.source],
          questionIds: [q.id],
          sessionUserId: "learner-1",
          initialSession: server,
        }),
      );
    });
    expect(JSON.stringify(page.toJSON())).toContain(
      "Previously submitted answer",
    );
    expect(page.root.findByType("textarea").props.value).toBe("");
    act(() =>
      page.root
        .findByType("textarea")
        .props.onChange({ target: { value: "My second answer" } }),
    );
    act(() => setStoredLanguageValue("fr"));
    expect(page.root.findByType("textarea").props.value).toBe(
      "My second answer",
    );
    const submit = page.root
      .findAllByType("button")
      .find((b) => b.props.className === "btn btnPrimary")!;
    await act(async () => {
      await submit.props.onClick();
    });
    expect(requests[0]).toMatchObject({
      assignmentId,
      sessionId: "saved-session",
      firstUserAnswer: "Previously submitted answer",
      secondUserAnswer: "My second answer",
      language: "fr",
      phase: "synthesis",
    });
    expect(page.root.findAllByType("textarea")).toHaveLength(0);
    expect(JSON.stringify(page.toJSON())).toContain("16");
    const assigned = challengeSessionKey(server),
      ordinary = challengeSessionKey({ ...server, assignmentId: undefined });
    expect(assigned).not.toBe(ordinary);
    expect(storage.has(ordinary)).toBe(false);
    expect(JSON.parse(storage.get(assigned)!).assessment.earned).toBe(16);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import TeacherDashboard from "../components/TeacherDashboard";
vi.mock("next/link", () => ({ default: "a" }));
let page: ReactTestRenderer;
afterEach(() => {
  if (page) act(() => page.unmount());
  vi.unstubAllGlobals();
});
describe("persistent teacher workspace", () => {
  it("renders actual API records and functional assignment links, without generating learners or scores", async () => {
    const calls: any[] = [];
    const payload = {
      classes: [
        { id: "class-1", title: "Reasoning class", join_code: "ABCDEF123456" },
      ],
      selected: "class-1",
      manage: true,
      canTeach: true,
      members: [],
      assignments: [
        { id: "assignment-1", title: "A saved reading", due_date: null },
      ],
      submissions: [],
      comments: [],
      leaderboard: [],
    };
    vi.stubGlobal("fetch", async (url: string, options: any) => {
      calls.push({ url, options });
      return Response.json(payload);
    });
    await act(async () => {
      page = create(createElement(TeacherDashboard, { catalog: [] }));
    });
    const text = JSON.stringify(page.toJSON());
    expect(text).toContain("No learners have joined yet");
    expect(text).toContain("No answers have been submitted yet");
    expect(text).not.toMatch(/Maya Chen|Jordan Ellis|Fictional|Demo Class/);
    expect(
      page.root
        .findAllByType("a")
        .some((a) => a.props.href === "/classroom/assignments/assignment-1"),
    ).toBe(true);
    const input = page.root.findAllByType("input")[0];
    act(() => input.props.onChange({ target: { value: "New class" } }));
    const button = page.root
      .findAllByType("button")
      .find((b) => b.children.join("") === "Create Class")!;
    await act(async () => {
      await button.props.onClick();
    });
    expect(
      calls.some(
        (c) =>
          c.url === "/api/classroom" &&
          c.options?.method === "POST" &&
          JSON.parse(c.options.body).action === "create_class",
      ),
    ).toBe(true);
  });
  it('keeps teacher comment drafts with the selected learner and assignment', async () => {
    const payload = { classes: [{ id: 'class', title: 'Class' }], selected: 'class', viewerId: 'teacher', manage: true, canTeach: true,
      members: [{ profile_id: 'one', display_name: 'Learner One', active: true }, { profile_id: 'two', display_name: 'Learner Two', active: true }],
      assignments: [{ id: 'reading', title: 'Saved reading' }], submissions: [{ assignment_id: 'reading', learner_id: 'one', first_answer: 'One' }, { assignment_id: 'reading', learner_id: 'two', first_answer: 'Two' }], comments: [], leaderboard: [] };
    const posts: any[] = [];
    vi.stubGlobal('fetch', async (url: string, options: any) => { if (options?.method === 'POST') posts.push(JSON.parse(options.body)); return Response.json(payload); });
    await act(async () => { page = create(createElement(TeacherDashboard, { catalog: [] })); });
    const select = (name: string) => act(() => page.root.findAllByType('button').find(b => b.children.some(c => c === name))!.props.onClick());
    select('Learner One'); act(() => page.root.findByType('textarea').props.onChange({ target: { value: 'Comment for One' } }));
    select('Learner Two'); expect(page.root.findByType('textarea').props.value).toBe('');
    act(() => page.root.findByType('textarea').props.onChange({ target: { value: 'Comment for Two' } }));
    select('Learner One'); expect(page.root.findByType('textarea').props.value).toBe('Comment for One');
    await act(async () => { await page.root.findAllByType('button').find(b => b.children.join('') === 'Save Comment')!.props.onClick(); });
    expect(posts).toContainEqual(expect.objectContaining({ action: 'comment', learnerId: 'one', assignmentId: 'reading', comment: 'Comment for One' }));
    select('Learner Two'); expect(page.root.findByType('textarea').props.value).toBe('Comment for Two');
  });

});

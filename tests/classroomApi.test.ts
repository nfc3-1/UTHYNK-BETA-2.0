import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "../app/api/classroom/route";
const state = vi.hoisted(() => ({
  userId: "server-user" as string | null,
  mutation: vi.fn(),
  snapshot: vi.fn(),
}));
vi.mock("../lib/classroom", async (original) => {
  const actual = await original<any>();
  return {
    ...actual,
    classroomActor: async () => {
      if (!state.userId) throw new actual.ClassroomError("Sign in", 401);
      return { userId: state.userId, role: "teacher", sections: [] };
    },
    classroomMutation: state.mutation,
    classroomSnapshot: state.snapshot,
  };
});
beforeEach(() => {
  state.userId = "server-user";
  vi.clearAllMocks();
  state.snapshot.mockResolvedValue({
    classes: [],
    assignments: [],
    leaderboard: [],
  });
  state.mutation.mockResolvedValue({ saved: true });
});
function post(body: any, origin = "http://localhost") {
  return POST(
    new Request("http://localhost/api/classroom", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}
describe("classroom API boundary", () => {
  it("requires a verified session and prohibits cross-origin mutations", async () => {
    state.userId = null;
    expect(
      (await GET(new Request("http://localhost/api/classroom"))).status,
    ).toBe(401);
    expect((await post({ action: "join" })).status).toBe(401);
    state.userId = "server-user";
    expect(
      (await post({ action: "assign" }, "https://other.example")).status,
    ).toBe(403);
    expect(state.mutation).not.toHaveBeenCalled();
  });
  it("derives the actor from the server and marks private reads uncacheable", async () => {
    const r = await GET(
      new Request("http://localhost/api/classroom?classId=selected"),
    );
    expect(r.headers.get("cache-control")).toBe("private, no-store");
    expect(state.snapshot).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "server-user" }),
      "selected",
    );
    expect(
      (
        await post({
          action: "assign",
          userId: "forged-user",
          teacher_id: "forged-user",
        })
      ).status,
    ).toBe(200);
    expect(state.mutation.mock.calls[0][0].userId).toBe("server-user");
  });
});

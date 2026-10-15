import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "../app/api/schools/route";
import {
  schoolCapabilities,
  teachingSchools,
  teachesAtSchool,
} from "../lib/schoolAccess";
const state = vi.hoisted(() => ({
  access: {
    userId: "server-user" as string | null,
    role: "user",
    sections: [],
  },
  rpc: vi.fn(),
}));
vi.mock("../lib/accessControl", () => ({
  getAccountAccess: async () => state.access,
}));
vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: { rpc: (...a: unknown[]) => state.rpc(...a) },
}));
beforeEach(() => {
  state.access = { userId: "server-user", role: "user", sections: [] };
  state.rpc.mockReset();
  state.rpc.mockImplementation(async (name: string) => ({
    data:
      name === "teaching_schools"
        ? [{ id: "school-a", name: "A" }]
        : { schools: [] },
    error: null,
  }));
});
const request = (body: unknown, origin = "http://localhost") =>
  new Request("http://localhost/api/schools", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
describe("school API authorization", () => {
  it("requires a verified session and rejects cross-origin mutations before RPC", async () => {
    state.access.userId = null;
    expect(
      (await GET(new Request("http://localhost/api/schools"))).status,
    ).toBe(401);
    expect((await POST(request({ action: "create_school" }))).status).toBe(401);
    state.access.userId = "server-user";
    expect((await POST(request({}, "https://other.example"))).status).toBe(403);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("uses only the server actor; school IDs are reauthorized by the database", async () => {
    const response = await GET(
      new Request("http://localhost/api/schools?schoolId=school-b"),
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(state.rpc).toHaveBeenLastCalledWith("school_dashboard", {
      actor: "server-user",
      requested_school: "school-b",
    });
    await POST(
      request({
        action: "school_staff",
        actor: "forged-admin",
        role: "school_admin",
      }),
    );
    expect(state.rpc).toHaveBeenLastCalledWith("manage_school", {
      actor: "server-user",
      payload: expect.objectContaining({ actor: "forged-admin" }),
    });
  });
  it("fails closed on out-of-scope, revoked, invalid and unavailable storage results", async () => {
    for (const [code, status] of [
      ["42501", 403],
      ["22P02", 400],
      ["PGRST202", 503],
    ] as const) {
      state.rpc.mockResolvedValue({
        data: null,
        error: { code, message: "Internal database details" },
      });
      const response = await GET(
        new Request("http://localhost/api/schools?schoolId=other"),
      );
      expect(response.status).toBe(status);
      expect(JSON.stringify(await response.json())).not.toContain(
        "Internal database details",
      );
    }
  });
  it("does not promote a scoped teacher to global administration and isolates teaching schools", async () => {
    const access = {
      userId: "server-user",
      role: "user" as const,
      sections: [],
    };
    expect(await teachesAtSchool(access, "school-a")).toBe(true);
    expect(await teachesAtSchool(access, "school-b")).toBe(false);
    state.rpc.mockResolvedValue({ data: [], error: null });
    expect(await teachesAtSchool(access, "school-a")).toBe(false);
    expect(await teachingSchools({ ...access, userId: null })).toEqual([]);
    expect(await schoolCapabilities({ ...access, userId: null })).toEqual({
      schoolAdmin: false,
      schoolTeacher: false,
    });
    expect(access.role).toBe("user");
  });
});

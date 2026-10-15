import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { type AccountAccess, getAccountAccess } from "@/lib/accessControl";

export class SchoolError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
async function schoolRpc(name: string, args: Record<string, unknown>) {
  if (!supabaseAdmin)
    throw new SchoolError("School storage is unavailable.", 503);
  const { data, error } = await supabaseAdmin.rpc(name, args);
  if (error) {
    if (error.code === "42501")
      throw new SchoolError("School access denied.", 403);
    if (error.code === "22P02")
      throw new SchoolError("Choose a valid school, district, or class.", 400);
    if (error.code === "22023") throw new SchoolError(error.message, 400);
    throw new SchoolError(
      "School storage could not complete the request. Try again.",
      503,
    );
  }
  return data;
}
export async function schoolActor() {
  const access = await getAccountAccess();
  if (!access.userId)
    throw new SchoolError("Sign in to use school administration.", 401);
  return access;
}
export type TeachingSchool = { id: string; name: string };
export async function teachingSchools(
  access: AccountAccess,
): Promise<TeachingSchool[]> {
  if (!access.userId) return [];
  return (await schoolRpc("teaching_schools", { actor: access.userId })) || [];
}
export async function schoolCapabilities(
  access: AccountAccess,
): Promise<{ schoolAdmin: boolean; schoolTeacher: boolean }> {
  if (!access.userId) return { schoolAdmin: false, schoolTeacher: false };
  return schoolRpc("school_capabilities", { actor: access.userId });
}
export async function teachesAtSchool(access: AccountAccess, schoolId: string) {
  if (access.role === "admin") return true;
  return (await teachingSchools(access)).some((s) => s.id === schoolId);
}
export async function schoolSnapshot(
  access: AccountAccess,
  schoolId?: string | null,
) {
  return schoolRpc("school_dashboard", {
    actor: access.userId,
    requested_school: schoolId || null,
  });
}
export async function schoolMutation(
  access: AccountAccess,
  body: Record<string, unknown>,
) {
  // Actor and privileges never come from the JSON body. The RPC rechecks scope.
  return schoolRpc("manage_school", { actor: access.userId, payload: body });
}

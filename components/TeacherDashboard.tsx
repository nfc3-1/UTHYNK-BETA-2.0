"use client";
import ClassroomDashboard from "@/components/ClassroomDashboard";
export default function TeacherDashboard({
  catalog,
}: {
  catalog: { id: string; kind: string; title: string; category: string }[];
}) {
  return <ClassroomDashboard teacher catalog={catalog} />;
}

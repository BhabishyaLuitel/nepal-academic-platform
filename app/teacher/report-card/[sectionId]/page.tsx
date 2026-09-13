import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CasMasthead } from "@/components/assessment/cas-masthead";

export default async function ReportCardSectionPage(
  props: PageProps<"/teacher/report-card/[sectionId]">,
) {
  const { sectionId } = await props.params;
  const session = await auth();
  const teacherId = session!.user.id;

  const assignment = await prisma.teacherAssignment.findFirst({
    where: { sectionId, teacherId },
    include: { grade: true, section: true },
  });
  if (!assignment) notFound();

  const students = (
    await prisma.student.findMany({ where: { sectionId } })
  ).sort((a, b) => Number(a.rollNumber) - Number(b.rollNumber));

  const className = `${assignment.grade.name} - ${assignment.section.name}`;

  return (
    <div className="cas-theme">
      <Breadcrumbs
        items={[{ label: "Report Card", href: "/teacher/report-card" }, { label: className }]}
      />
      <CasMasthead
        eyebrow="Report Cards"
        title={className}
        subtitle="Select a student to view their report card."
      />

      <div className="cas-card mt-6 overflow-hidden">
        <table className="cas-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2">Roll No.</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-4 py-2 text-[color:var(--cas-ink)]">{student.rollNumber}</td>
                <td className="px-4 py-2 text-[color:var(--cas-ink)]">{student.name}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/teacher/report-card/${sectionId}/${student.id}`}
                    className="text-[color:var(--cas-accent)] hover:underline"
                  >
                    View report card
                  </Link>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-[color:var(--cas-ink-faint)]">
                  No students in this section yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CasMasthead } from "@/components/assessment/cas-masthead";
import { CreateRubricForm } from "@/components/assessment/create-rubric-form";
import { SavedBanner } from "@/components/ui/saved-banner";
import { createCustomRubric, deleteCustomRubric } from "../actions";

export default async function UnitRubricsPage(
  props: PageProps<"/teacher/assessment/[assignmentId]/[unitId]/rubrics"> & {
    searchParams: Promise<{ created?: string }>;
  },
) {
  const { assignmentId, unitId } = await props.params;
  const { created } = await props.searchParams;
  const session = await auth();
  const teacherId = session!.user.id;

  const assignment = await prisma.teacherAssignment.findFirst({
    where: { id: assignmentId, teacherId },
    include: { subject: true, grade: true, section: true },
  });
  if (!assignment) notFound();

  const unit = await prisma.curriculumUnit.findUnique({ where: { id: unitId } });
  if (!unit) notFound();

  const customRubrics = await prisma.rubric.findMany({
    where: { curriculumUnitId: unitId },
    include: { criteria: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });

  const className = `${assignment.grade.name} ${assignment.section.name}`;

  return (
    <div className="cas-theme">
      <Breadcrumbs
        items={[
          { label: "Assessment", href: "/teacher/assessment" },
          {
            label: `${assignment.subject.name} — ${className}`,
            href: `/teacher/assessment/${assignmentId}`,
          },
          { label: unit.title, href: `/teacher/assessment/${assignmentId}/${unitId}` },
          { label: "Custom rubrics" },
        ]}
      />
      <CasMasthead
        eyebrow="Custom Rubrics"
        title={unit.title}
        subtitle={`Build a rubric just for this unit — it shows up alongside the standard ${assignment.subject.name} rubrics on every student's Rubrics tab.`}
      />
      {created && (
        <div className="mt-6">
          <SavedBanner message="Rubric created" />
        </div>
      )}

      {customRubrics.length > 0 && (
        <div className="mt-6 space-y-4">
          {customRubrics.map((rubric) => (
            <div key={rubric.id} className="cas-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-[color:var(--cas-ink)]">{rubric.title}</p>
                  <p className="text-sm text-[color:var(--cas-ink-dim)]">{rubric.description}</p>
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-[color:var(--cas-ink-faint)]">
                    {rubric.criteria.map((c) => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                  </ul>
                </div>
                <form action={deleteCustomRubric}>
                  <input type="hidden" name="assignmentId" value={assignmentId} />
                  <input type="hidden" name="unitId" value={unitId} />
                  <input type="hidden" name="rubricId" value={rubric.id} />
                  <button
                    type="submit"
                    className="p-1.5 text-[color:var(--cas-ink-faint)] hover:text-red-600"
                    aria-label="Delete rubric"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h2 className="cas-label mb-2">Create a new rubric for this unit</h2>
        <CreateRubricForm
          action={createCustomRubric}
          hiddenFields={{ assignmentId, unitId }}
        />
      </div>
    </div>
  );
}

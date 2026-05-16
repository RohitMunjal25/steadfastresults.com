import { TaskListPage } from "@/components/tasks/task-list-page";
import { buildTaskMetadata } from "@/lib/seo";

export const revalidate = 3;
export const generateMetadata = () => buildTaskMetadata("pdf");

export default async function PdfLibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  return <TaskListPage task="pdf" category={resolvedSearchParams?.category} />;
}

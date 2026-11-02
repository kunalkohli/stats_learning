import { notFound } from "next/navigation";
import { Experimentation } from "@/components/experimentation";
import { experimentLessons } from "@/lib/experimentation";

export function generateStaticParams() { return experimentLessons.map(l => ({ slug: l.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = experimentLessons.find(l => l.slug === slug);
  return { title: lesson ? `${lesson.title} — DSConcepts` : "Not found — DSConcepts" };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = experimentLessons.find(l => l.slug === slug);
  if (!lesson) notFound();
  return <Experimentation key={lesson.id} lesson={lesson} />;
}

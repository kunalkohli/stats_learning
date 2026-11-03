import { notFound } from "next/navigation";
import { Forecasting } from "@/components/site";
import { lessons } from "@/lib/curriculum";

export function generateStaticParams() { return lessons.map(l => ({ slug: l.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = lessons.find(l => l.slug === slug);
  return { title: lesson ? `${lesson.title} — DSConcepts` : "Not found — DSConcepts" };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = lessons.find(l => l.slug === slug);
  if (!lesson) notFound();
  return <Forecasting key={lesson.id} lesson={lesson} />;
}

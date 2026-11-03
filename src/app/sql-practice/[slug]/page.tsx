import { notFound } from "next/navigation";
import { SqlPractice } from "@/components/sql/practice";
import { sqlQuestions } from "@/lib/sql/questions";

export function generateStaticParams() { return sqlQuestions.map(q => ({ slug: q.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const question = sqlQuestions.find(q => q.slug === slug);
  return { title: question ? `${question.title} — DSConcepts SQL` : "Not found — DSConcepts" };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const question = sqlQuestions.find(q => q.slug === slug);
  if (!question) notFound();
  return <SqlPractice key={question.slug} question={question} />;
}

import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle, ExternalLink } from "lucide-react";

export default function HomePage() {
  const sampleForms = [
    {
      slug: "product-feedback",
      title: "Product Feedback Survey",
      description: "7 questions • text, email, choice, rating, NPS score, multiple choice",
      color: "bg-purple-600",
      themeBg: "#0f172a",
    },
    {
      slug: "developer-experience",
      title: "Developer Experience & Tech Stack",
      description: "7 questions • frameworks, satisfaction rating, team size, tools",
      color: "bg-emerald-600",
      themeBg: "#111827",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 selection:bg-purple-500/20">
      <div className="max-w-2xl w-full space-y-10 py-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Typeform Clone • Step 3 Respondent Flow</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Conversational forms made beautiful.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            One question at a time, keyboard navigation, smooth slide animations, and real-time server-side validation.
          </p>
        </div>

        {/* Live Seeded Forms */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Try Live Seeded Forms
          </h2>
          <div className="grid gap-4">
            {sampleForms.map((item) => (
              <Link
                key={item.slug}
                href={`/f/${item.slug}`}
                className="group relative flex items-center justify-between p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 transition-all shadow-lg hover:shadow-purple-500/5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="font-semibold text-lg text-zinc-100 group-hover:text-purple-300 transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 pl-5">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-white transition-colors pl-4">
                  <span className="text-sm font-medium hidden sm:inline">Fill Form</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800 text-xs text-zinc-400">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>Keyboard shortcuts (Enter, Arrows, A/B/C)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>Framer Motion slide transitions</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>Server-side type validation & inline errors</span>
          </div>
        </div>
      </div>
    </main>
  );
}

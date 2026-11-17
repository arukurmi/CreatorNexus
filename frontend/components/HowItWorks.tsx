const STEPS = [
  ['Set your budget and niche', 'Tell us what you can spend and which audience you want to reach.'],
  ['Pick a strategy', 'Go for reach, engagement, best value, or a fixed number of creators.'],
  ['Get your creator bucket', 'We split your budget across nano, micro and macro creators and show why.'],
]

export default function HowItWorks({ onStart }: { onStart: () => void }) {
  return (
    <section className="mb-6 rounded-xl border border-border/50 bg-white/70 px-5 py-4">
      <h2 className="text-lg font-bold text-foreground">How it works</h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="flex gap-3">
            <span aria-hidden="true" className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {i + 1}
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground/80">{title}</span>
              <span className="block text-sm text-muted-foreground">{body}</span>
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={onStart}
        className="shadow-soft mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
      >
        Run my first allocation
      </button>
    </section>
  )
}

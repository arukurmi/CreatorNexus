import { Heart } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-24 border-t border-border/50 py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-4 text-sm text-gray-500 sm:flex-row sm:justify-between sm:gap-0 sm:px-6 lg:px-8">
        {/* Left — copyright */}
        <p className="order-3 text-gray-400 sm:order-1">
          © {year} Creator Nexus · Aryansh Kurmi
        </p>

        {/* Center — made with love in Bengaluru */}
        <p className="order-1 flex items-center gap-1.5 font-medium text-foreground/70 sm:order-2">
          Made with <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> in Bengaluru
        </p>

        {/* Right — contact the developer */}
        <a
          href="https://arukurmi.vercel.app/#contact"
          target="_blank"
          rel="noopener noreferrer"
          className="order-2 transition-colors hover:text-primary sm:order-3"
        >
          Contact the Developer
        </a>
      </div>
    </footer>
  )
}

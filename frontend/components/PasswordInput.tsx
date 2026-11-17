'use client'

import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

export const MIN_PASSWORD_LENGTH = 8

export default function PasswordInput(props: Omit<ComponentProps<'input'>, 'type' | 'className'>) {
  const [visible, setVisible] = useState(false)
  const ToggleIcon = visible ? EyeOff : Eye

  return (
    <div className="relative">
      <Lock aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className="w-full rounded-xl border border-input bg-white/60 py-2.5 pl-10 pr-11 text-sm text-foreground transition focus:border-primary"
      />
      <button
        type="button"
        aria-label="Show password"
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <ToggleIcon aria-hidden className="h-4 w-4" />
      </button>
    </div>
  )
}

'use client'

import React, { useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function BrandLogo({
  className = 'brand brand-logo',
  alt = 'Maison Erika · Joyería y accesorios'
}: {
  className?: string
  alt?: string
}) {
  const router = useRouter()
  const clickCountRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleClick = (e: React.MouseEvent) => {
    clickCountRef.current += 1

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (clickCountRef.current >= 3) {
      e.preventDefault()
      clickCountRef.current = 0
      router.push('/admin')
      return
    }

    // Reset count after 900ms if 3 clicks not reached
    timerRef.current = setTimeout(() => {
      clickCountRef.current = 0
    }, 900)
  }

  return (
    <Link
      href="/"
      className={className}
      onClick={handleClick}
      aria-label="Maison Erika, inicio"
    >
      <img
        src="/maison-erika-logo-transparent.png"
        alt={alt}
        className="brand-logo-img"
      />
    </Link>
  )
}

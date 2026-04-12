'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Menu, X, Zap } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Glassmorphism effect on scroll ────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'About', href: '/#about' },
    { label: 'Prizes', href: '/#prizes' },
    { label: 'Schedule', href: '/#schedule' },
    { label: 'Tracks', href: '/#tracks' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Contact', href: '/#contact' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'glass border-b border-white/10 py-0 shadow-glass' 
        : 'bg-transparent border-b border-transparent py-2'
    }`}>
      <nav className="container flex items-center justify-between h-[80px]">
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="HackO'Clock Home"
        >
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all">
            <Clock className="w-5 h-5 text-cyan-500" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-white">Hack</span>
            <span className="gradient-text">O&apos;Clock</span>
          </span>
        </Link>

        {/* ── Desktop Nav ──────────────────────────────────────────────────── */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-zinc-400 hover:text-cyan-400 transition-colors duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* ── Register CTA ─────────────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/register" className="btn-primary !text-xs !py-1.5 !px-4 !h-10">
            <Zap className="w-3.5 h-3.5" />
            Register Now
          </Link>
        </div>

        {/* ── Mobile Menu Button ────────────────────────────────────────────── */}
        <button
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-white/5 transition-all"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* ── Mobile Menu ──────────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-white/5 px-6 py-4">
          <ul className="flex flex-col gap-4 mb-6">
            {navLinks.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block text-sm font-medium text-zinc-300 hover:text-cyan-400 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="btn-primary w-full !text-sm !py-2.5 justify-center"
            onClick={() => setMenuOpen(false)}
          >
            <Zap className="w-4 h-4" />
            Register Now
          </Link>
        </div>
      )}
    </header>
  );
}

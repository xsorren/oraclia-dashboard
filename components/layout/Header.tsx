'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function Header({ title, subtitle, breadcrumbs }: HeaderProps) {
  return (
    <div className="pl-14 md:pl-4 pr-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-slate-900/30 backdrop-blur-xl border-b border-slate-800">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 mb-3 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-4 h-4 text-slate-600" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-slate-400 hover:text-purple-400 transition"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-500">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Title Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-slate-400 mt-1 line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

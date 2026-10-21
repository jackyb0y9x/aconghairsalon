import React from 'react';
import Link from 'next/link';

interface DashboardKpiCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  href?: string;
  subValue?: string;
  accentColor?: 'gold' | 'emerald' | 'amber' | 'blue' | 'purple';
}

export function DashboardKpiCard({
  title,
  value,
  icon: Icon,
  description,
  href,
  subValue,
  accentColor = 'gold',
}: DashboardKpiCardProps) {
  const getAccentStyles = () => {
    switch (accentColor) {
      case 'emerald':
        return {
          iconBox: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          valueColor: 'text-salon-ivory group-hover:text-emerald-400',
        };
      case 'amber':
        return {
          iconBox: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          valueColor: 'text-amber-400',
        };
      case 'blue':
        return {
          iconBox: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          valueColor: 'text-salon-ivory group-hover:text-blue-400',
        };
      case 'purple':
        return {
          iconBox: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
          valueColor: 'text-salon-ivory group-hover:text-purple-400',
        };
      case 'gold':
      default:
        return {
          iconBox: 'bg-salon-gold/10 border-salon-gold/20 text-salon-gold',
          valueColor: 'text-salon-ivory group-hover:text-salon-gold',
        };
    }
  };

  const accents = getAccentStyles();

  const cardContent = (
    <div className="group p-5 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 hover:border-salon-gold/40 hover:bg-salon-charcoal transition-all duration-200">
      <div className="flex items-center justify-between text-zinc-400 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center group-hover:scale-110 transition-transform ${accents.iconBox}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className={`font-serif text-3xl font-bold transition-colors ${accents.valueColor}`}>
        {value}
        {subValue && (
          <span className="text-sm font-sans text-zinc-400 font-normal ml-2">{subValue}</span>
        )}
      </div>
      {description && <div className="text-xs text-zinc-500 mt-2">{description}</div>}
    </div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}

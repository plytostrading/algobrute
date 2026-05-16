'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SIDEBAR_ITEMS: Array<{ id: string; label: string; num: string; href: string }> = [
  { id: 'command', label: 'Command', num: '01', href: '/v3/command' },
  { id: 'operations', label: 'Operations', num: '02', href: '/v3/operations' },
  { id: 'workbench', label: 'Workbench', num: '03', href: '/v3/workbench' },
  { id: 'validation', label: 'Validation', num: '04', href: '/v3/validation' },
  { id: 'insights', label: 'Insights', num: '05', href: '/v3/insights' },
  { id: 'portfolio', label: 'Portfolio', num: '06', href: '/v3/portfolio' },
  { id: 'settings', label: 'Settings', num: '07', href: '/v3/settings' },
];

export default function V3Sidebar() {
  const pathname = usePathname();
  const isOn = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="v3-sidebar">
      <div className="v3-brand">
        <div className="brand-mark">AB</div>
        <div className="brand-text">
          <b>AlgoBrute</b>
          <span>v3 · infographic</span>
        </div>
      </div>
      <nav>
        {SIDEBAR_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={'side-link ' + (isOn(item.href) ? 'on' : '')}
          >
            <span className="num">{item.num}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="v3-side-foot">
        <Link
          href="/"
          className="side-link"
          style={{ fontSize: 11, color: 'var(--text-3)' }}
        >
          ← back to v2 app
        </Link>
        <div className="side-status">
          <span className="dot live" />
          live engine
        </div>
        <div className="side-status">
          <span className="dot" />
          Alpaca · paper
        </div>
      </div>
    </aside>
  );
}

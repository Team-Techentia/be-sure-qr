'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Table } from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Admin', href: '/admin', icon: Table },
];

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div onClick={() => setCollapsed(true)} className={`sidebar-overlay ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} />

      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-[#1F3047] backdrop-blur-md border-r border-white/30 transition-all duration-300 ${collapsed ? 'w-16.25' : 'w-64'
          }`}
      >
        <div className="flex flex-col h-full justify-between py-4">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between px-4">
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[160px]'
                  }`}
              >
                <h2 className="text-lg font-bold text-white tracking-wider">
                  Techentia
                </h2>
              </div>
              <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-white/10 transition flex items-center justify-center">
                <Image src="/notebook.svg" alt="Toggle" width={24} height={24} className="invert" />
              </button>
            </div>

            {/* Navigation Items */}
            <ul className="mt-6 space-y-1">
              {navItems.map(({ name, href, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <li key={name}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                        ${isActive ? 'bg-white text-[#1F3047]' : 'text-white hover:bg-white/10'}`}
                    >
                      <Icon size={32} className="shrink-0 p-1" />
                      <span
                        className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap
                          ${collapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-2'}`}
                      >
                        {name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer */}
          <div
            className={`px-4 text-xs text-white/70 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-full'
              }`}
          >
            <p>© Techentia 2025</p>
          </div>
        </div>
      </aside>
    </>
  );
}
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  title?: string;
}

export function Layout({ title }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stc-bg-dark flex w-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen w-full lg:mr-72 overflow-x-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />

        <main className="flex-1 p-4 md:p-6 w-full max-w-full">
          <Outlet />
        </main>

        <footer className="py-4 px-6 border-t border-white/10 text-center text-sm text-white/40">
          <p>STC AI-VAP v1.0 | STC Solutions {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}

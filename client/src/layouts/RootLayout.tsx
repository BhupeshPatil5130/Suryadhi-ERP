import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

export default function RootLayout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex flex-col">
      <Header />
      <div className="flex-1 flex relative">
        <Sidebar />
        <div
          className={cn(
            'flex-1 transition-all duration-300 ease-in-out w-full',
            'lg:ml-[260px]',
            sidebarCollapsed && 'lg:ml-16'
          )}
        >
          <main className="p-4 md:p-6 min-h-[calc(100vh-3.5rem)]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

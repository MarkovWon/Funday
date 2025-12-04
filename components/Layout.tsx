import React from 'react';

type View = 'REALM' | 'NEXUS' | 'GEO' | 'ORACLE';

interface LayoutProps {
  currentView: View;
  setView: (view: View) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
  const navItems: { id: View; label: string; icon: string; color: string }[] = [
    { id: 'REALM', label: 'Realm', icon: '⊞', color: 'text-cyan-400' },
    { id: 'NEXUS', label: 'Nexus', icon: '☍', color: 'text-purple-400' },
    { id: 'GEO', label: 'Geo', icon: '⊕', color: 'text-emerald-400' },
    { id: 'ORACLE', label: 'Oracle', icon: '◎', color: 'text-amber-400' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-cyan-500/30">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black tracking-tighter uppercase hidden md:block">
            Fun<span className="text-cyan-500">day</span>
          </h1>
          <h1 className="text-2xl font-black text-cyan-500 md:hidden text-center">F</h1>
        </div>

        <nav className="flex-1 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center px-6 py-3 transition-all duration-200 border-l-2
                ${currentView === item.id 
                  ? `bg-slate-800 border-cyan-500 text-white shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]` 
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
            >
              <span className={`text-xl mr-0 md:mr-4 ${item.color} font-mono`}>{item.icon}</span>
              <span className="hidden md:inline font-medium tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="text-xs text-slate-500 text-center md:text-left">
            <p className="hidden md:block">SYSTEM STATUS: <span className="text-green-500">ONLINE</span></p>
            <p className="mt-1">v2.5.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
         {/* Background Ambience */}
         <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none -z-10" />
        
        {children}
      </main>
    </div>
  );
};

export default Layout;
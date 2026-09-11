import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cat,
  Sparkles,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { DiscordUser } from '../types';

interface NavbarProps {
  currentEdition: string;
  onOpenChangelog: () => void;
  user: DiscordUser | null;
  onLogout: () => void;
  activePath?: '/dashboard' | '/login';
  onNavigate?: (path: '/dashboard' | '/login') => void;
}

export const Navbar = ({
  currentEdition,
  onOpenChangelog,
  user,
  onLogout,
  onNavigate,
}: NavbarProps) => {
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1e2124] border-b border-[#2b2f35]">
      <div className="w-full px-4 lg:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* LEFT: Logo maskotka + Kitek 1.0 */}
          <div
            id="kitek-logo-nav"
            onClick={() => onNavigate && onNavigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center shadow-md shadow-emerald-950">
              <Cat className="w-5 h-5 text-[#1e2124]" strokeWidth={2.4} />
            </div>
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-white font-mono">
              <span>Kitek</span>
              <span className="text-emerald-400">{currentEdition.replace(/^Kitek\s*/i, '')}</span>
            </div>
          </div>

          {/* RIGHT: Changelog + Profil użytkownika z czerwonym przyciskiem wylogowania */}
          <div className="flex items-center gap-3">
            {/* Przycisk Changelog obok profilu */}
            <button
              id="changelog-btn-top"
              onClick={onOpenChangelog}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#18261e] border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Changelog</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold rounded font-mono">BETA</span>
            </button>

            {/* Profil użytkownika z czerwonym przyciskiem wylogowania wysuwającym się od spodu */}
            <div
              id="profile-hover-wrapper"
              className="relative"
              onMouseEnter={() => setIsProfileHovered(true)}
              onMouseLeave={() => setIsProfileHovered(false)}
            >
              {/* Profile Pill */}
              <button
                onClick={() => setIsProfileHovered(!isProfileHovered)}
                className="flex items-center gap-2 p-1.5 pl-2 rounded-lg bg-[#151719] border border-[#2b2f35] hover:border-emerald-500/50 transition-colors"
              >
                <div className="w-7 h-7 rounded-md overflow-hidden bg-gradient-to-tr from-emerald-600 to-green-400 p-0.5">
                  <img
                    src={user?.avatarUrl || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=80&auto=format&fit=crop&q=80"}
                    alt="Profile"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="flex flex-col text-left pr-1 leading-tight">
                  <span className="text-xs font-bold text-white">{user?.username || 'Kitek Admin'}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Owner</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isProfileHovered ? 'rotate-180 text-emerald-400' : ''}`} />
              </button>

              {/* Czerwony przycisk wylogowania wysuwający się ze spodu */}
              <AnimatePresence>
                {isProfileHovered && (
                  <motion.div
                    id="profile-logout-slide-dropdown"
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-1.5 w-48 bg-[#151719] border border-red-500/40 rounded-xl p-2 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="px-2 py-1 mb-1.5 border-b border-[#2b2f35] text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{user?.username}</span>
                    </div>

                    <motion.button
                      id="profile-logout-button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onLogout}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/60 border border-red-400/40 transition-all cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Wyloguj się</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

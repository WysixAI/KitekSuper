import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Cat,
  Zap,
  Shield,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Loader2,
  Lock,
  ExternalLink,
  Server,
  ArrowRight,
} from 'lucide-react';
import { DiscordUser, DiscordServer } from '../types';
import {
  fetchDiscordAuthUrl,
  exchangeDiscordCode,
  getCallbackUrl,
  getBotInviteUrl,
  loadDiscordSession,
  saveDiscordSession,
} from '../services/discordAuth';

interface LoginViewProps {
  onLoginSuccess: (discordUser?: DiscordUser, discordGuilds?: DiscordServer[]) => void;
  currentEdition: string;
  activeSubdomain?: string;
}

export const LoginView = ({ onLoginSuccess, currentEdition }: LoginViewProps) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  const currentCallbackUrl = getCallbackUrl();

  const handleSuccessfulAuth = (userData?: DiscordUser, guildsData?: DiscordServer[]) => {
    setStatusMessage('Zalogowano pomyślnie! Przekierowywanie do panelu...');
    setIsAuthenticating(false);

    if (userData && guildsData) {
      saveDiscordSession(userData, guildsData);
    }

    setTimeout(() => {
      onLoginSuccess(userData, guildsData);
    }, 400);
  };

  // 1. Listen for BroadcastChannel events across all tabs/popups
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('kitek_discord_auth');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'LOGIN_SUCCESS') {
          handleSuccessfulAuth(event.data.user, event.data.guilds);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    return () => {
      if (bc) bc.close();
    };
  }, []);

  // 2. Listen for Storage events (fires when localStorage is updated by callback popup)
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'kitek_discord_auth_event' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed.type === 'LOGIN_SUCCESS') {
            handleSuccessfulAuth(parsed.user, parsed.guilds);
          }
        } catch (err) {
          console.warn('Failed to parse storage event:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 3. Listen for window postMessage from callback popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'OAUTH_AUTH_SUCCESS') {
        const { code, error, errorDescription, user, guilds } = event.data;

        if (error) {
          setAuthError(`Błąd Discord: ${errorDescription || error}`);
          setIsAuthenticating(false);
          setStatusMessage(null);
          return;
        }

        // If user and guilds were already resolved by server callback
        if (user && guilds) {
          handleSuccessfulAuth(user, guilds);
          return;
        }

        // Fallback: exchange code if user/guilds weren't pre-resolved
        if (code) {
          try {
            setStatusMessage('Pobieranie profilu i serwerów Discord...');
            const result = await exchangeDiscordCode(code, currentCallbackUrl);
            handleSuccessfulAuth(result.user, result.guilds);
          } catch (err: any) {
            console.error('Error exchanging Discord code:', err);
            setAuthError(err.message || 'Nie udało się dokończyć autoryzacji.');
            setIsAuthenticating(false);
            setStatusMessage(null);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentCallbackUrl]);

  // 4. Polling check while authenticating (in case popup finished and closed without postMessage)
  useEffect(() => {
    if (!isAuthenticating) return;

    const interval = setInterval(() => {
      const session = loadDiscordSession();
      if (session?.user) {
        clearInterval(interval);
        handleSuccessfulAuth(session.user, session.guilds || []);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [isAuthenticating]);

  // 5. Handle direct query param ?code=... if redirected in the same window
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      setAuthError(`Błąd Discord: ${error}`);
    } else if (code) {
      setIsAuthenticating(true);
      setStatusMessage('Przetwarzanie autoryzacji Discord...');
      exchangeDiscordCode(code, currentCallbackUrl)
        .then((result) => {
          window.history.replaceState({}, document.title, window.location.pathname);
          handleSuccessfulAuth(result.user, result.guilds);
        })
        .catch((err) => {
          setAuthError(err.message);
          setIsAuthenticating(false);
          setStatusMessage(null);
        });
    }
  }, [currentCallbackUrl]);

  const handleDiscordLogin = async () => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      setStatusMessage('Otwieranie bezpiecznego okna logowania Discord...');

      const authUrl = await fetchDiscordAuthUrl(currentCallbackUrl);

      // Open OAuth popup window centered
      const width = 540;
      const height = 760;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'discord_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=1`
      );

      popupRef.current = popup;

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Fallback: If popup is blocked by browser, redirect in same window
        setStatusMessage('Przekierowywanie do Discord...');
        window.location.href = authUrl;
      } else {
        setStatusMessage('Oczekiwanie na autoryzację w oknie Discord...');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Błąd inicjowania logowania');
      setIsAuthenticating(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="flex-1 bg-[#121417] text-white flex items-center justify-center p-5 min-h-0 overflow-y-auto">
      <div className="w-full max-w-md my-auto space-y-6">
        {/* Główna Karta Logowania w stylu reszty panelu */}
        <motion.div
          id="login-auth-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-[#1a1d21] border border-[#282e38] rounded-2xl p-7 shadow-2xl relative overflow-hidden"
        >
          {/* Delikatny akcent na górze */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          {/* Logo i Tytuł */}
          <div className="text-center space-y-3 mb-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                <Cat className="w-9 h-9 text-emerald-400" strokeWidth={2.2} />
              </div>
              <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#121417] border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                {currentEdition}
              </span>
            </div>

            <div className="pt-1">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Panel Zarządzania Botem
              </h1>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Zaloguj się swoim kontem Discord, aby zarządzać botem Kitek, konfigurować powitania, moderację i zapraszać go na swoje serwery.
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {authError && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs text-left flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-red-300">Błąd logowania Discord</div>
                <div className="text-[11px] leading-relaxed text-red-200">{authError}</div>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="mb-5 p-3 rounded-xl bg-[#20252c] border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
              <span className="font-mono text-xs">{statusMessage}</span>
            </div>
          )}

          {/* Główny Przycisk Zaloguj przez Discord */}
          <div className="space-y-3">
            <button
              id="discord-oauth-login-btn"
              type="button"
              onClick={handleDiscordLogin}
              disabled={isAuthenticating}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 text-black animate-spin" />
                  <span>Trwa autoryzacja...</span>
                </>
              ) : (
                <>
                  {/* Discord Stylized Icon */}
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  <span>Zaloguj przez Discord</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>

          {/* Podsumowanie możliwości (w czystym, eleganckim stylu) */}
          <div className="mt-6 pt-5 border-t border-[#262b32] space-y-2.5">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Co zyskujesz po zalogowaniu:
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#20242a] border border-[#282d36]">
                <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dostęp do serwerów z Twoimi uprawnieniami</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#20242a] border border-[#282d36]">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Konfiguracja zabezpieczeń, powitań i logów</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#20242a] border border-[#282d36]">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bezpośrednie zapraszanie bota jednym kliknięciem</span>
              </div>
            </div>
          </div>

          {/* Stopka karty */}
          <div className="mt-5 pt-4 border-t border-[#262b32] flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 font-mono text-zinc-400">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Bezpieczne logowanie OAuth2</span>
            </span>
            <a
              href={getBotInviteUrl()}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Zaproś bota</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

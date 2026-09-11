import { useState } from 'react';
import { ExternalLink, ChevronDown, EyeOff } from 'lucide-react';
import { EmbedConfig } from '../types/embed';

interface DiscordPreviewProps {
  config: EmbedConfig;
}

export const DiscordPreview = ({ config }: DiscordPreviewProps) => {
  const [selectedMenuVal, setSelectedMenuVal] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<string | null>(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  // Funkcja podmieniająca zmienne na przykładowe wartości podglądu
  const replaceVars = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\{user\}/g, '@NowyKotek')
      .replace(/\{server\}/g, 'Kitek Community')
      .replace(/\{memberCount\}/g, '142');
  };

  const getButtonStyleClasses = (style: string) => {
    switch (style) {
      case 'success':
        return 'bg-[#248046] hover:bg-[#1a6334] text-white';
      case 'primary':
        return 'bg-[#5865F2] hover:bg-[#4752c4] text-white';
      case 'danger':
        return 'bg-[#da373c] hover:bg-[#a1282c] text-white';
      case 'link':
        return 'bg-[#4e5058] hover:bg-[#6d6f78] text-white';
      case 'secondary':
      default:
        return 'bg-[#4e5058] hover:bg-[#6d6f78] text-white';
    }
  };

  const toggleSpoiler = (id: string) => {
    setRevealedSpoilers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full bg-[#313338] rounded-xl p-4 sm:p-5 text-[#dbdee1] font-sans border border-[#2b2d31] shadow-2xl select-none">
      {/* Discord Header z Botem */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-xl shrink-0 shadow-md">
          🐱
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
              Kitek
            </span>
            <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase leading-none tracking-wide">
              BOT
            </span>
            <span className="text-[11px] text-[#949ba4] font-normal ml-1">
              Dzisiaj o 12:30
            </span>
          </div>

          {/* ================= TRYB 1: ZWYKŁA WIADOMOŚĆ ================= */}
          {config.mode === 'text' && (
            <div className="mt-1.5 text-sm text-[#dbdee1] whitespace-pre-wrap break-words leading-relaxed font-normal">
              {config.plainText ? (
                replaceVars(config.plainText)
              ) : (
                <span className="text-zinc-500 italic">Brak treści wiadomości...</span>
              )}
            </div>
          )}

          {/* ================= TRYB 2: KLASYCZNY EMBED V1 ================= */}
          {config.mode === 'embed_v1' && (
            <div className="mt-2 space-y-2">
              {config.plainText && (
                <div className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words mb-2">
                  {replaceVars(config.plainText)}
                </div>
              )}

              <div
                className="rounded-lg bg-[#2b2d31] border-l-4 p-4 text-xs max-w-xl shadow-sm"
                style={{ borderLeftColor: config.color || '#10b981' }}
              >
                {config.authorName && (
                  <div className="flex items-center gap-2 mb-1.5 text-white font-semibold text-xs">
                    {config.authorIcon && (
                      <img
                        src={config.authorIcon}
                        alt="author"
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span>{replaceVars(config.authorName)}</span>
                  </div>
                )}

                {config.title && (
                  <div className="font-bold text-white text-sm mb-1.5">
                    {replaceVars(config.title)}
                  </div>
                )}

                {config.description && (
                  <div className="text-[#dbdee1] whitespace-pre-wrap break-words mb-3 leading-relaxed">
                    {replaceVars(config.description)}
                  </div>
                )}

                {config.fields && config.fields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
                    {config.fields.map((field, idx) => (
                      <div
                        key={idx}
                        className={field.inline ? 'col-span-1' : 'col-span-full'}
                      >
                        <div className="font-semibold text-white text-xs mb-0.5">
                          {replaceVars(field.name)}
                        </div>
                        <div className="text-[#dbdee1] whitespace-pre-wrap break-words">
                          {replaceVars(field.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {config.imageUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden max-h-56">
                    <img
                      src={config.imageUrl}
                      alt="embed image"
                      referrerPolicy="no-referrer"
                      className="w-full object-cover"
                    />
                  </div>
                )}

                {config.footerText && (
                  <div className="mt-3 pt-2 border-t border-[#35373c] flex items-center gap-2 text-[11px] text-[#949ba4]">
                    <span>{replaceVars(config.footerText)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TRYB 3: DISCORD COMPONENTS V2 (MESSAGE.STYLE CONTAINERS) ================= */}
          {config.mode === 'embed_v2' && (
            <div className="mt-2 space-y-3 max-w-2xl">
              {/* Opcjonalny plain text nad kontenerami */}
              {config.plainText && (
                <div className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words mb-2">
                  {replaceVars(config.plainText)}
                </div>
              )}

              {/* Kontenery V2 */}
              {config.containers && config.containers.length > 0 ? (
                config.containers.map((container, cIdx) => (
                  <div
                    key={container.id || cIdx}
                    className="rounded-lg bg-[#2b2d31] border-l-4 p-4 text-xs shadow-md space-y-3 transition-all relative overflow-hidden"
                    style={{ borderLeftColor: container.color || '#10b981' }}
                  >
                    {/* Obsługa spoilera dla całego kontenera */}
                    {container.spoiler && !revealedSpoilers[container.id] ? (
                      <div
                        onClick={() => toggleSpoiler(container.id)}
                        className="p-6 bg-[#202225] hover:bg-[#25282c] rounded cursor-pointer text-center text-xs font-bold text-[#949ba4] flex flex-col items-center justify-center gap-1.5 transition-colors"
                      >
                        <EyeOff className="w-5 h-5 text-zinc-400" />
                        <span>SPOILER (Kliknij, aby odsłonić zawartość kontenera)</span>
                      </div>
                    ) : (
                      container.components.map((comp) => {
                        // 1. Section
                        if (comp.type === 'section') {
                          return (
                            <div
                              key={comp.id}
                              className="flex items-start justify-between gap-4"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words leading-relaxed">
                                  {replaceVars(comp.sectionContent || '')}
                                </div>
                              </div>

                              {/* Thumbnail / Accessory po prawej */}
                              {comp.accessory?.type === 'Thumbnail' && comp.accessory.fileUrl && (
                                <div className="shrink-0">
                                  {comp.accessory.spoiler && !revealedSpoilers[comp.id] ? (
                                    <div
                                      onClick={() => toggleSpoiler(comp.id)}
                                      className="w-16 h-16 rounded-md bg-[#1e1f22] flex flex-col items-center justify-center cursor-pointer text-[9px] text-[#949ba4] font-bold p-1 text-center"
                                    >
                                      <EyeOff className="w-4 h-4 mb-0.5" />
                                      SPOILER
                                    </div>
                                  ) : (
                                    <img
                                      src={comp.accessory.fileUrl}
                                      alt={comp.accessory.description || 'Thumbnail'}
                                      referrerPolicy="no-referrer"
                                      className="w-16 h-16 rounded-md object-cover border border-[#1e1f22]"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // 2. Text Display
                        if (comp.type === 'text_display') {
                          return (
                            <div
                              key={comp.id}
                              className="text-xs text-[#dbdee1] whitespace-pre-wrap break-words leading-relaxed font-mono bg-[#1e1f22]/50 p-2.5 rounded border border-[#1e1f22]"
                            >
                              {replaceVars(comp.content || '')}
                            </div>
                          );
                        }

                        // 3. Separator
                        if (comp.type === 'separator') {
                          const spacingClass =
                            comp.spacing === 'Large'
                              ? 'my-4'
                              : comp.spacing === 'Medium'
                              ? 'my-2.5'
                              : 'my-1.5';

                          return (
                            <div
                              key={comp.id}
                              className={`w-full ${spacingClass} ${
                                comp.divider !== false ? 'h-px bg-[#3f4147]' : 'h-1'
                              }`}
                            />
                          );
                        }

                        // 4. Action Row - Button Row
                        if (comp.type === 'button_row' && comp.buttons && comp.buttons.length > 0) {
                          return (
                            <div
                              key={comp.id}
                              className="flex flex-wrap items-center gap-2 pt-1"
                            >
                              {comp.buttons.map((btn) => (
                                <button
                                  key={btn.id}
                                  type="button"
                                  className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${getButtonStyleClasses(
                                    btn.style
                                  )}`}
                                >
                                  {btn.emoji && <span>{btn.emoji}</span>}
                                  <span>{replaceVars(btn.label)}</span>
                                  {btn.style === 'link' && (
                                    <ExternalLink className="w-3 h-3 text-white/80" />
                                  )}
                                </button>
                              ))}
                            </div>
                          );
                        }

                        // 5. Action Row - Select Menu
                        if (comp.type === 'select_menu') {
                          const isOpen = isMenuOpen === comp.id;
                          return (
                            <div key={comp.id} className="relative w-full pt-1">
                              <button
                                type="button"
                                disabled={comp.disabled}
                                onClick={() =>
                                  setIsMenuOpen(isOpen ? null : comp.id)
                                }
                                className={`w-full bg-[#1e1f22] hover:bg-[#27292d] text-white px-3 py-2 rounded-md flex items-center justify-between border border-[#1e1f22] text-xs font-medium transition-colors ${
                                  comp.disabled ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <span className="truncate">
                                  {selectedMenuVal || comp.placeholder || 'Wybierz opcję...'}
                                </span>
                                <ChevronDown
                                  className={`w-3.5 h-3.5 text-[#949ba4] transition-transform ${
                                    isOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              {isOpen && comp.options && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-[#2b2d31] border border-[#1e1f22] rounded-md shadow-2xl z-30 py-1 max-h-48 overflow-y-auto">
                                  {comp.options.map((opt) => (
                                    <div
                                      key={opt.id}
                                      onClick={() => {
                                        setSelectedMenuVal(opt.label);
                                        setIsMenuOpen(null);
                                      }}
                                      className="px-3 py-2 hover:bg-[#35373c] cursor-pointer text-xs transition-colors flex items-center justify-between"
                                    >
                                      <div>
                                        <div className="font-semibold text-white flex items-center gap-1.5">
                                          {opt.emoji && <span>{opt.emoji}</span>}
                                          <span>{opt.label}</span>
                                        </div>
                                        {opt.description && (
                                          <div className="text-[10px] text-[#949ba4]">
                                            {opt.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // 6. Media Gallery
                        if (comp.type === 'media_gallery' && comp.mediaUrls?.[0]) {
                          return (
                            <div
                              key={comp.id}
                              className="rounded-lg overflow-hidden max-h-60 border border-[#1e1f22]"
                            >
                              <img
                                src={comp.mediaUrls[0]}
                                alt="media gallery"
                                referrerPolicy="no-referrer"
                                className="w-full object-cover"
                              />
                            </div>
                          );
                        }

                        return null;
                      })
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg bg-[#2b2d31] text-xs text-zinc-400 italic">
                  Brak kontenerów do wyświetlenia. Dodaj kontener w edytorze.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

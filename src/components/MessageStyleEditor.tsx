import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Plus,
  Smile,
  MousePointerClick,
  ListFilter,
  Layers,
  FileText,
  Image as ImageIcon,
  Minus,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  MessageContainer,
  ContainerComponent,
  ContainerComponentType,
  DiscordButton,
  DiscordSelectOption,
  ButtonStyle,
} from '../types/embed';
import { CustomSelect } from './CustomSelect';

interface MessageStyleEditorProps {
  containers: MessageContainer[];
  onChangeContainers: (containers: MessageContainer[]) => void;
}

export const MessageStyleEditor: React.FC<MessageStyleEditorProps> = ({
  containers,
  onChangeContainers,
}) => {
  // Menu rozwijane "Add Component ^" dla każdego kontenera
  const [openMenuContainerId, setOpenMenuContainerId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuContainerId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dodawanie nowego Kontenera
  const handleAddContainer = () => {
    const newContainer: MessageContainer = {
      id: 'container_' + Date.now(),
      color: '#10b981',
      spoiler: false,
      collapsed: false,
      components: [
        {
          id: 'comp_sec_' + Date.now(),
          type: 'section',
          accessory: {
            type: 'Thumbnail',
            fileUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=120&auto=format&fit=crop&q=80',
            description: 'Logo serwera Kitek',
            spoiler: false,
          },
          sectionContent: '# Witaj na serwerze {server}!\nCieszymy się, że jesteś z nami! Jesteś **{memberCount}** kotkiem w naszej społeczności.',
        },
        {
          id: 'comp_sep_' + Date.now(),
          type: 'separator',
          spacing: 'Small',
          divider: true,
        },
        {
          id: 'comp_btn_row_' + Date.now(),
          type: 'button_row',
          buttons: [
            { id: 'b1', label: 'Odbierz Rangę', style: 'success', emoji: '✨' },
            { id: 'b2', label: 'Regulamin', style: 'secondary', emoji: '📜' },
            { id: 'b3', label: 'Strona WWW', style: 'link', emoji: '🌐', url: 'https://kitek.pl' },
          ],
        },
      ],
    };
    onChangeContainers([...containers, newContainer]);
  };

  // Usuwanie kontenera
  const handleDeleteContainer = (cIdx: number) => {
    const updated = [...containers];
    updated.splice(cIdx, 1);
    onChangeContainers(updated);
  };

  // Duplikowanie kontenera
  const handleDuplicateContainer = (cIdx: number) => {
    const target = containers[cIdx];
    const clone: MessageContainer = {
      ...JSON.parse(JSON.stringify(target)),
      id: 'container_' + Date.now(),
    };
    const updated = [...containers];
    updated.splice(cIdx + 1, 0, clone);
    onChangeContainers(updated);
  };

  // Przesuwanie kontenera
  const handleMoveContainer = (cIdx: number, dir: -1 | 1) => {
    const targetIdx = cIdx + dir;
    if (targetIdx < 0 || targetIdx >= containers.length) return;
    const updated = [...containers];
    const item = updated.splice(cIdx, 1)[0];
    updated.splice(targetIdx, 0, item);
    onChangeContainers(updated);
  };

  // Aktualizacja właściwości kontenera
  const updateContainer = (cIdx: number, newContainer: MessageContainer) => {
    const updated = [...containers];
    updated[cIdx] = newContainer;
    onChangeContainers(updated);
  };

  // Dodawanie komponentu do danego kontenera
  const handleAddComponent = (cIdx: number, type: ContainerComponentType) => {
    const container = containers[cIdx];
    let newComp: ContainerComponent;
    const compId = 'comp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    switch (type) {
      case 'button_row':
        newComp = {
          id: compId,
          type: 'button_row',
          buttons: [
            { id: 'btn_' + Date.now(), label: 'Nowy Przycisk', style: 'success', emoji: '🐱' },
            { id: 'btn_' + (Date.now() + 1), label: 'Szczegóły', style: 'secondary', emoji: 'ℹ️' },
          ],
        };
        break;
      case 'select_menu':
        newComp = {
          id: compId,
          type: 'select_menu',
          placeholder: 'Wybierz swoje role i preferencje...',
          disabled: false,
          options: [
            { id: 'opt_1', label: 'Powiadomienia o nowościach', description: 'Bądź na bieżąco', emoji: '🔔', value: 'news' },
            { id: 'opt_2', label: 'Dostęp do kanałów graczy', description: 'Strefa gamingu', emoji: '🎮', value: 'gaming' },
          ],
        };
        break;
      case 'section':
        newComp = {
          id: compId,
          type: 'section',
          accessory: {
            type: 'Thumbnail',
            fileUrl: '',
            description: '',
            spoiler: false,
          },
          sectionContent: '### Informacje o serwerze\nTutaj możesz opisać szczegóły lub zasady powitania.',
        };
        break;
      case 'text_display':
        newComp = {
          id: compId,
          type: 'text_display',
          content: '``` NAZWA SERWERA ```\nOPIS POWITANIA I ZASAD DLA NOWEGO CZŁONKA {user}',
        };
        break;
      case 'separator':
        newComp = {
          id: compId,
          type: 'separator',
          spacing: 'Small',
          divider: true,
        };
        break;
      case 'media_gallery':
        newComp = {
          id: compId,
          type: 'media_gallery',
          mediaUrls: ['https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=600&auto=format&fit=crop&q=80'],
        };
        break;
    }

    updateContainer(cIdx, {
      ...container,
      components: [...container.components, newComp],
    });
    setOpenMenuContainerId(null);
  };

  // Czyszczenie komponentów w kontenerze
  const handleClearComponents = (cIdx: number) => {
    const container = containers[cIdx];
    updateContainer(cIdx, {
      ...container,
      components: [],
    });
  };

  // Usuwanie komponentu wewnątrz kontenera
  const handleDeleteComponent = (cIdx: number, compIdx: number) => {
    const container = containers[cIdx];
    const updatedComps = [...container.components];
    updatedComps.splice(compIdx, 1);
    updateContainer(cIdx, {
      ...container,
      components: updatedComps,
    });
  };

  // Duplikowanie komponentu wewnątrz kontenera
  const handleDuplicateComponent = (cIdx: number, compIdx: number) => {
    const container = containers[cIdx];
    const targetComp = container.components[compIdx];
    const cloneComp: ContainerComponent = {
      ...JSON.parse(JSON.stringify(targetComp)),
      id: 'comp_' + Date.now(),
    };
    const updatedComps = [...container.components];
    updatedComps.splice(compIdx + 1, 0, cloneComp);
    updateContainer(cIdx, {
      ...container,
      components: updatedComps,
    });
  };

  // Przesuwanie komponentu wewnątrz kontenera
  const handleMoveComponent = (cIdx: number, compIdx: number, dir: -1 | 1) => {
    const container = containers[cIdx];
    const targetIdx = compIdx + dir;
    if (targetIdx < 0 || targetIdx >= container.components.length) return;
    const updatedComps = [...container.components];
    const item = updatedComps.splice(compIdx, 1)[0];
    updatedComps.splice(targetIdx, 0, item);
    updateContainer(cIdx, {
      ...container,
      components: updatedComps,
    });
  };

  // Aktualizacja komponentu
  const updateComponent = (
    cIdx: number,
    compIdx: number,
    updatedComp: ContainerComponent
  ) => {
    const container = containers[cIdx];
    const updatedComps = [...container.components];
    updatedComps[compIdx] = updatedComp;
    updateContainer(cIdx, {
      ...container,
      components: updatedComps,
    });
  };

  // Obsługa przycisków w Button Row
  const handleAddButton = (cIdx: number, compIdx: number) => {
    const container = containers[cIdx];
    const comp = container.components[compIdx];
    if (!comp.buttons || comp.buttons.length >= 5) return;
    const newBtn: DiscordButton = {
      id: 'btn_' + Date.now(),
      label: 'Przycisk',
      style: 'primary',
      emoji: '⭐',
    };
    updateComponent(cIdx, compIdx, {
      ...comp,
      buttons: [...comp.buttons, newBtn],
    });
  };

  const handleDeleteButton = (cIdx: number, compIdx: number, btnIdx: number) => {
    const container = containers[cIdx];
    const comp = container.components[compIdx];
    if (!comp.buttons) return;
    const updatedBtns = [...comp.buttons];
    updatedBtns.splice(btnIdx, 1);
    updateComponent(cIdx, compIdx, {
      ...comp,
      buttons: updatedBtns,
    });
  };

  const handleUpdateButton = (
    cIdx: number,
    compIdx: number,
    btnIdx: number,
    field: keyof DiscordButton,
    val: string
  ) => {
    const container = containers[cIdx];
    const comp = container.components[compIdx];
    if (!comp.buttons) return;
    const updatedBtns = [...comp.buttons];
    updatedBtns[btnIdx] = {
      ...updatedBtns[btnIdx],
      [field]: val,
    };
    updateComponent(cIdx, compIdx, {
      ...comp,
      buttons: updatedBtns,
    });
  };

  // Obsługa opcji w Select Menu
  const handleAddSelectOption = (cIdx: number, compIdx: number) => {
    const container = containers[cIdx];
    const comp = container.components[compIdx];
    if (!comp.options || comp.options.length >= 25) return;
    const newOpt: DiscordSelectOption = {
      id: 'opt_' + Date.now(),
      label: 'Nowa opcja',
      description: 'Opis tej opcji...',
      emoji: '🎯',
      value: 'val_' + Date.now(),
    };
    updateComponent(cIdx, compIdx, {
      ...comp,
      options: [...comp.options, newOpt],
    });
  };

  const handleDeleteSelectOption = (
    cIdx: number,
    compIdx: number,
    optIdx: number
  ) => {
    const container = containers[cIdx];
    const comp = container.components[compIdx];
    if (!comp.options) return;
    const updatedOpts = [...comp.options];
    updatedOpts.splice(optIdx, 1);
    updateComponent(cIdx, compIdx, {
      ...comp,
      options: updatedOpts,
    });
  };

  const handleUpdateSelectOption = (
    cIdx: number,
    compIdx: number,
    optIdx: number,
    field: keyof DiscordSelectOption,
    val: string
  ) => {
    const container = containers[cIdx];
    const comp = container.components[compIdx];
    if (!comp.options) return;
    const updatedOpts = [...comp.options];
    updatedOpts[optIdx] = {
      ...updatedOpts[optIdx],
      [field]: val,
    };
    updateComponent(cIdx, compIdx, {
      ...comp,
      options: updatedOpts,
    });
  };

  return (
    <div className="space-y-6">
      {/* Lista kontenerów (Containers) */}
      {containers.map((container, cIdx) => (
        <div
          key={container.id}
          className="rounded-xl bg-[#23272e] border border-[#313640] shadow-xl overflow-hidden"
        >
          {/* ================= Pasek nagłówka Kontenera (dokładnie jak na screenie 2) ================= */}
          <div className="bg-[#1c2026] px-4 py-2.5 flex items-center justify-between border-b border-[#2d323b]">
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() =>
                updateContainer(cIdx, {
                  ...container,
                  collapsed: !container.collapsed,
                })
              }
            >
              {container.collapsed ? (
                <ChevronUp className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              )}
              <span className="text-xs font-bold text-zinc-200">
                Container
              </span>
              <span className="text-xs text-zinc-500 font-mono">- Text</span>
            </div>

            {/* Przyciski sterowania kontenerem: ^ v duplicate delete */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={cIdx === 0}
                onClick={() => handleMoveContainer(cIdx, -1)}
                title="Przesuń kontener w górę"
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#2b303a] disabled:opacity-30 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={cIdx === containers.length - 1}
                onClick={() => handleMoveContainer(cIdx, 1)}
                title="Przesuń kontener w dół"
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#2b303a] disabled:opacity-30 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateContainer(cIdx)}
                title="Duplikuj kontener"
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#2b303a] transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteContainer(cIdx)}
                title="Usuń kontener"
                className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-[#2b303a] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Treść kontenera jeśli niezwinięty */}
          {!container.collapsed && (
            <div className="p-4 sm:p-5 space-y-4">
              {/* Ustawienia Kontenera: COLOR # rrggbb oraz SPOILER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d323b] pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    COLOR
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#16181b] border border-[#2e333b] rounded-md px-2 py-1 text-xs text-zinc-300 font-mono">
                      <span className="text-zinc-500 mr-1">#</span>
                      <input
                        type="text"
                        value={container.color.replace('#', '')}
                        onChange={(e) =>
                          updateContainer(cIdx, {
                            ...container,
                            color: '#' + e.target.value,
                          })
                        }
                        placeholder="rrggbb"
                        className="bg-transparent border-0 outline-none text-white w-20 text-xs uppercase"
                      />
                    </div>
                    <input
                      type="color"
                      value={container.color}
                      onChange={(e) =>
                        updateContainer(cIdx, {
                          ...container,
                          color: e.target.value,
                        })
                      }
                      className="w-8 h-8 rounded border border-[#2e333b] bg-transparent cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    SPOILER
                  </span>
                  <input
                    type="checkbox"
                    checked={container.spoiler}
                    onChange={(e) =>
                      updateContainer(cIdx, {
                        ...container,
                        spoiler: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Sekcja Components (X / 10) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 font-mono">
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                    <span>Components</span>
                    <span className="text-zinc-500 text-[11px]">
                      {container.components.length} / 10
                    </span>
                  </div>
                </div>

                {/* Lista komponentów wewnątrz kontenera */}
                <div className="space-y-3 pl-1 sm:pl-2">
                  {container.components.length === 0 ? (
                    <div className="p-5 rounded-lg bg-[#181a1e] border border-dashed border-[#2d323b] text-center text-xs text-zinc-500">
                      Brak komponentów w tym kontenerze. Kliknij <strong>Add Component ^</strong> poniżej, aby dodać np. Section, Button Row lub Select Menu.
                    </div>
                  ) : (
                    container.components.map((comp, compIdx) => (
                      <div
                        key={comp.id}
                        className="rounded-lg bg-[#1a1d23] border border-[#2d323b] overflow-hidden"
                      >
                        {/* Pasek nagłówka komponentu */}
                        <div className="bg-[#15171c] px-3.5 py-2 flex items-center justify-between border-b border-[#262a32]">
                          <div
                            className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-zinc-200"
                            onClick={() =>
                              updateComponent(cIdx, compIdx, {
                                ...comp,
                                collapsed: !comp.collapsed,
                              })
                            }
                          >
                            {comp.collapsed ? (
                              <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                            )}

                            {comp.type === 'section' && (
                              <span className="flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Section - Text</span>
                              </span>
                            )}

                            {comp.type === 'text_display' && (
                              <span className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Text Display</span>
                              </span>
                            )}

                            {comp.type === 'button_row' && (
                              <span className="flex items-center gap-1.5">
                                <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Action Row - Button Row</span>
                              </span>
                            )}

                            {comp.type === 'select_menu' && (
                              <span className="flex items-center gap-1.5">
                                <ListFilter className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Action Row - Select Menu</span>
                              </span>
                            )}

                            {comp.type === 'separator' && (
                              <span className="flex items-center gap-1.5">
                                <Minus className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Separator</span>
                              </span>
                            )}

                            {comp.type === 'media_gallery' && (
                              <span className="flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Media Gallery</span>
                              </span>
                            )}
                          </div>

                          {/* Sterowanie klockiem: ^ v copy delete */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={compIdx === 0}
                              onClick={() => handleMoveComponent(cIdx, compIdx, -1)}
                              title="W górę"
                              className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={compIdx === container.components.length - 1}
                              onClick={() => handleMoveComponent(cIdx, compIdx, 1)}
                              title="W dół"
                              className="p-1 rounded text-zinc-400 hover:text-white disabled:opacity-30"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateComponent(cIdx, compIdx)}
                              title="Duplikuj"
                              className="p-1 rounded text-zinc-400 hover:text-white"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteComponent(cIdx, compIdx)}
                              title="Usuń"
                              className="p-1 rounded text-zinc-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Zawartość komponentu (jeśli rozwinięty) */}
                        {!comp.collapsed && (
                          <div className="p-3.5 space-y-3 text-xs">
                            {/* ================= 1. SECTION (JAK NA SCREENIE 2) ================= */}
                            {comp.type === 'section' && (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                                    ACCESSORY TYPE
                                  </label>
                                  <CustomSelect
                                    value={comp.accessory?.type || 'Thumbnail'}
                                    onChange={(val) =>
                                      updateComponent(cIdx, compIdx, {
                                        ...comp,
                                        accessory: {
                                          ...comp.accessory!,
                                          type: val as any,
                                        },
                                      })
                                    }
                                    options={[
                                      { value: 'Thumbnail', label: 'Thumbnail (Miniatura/Logo)', prefix: '🖼️' },
                                      { value: 'None', label: 'Brak akcesorium', prefix: '🚫' },
                                    ]}
                                    size="sm"
                                    triggerClassName="bg-[#121417] border-[#2b3038]"
                                  />
                                </div>

                                {comp.accessory?.type === 'Thumbnail' && (
                                  <div className="p-3 rounded-lg bg-[#14161a] border border-[#272b33] space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                                        Accessory
                                      </span>
                                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                        <span>SPOILER</span>
                                        <input
                                          type="checkbox"
                                          checked={comp.accessory.spoiler}
                                          onChange={(e) =>
                                            updateComponent(cIdx, compIdx, {
                                              ...comp,
                                              accessory: {
                                                ...comp.accessory!,
                                                spoiler: e.target.checked,
                                              },
                                            })
                                          }
                                          className="w-3.5 h-3.5 accent-emerald-500"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-zinc-500 font-mono">
                                        FILE URL
                                      </label>
                                      <input
                                        type="text"
                                        value={comp.accessory.fileUrl}
                                        onChange={(e) =>
                                          updateComponent(cIdx, compIdx, {
                                            ...comp,
                                            accessory: {
                                              ...comp.accessory!,
                                              fileUrl: e.target.value,
                                            },
                                          })
                                        }
                                        placeholder="https://... URL miniatury lub logo"
                                        className="w-full bg-[#1c2026] border border-[#2e333b] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                                        <span>DESCRIPTION</span>
                                        <span>{comp.accessory.description?.length || 0} / 80</span>
                                      </div>
                                      <input
                                        type="text"
                                        maxLength={80}
                                        value={comp.accessory.description || ''}
                                        onChange={(e) =>
                                          updateComponent(cIdx, compIdx, {
                                            ...comp,
                                            accessory: {
                                              ...comp.accessory!,
                                              description: e.target.value,
                                            },
                                          })
                                        }
                                        placeholder="Opis miniatury..."
                                        className="w-full bg-[#1c2026] border border-[#2e333b] rounded px-2.5 py-1 text-xs text-white outline-none focus:border-emerald-500"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Treść sekcji (Text w sekcji) */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                                    <span className="font-bold uppercase tracking-wider">
                                      SECTION CONTENT (MARKDOWN)
                                    </span>
                                    <span>{comp.sectionContent?.length || 0} / 4000</span>
                                  </div>
                                  <textarea
                                    rows={3}
                                    value={comp.sectionContent || ''}
                                    onChange={(e) =>
                                      updateComponent(cIdx, compIdx, {
                                        ...comp,
                                        sectionContent: e.target.value,
                                      })
                                    }
                                    className="w-full bg-[#121417] border border-[#2b3038] rounded p-2.5 text-xs text-white outline-none focus:border-emerald-500 leading-relaxed"
                                    placeholder="Treść sekcji powitalnej..."
                                  />
                                </div>
                              </div>
                            )}

                            {/* ================= 2. TEXT DISPLAY ================= */}
                            {comp.type === 'text_display' && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                                  <span className="font-bold uppercase tracking-wider">
                                    CONTENT
                                  </span>
                                  <span>{comp.content?.length || 0} / 4000</span>
                                </div>
                                <textarea
                                  rows={3}
                                  value={comp.content || ''}
                                  onChange={(e) =>
                                    updateComponent(cIdx, compIdx, {
                                      ...comp,
                                      content: e.target.value,
                                    })
                                  }
                                  className="w-full bg-[#121417] border border-[#2b3038] rounded p-2.5 text-xs text-white outline-none focus:border-emerald-500 leading-relaxed font-mono"
                                  placeholder="Wpisz treść tekstu..."
                                />
                              </div>
                            )}

                            {/* ================= 3. SEPARATOR (JAK NA SCREENIE 2) ================= */}
                            {comp.type === 'separator' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                                    SPACING
                                  </label>
                                  <CustomSelect
                                    value={comp.spacing || 'Small'}
                                    onChange={(val) =>
                                      updateComponent(cIdx, compIdx, {
                                        ...comp,
                                        spacing: val as any,
                                      })
                                    }
                                    options={[
                                      { value: 'Small', label: 'Small (Mały odstęp)', prefix: '▪' },
                                      { value: 'Medium', label: 'Medium (Średni odstęp)', prefix: '▫' },
                                      { value: 'Large', label: 'Large (Duży odstęp)', prefix: '◽' },
                                    ]}
                                    size="sm"
                                    triggerClassName="bg-[#121417] border-[#2b3038]"
                                  />
                                </div>

                                <div className="space-y-1 sm:pt-4">
                                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                                    <input
                                      type="checkbox"
                                      checked={comp.divider !== false}
                                      onChange={(e) =>
                                        updateComponent(cIdx, compIdx, {
                                          ...comp,
                                          divider: e.target.checked,
                                        })
                                      }
                                      className="w-4 h-4 accent-emerald-500 rounded"
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                                      DIVIDER (Widoczna linia)
                                    </span>
                                  </label>
                                </div>
                              </div>
                            )}

                            {/* ================= 4. ACTION ROW - BUTTON ROW (DODAWANIE PRZYCISKÓW DO KONTENERA) ================= */}
                            {comp.type === 'button_row' && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                                    Przyciski w tym wierszu ({comp.buttons?.length || 0} / 5)
                                  </span>
                                  {(comp.buttons?.length || 0) < 5 && (
                                    <button
                                      type="button"
                                      onClick={() => handleAddButton(cIdx, compIdx)}
                                      className="px-2.5 py-1 rounded bg-[#252a32] hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add Button</span>
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  {comp.buttons?.map((btn, btnIdx) => (
                                    <div
                                      key={btn.id}
                                      className="p-2.5 rounded-lg bg-[#14161a] border border-[#272b33] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                                    >
                                      {/* Emotka */}
                                      <div className="sm:col-span-2">
                                        <div className="flex items-center bg-[#1c2026] border border-[#2b3038] rounded px-2 py-1">
                                          <Smile className="w-3 h-3 text-zinc-400 mr-1 shrink-0" />
                                          <input
                                            type="text"
                                            value={btn.emoji || ''}
                                            onChange={(e) =>
                                              handleUpdateButton(
                                                cIdx,
                                                compIdx,
                                                btnIdx,
                                                'emoji',
                                                e.target.value
                                              )
                                            }
                                            placeholder="Emoji"
                                            className="w-full bg-transparent border-0 outline-none text-white text-xs"
                                          />
                                        </div>
                                      </div>

                                      {/* Label */}
                                      <div className="sm:col-span-4">
                                        <input
                                          type="text"
                                          value={btn.label}
                                          onChange={(e) =>
                                            handleUpdateButton(
                                              cIdx,
                                              compIdx,
                                              btnIdx,
                                              'label',
                                              e.target.value
                                            )
                                          }
                                          placeholder="Etykieta przycisku"
                                          className="w-full bg-[#1c2026] border border-[#2b3038] rounded px-2.5 py-1 text-white text-xs outline-none focus:border-emerald-500"
                                        />
                                      </div>

                                      {/* Style */}
                                      <div className="sm:col-span-3">
                                        <CustomSelect
                                          value={btn.style}
                                          onChange={(val) =>
                                            handleUpdateButton(
                                              cIdx,
                                              compIdx,
                                              btnIdx,
                                              'style',
                                              val as ButtonStyle
                                            )
                                          }
                                          options={[
                                            { value: 'success', label: 'Success (Zielony)', prefix: '🟢' },
                                            { value: 'primary', label: 'Primary (Blurple)', prefix: '🟣' },
                                            { value: 'secondary', label: 'Secondary (Szary)', prefix: '⚪' },
                                            { value: 'danger', label: 'Danger (Czerwony)', prefix: '🔴' },
                                            { value: 'link', label: 'Link (URL)', prefix: '🔗' },
                                          ]}
                                          size="sm"
                                          triggerClassName="bg-[#1c2026] border-[#2b3038]"
                                        />
                                      </div>

                                      {/* Link URL lub Usuń */}
                                      <div className="sm:col-span-3 flex items-center gap-1.5">
                                        {btn.style === 'link' ? (
                                          <input
                                            type="text"
                                            value={btn.url || ''}
                                            onChange={(e) =>
                                              handleUpdateButton(
                                                cIdx,
                                                compIdx,
                                                btnIdx,
                                                'url',
                                                e.target.value
                                              )
                                            }
                                            placeholder="https://"
                                            className="flex-1 bg-[#1c2026] border border-[#2b3038] rounded px-2 py-1 text-[11px] text-white outline-none focus:border-emerald-500"
                                          />
                                        ) : (
                                          <span className="flex-1 text-[10px] text-zinc-500 font-mono truncate">
                                            Akcja bota
                                          </span>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteButton(cIdx, compIdx, btnIdx)
                                          }
                                          className="p-1 rounded text-zinc-500 hover:text-rose-400"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ================= 5. ACTION ROW - SELECT MENU (JAK NA SCREENIE 2) ================= */}
                            {comp.type === 'select_menu' && (
                              <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                                      <span className="font-bold uppercase tracking-wider">
                                        PLACEHOLDER
                                      </span>
                                      <span>{comp.placeholder?.length || 0} / 150</span>
                                    </div>
                                    <input
                                      type="text"
                                      value={comp.placeholder || ''}
                                      maxLength={150}
                                      onChange={(e) =>
                                        updateComponent(cIdx, compIdx, {
                                          ...comp,
                                          placeholder: e.target.value,
                                        })
                                      }
                                      className="w-full bg-[#121417] border border-[#2b3038] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 pt-3 sm:pt-4">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                                      DISABLED
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={comp.disabled || false}
                                      onChange={(e) =>
                                        updateComponent(cIdx, compIdx, {
                                          ...comp,
                                          disabled: e.target.checked,
                                        })
                                      }
                                      className="w-4 h-4 accent-emerald-500 rounded"
                                    />
                                  </div>
                                </div>

                                {/* Opcje w Select Menu */}
                                <div className="space-y-2 pt-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                                      Options ({comp.options?.length || 0} / 25)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleAddSelectOption(cIdx, compIdx)}
                                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add Option</span>
                                    </button>
                                  </div>

                                  {comp.options?.map((opt, optIdx) => (
                                    <div
                                      key={opt.id}
                                      className="p-2.5 rounded-lg bg-[#14161a] border border-[#272b33] space-y-2"
                                    >
                                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                        <div className="sm:col-span-3">
                                          <div className="flex items-center bg-[#1c2026] border border-[#2b3038] rounded px-2 py-1">
                                            <Smile className="w-3 h-3 text-zinc-400 mr-1 shrink-0" />
                                            <input
                                              type="text"
                                              value={opt.emoji || ''}
                                              onChange={(e) =>
                                                handleUpdateSelectOption(
                                                  cIdx,
                                                  compIdx,
                                                  optIdx,
                                                  'emoji',
                                                  e.target.value
                                                )
                                              }
                                              placeholder="EMOJI"
                                              className="w-full bg-transparent border-0 outline-none text-white text-xs"
                                            />
                                          </div>
                                        </div>

                                        <div className="sm:col-span-8">
                                          <input
                                            type="text"
                                            value={opt.label}
                                            maxLength={80}
                                            onChange={(e) =>
                                              handleUpdateSelectOption(
                                                cIdx,
                                                compIdx,
                                                optIdx,
                                                'label',
                                                e.target.value
                                              )
                                            }
                                            placeholder="LABEL"
                                            className="w-full bg-[#1c2026] border border-[#2b3038] rounded px-2.5 py-1 text-white text-xs outline-none focus:border-emerald-500"
                                          />
                                        </div>

                                        <div className="sm:col-span-1 flex justify-end">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleDeleteSelectOption(
                                                cIdx,
                                                compIdx,
                                                optIdx
                                              )
                                            }
                                            className="p-1 rounded text-zinc-500 hover:text-rose-400"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      <div className="space-y-0.5">
                                        <input
                                          type="text"
                                          value={opt.description || ''}
                                          maxLength={100}
                                          onChange={(e) =>
                                            handleUpdateSelectOption(
                                              cIdx,
                                              compIdx,
                                              optIdx,
                                              'description',
                                              e.target.value
                                            )
                                          }
                                          placeholder="DESCRIPTION (Opcjonalny opis...)"
                                          className="w-full bg-[#1c2026] border border-[#2b3038] rounded px-2.5 py-1 text-zinc-300 text-[11px] outline-none focus:border-emerald-500"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ================= 6. MEDIA GALLERY ================= */}
                            {comp.type === 'media_gallery' && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                                  IMAGE URL
                                </label>
                                <input
                                  type="text"
                                  value={comp.mediaUrls?.[0] || ''}
                                  onChange={(e) =>
                                    updateComponent(cIdx, compIdx, {
                                      ...comp,
                                      mediaUrls: [e.target.value],
                                    })
                                  }
                                  placeholder="https://... URL grafiki lub baneru"
                                  className="w-full bg-[#121417] border border-[#2b3038] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ================= Pasek dolny Kontenera: [Add Component ^] i [Clear Components] (dokładnie jak na zrzucie 1) ================= */}
              <div className="pt-2 flex items-center gap-3 relative">
                {/* Przycisk Add Component ^ z rozwijanym menu */}
                <div className="relative" ref={openMenuContainerId === container.id ? menuRef : null}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuContainerId(
                        openMenuContainerId === container.id ? null : container.id
                      )
                    }
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    <span>Add Component</span>
                    <ChevronUp
                      className={`w-3.5 h-3.5 transition-transform ${
                        openMenuContainerId === container.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Menu rozwijane w górę z listą (dokładnie jak na Screenshot 1) */}
                  {openMenuContainerId === container.id && (
                    <div className="absolute left-0 bottom-full mb-1.5 w-56 bg-[#181a1f] border border-[#2d323b] rounded-lg shadow-2xl z-50 py-1.5 divide-y divide-[#262930] animate-in fade-in zoom-in-95">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => handleAddComponent(cIdx, 'button_row')}
                          className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-[#252830] hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Add Button Row</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddComponent(cIdx, 'select_menu')}
                          className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-[#252830] hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <ListFilter className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Add Select Menu</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddComponent(cIdx, 'section')}
                          className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-[#252830] hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Add Section</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddComponent(cIdx, 'text_display')}
                          className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-[#252830] hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Add Text Display</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddComponent(cIdx, 'media_gallery')}
                          className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-[#252830] hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Add Media Gallery</span>
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => handleAddComponent(cIdx, 'separator')}
                          className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-[#252830] hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <span className="text-amber-400 text-xs">★</span>
                          <span>Add Separator</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Przycisk Clear Components z czerwoną ramką (jak na Screenshot 1) */}
                <button
                  type="button"
                  onClick={() => handleClearComponents(cIdx)}
                  className="px-3.5 py-2 rounded-md bg-transparent hover:bg-rose-500/10 text-rose-400 border border-rose-500/60 text-xs font-semibold transition-colors"
                >
                  Clear Components
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Przycisk dodawania kolejnego Kontenera */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleAddContainer}
          className="w-full py-3 rounded-xl bg-[#1d2127] hover:bg-[#252a32] border border-dashed border-[#343b47] hover:border-emerald-500/60 text-zinc-300 hover:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ Dodaj nowy Container (message.style)</span>
        </button>
      </div>
    </div>
  );
};

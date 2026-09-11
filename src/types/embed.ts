export type MessageFormatMode = 'text' | 'embed_v1' | 'embed_v2';

export type ButtonStyle = 'success' | 'primary' | 'secondary' | 'danger' | 'link';

export interface DiscordButton {
  id: string;
  label: string;
  style: ButtonStyle;
  emoji?: string;
  url?: string;
}

export interface DiscordSelectOption {
  id: string;
  label: string;
  description?: string;
  emoji?: string;
  value: string;
}

export interface DiscordField {
  name: string;
  value: string;
  inline: boolean;
}

// Typy komponentów wewnątrz Kontenera (message.style)
export type ContainerComponentType =
  | 'button_row'
  | 'select_menu'
  | 'section'
  | 'text_display'
  | 'media_gallery'
  | 'separator';

export interface SectionAccessory {
  type: 'Thumbnail' | 'None';
  fileUrl: string;
  description: string;
  spoiler: boolean;
}

export interface ContainerComponent {
  id: string;
  type: ContainerComponentType;
  collapsed?: boolean;

  // Dla 'text_display'
  content?: string;

  // Dla 'section'
  accessory?: SectionAccessory;
  sectionContent?: string;

  // Dla 'button_row'
  buttons?: DiscordButton[];

  // Dla 'select_menu'
  placeholder?: string;
  disabled?: boolean;
  options?: DiscordSelectOption[];

  // Dla 'separator'
  spacing?: 'Small' | 'Medium' | 'Large';
  divider?: boolean;

  // Dla 'media_gallery'
  mediaUrls?: string[];
}

export interface MessageContainer {
  id: string;
  title?: string;
  color: string;
  spoiler: boolean;
  collapsed?: boolean;
  components: ContainerComponent[];
}

export interface EmbedConfig {
  mode: MessageFormatMode;
  plainText: string;

  // Dla klasycznego Embed v1
  title: string;
  description: string;
  color: string;
  authorName: string;
  authorIcon: string;
  thumbnailUrl: string;
  imageUrl: string;
  footerText: string;
  fields: DiscordField[];

  // Dla message.style Kontenerów (Embed v2)
  containers: MessageContainer[];
}

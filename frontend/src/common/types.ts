export interface StoreContextType {
  authenticated: boolean;
  userId?: string;
  displayName?: string;
  email?: string;
  isAuthenticating: boolean;

  activeCharacter?: CharacterType;
  setActiveCharacter: (v: CharacterType | undefined) => void;

  activeSession?: SessionType;
  setActiveSession: (v: SessionType | undefined) => void;
}

export interface LayoutContextType {
  sideBarWidth?: number;
  topBarHeight?: number;
}

export interface SideBarProps {
  active?: boolean;
}

export interface TopBarProps {
  setSideBarActive: (v: boolean) => void;
}

export interface DarkOverlayProps {
  active: boolean;
  setActive: (v: boolean) => void;
  zIndex?: number;
}

export interface ExampleExchange {
  role: string;
  content: string;
  name?: string;
}

export interface CharacterType {
  createdAt: string;
  createdBy: string;
  description: string;
  exampleExchanges: ExampleExchange[];
  favoriteWords: string[];
  id: string;
  image: string | null;
  knowledge: string[];
  name: string;
  personalities: string[];
  private: boolean;
  uses: number;
  responseStyles: string[];
}

export interface CharacterItemProps extends CharacterType {
  onDelete: (id: string) => void;
  isOwner?: boolean;
}

export interface CharacterEditorFields {
  name: string;
  description: string;
  knowledge?: string[];
  personalities?: string[];
  favoriteWords?: string[];
  responseStyles?: string[];
  exampleExchanges?: ExampleExchange[];
  private?: boolean;
  image?: string;
  [key: string]: any;
}

export interface SessionType {
  characterId: string;
  createdBy: string;
  id: string;
  name: string;
  new?: boolean;
}

export interface MessageType {
  characterId: string;
  content: string;
  createdAt: string;
  role: string;
  id: string;
  comments?: string | null;
  contradictions?: string | null;
}

export interface MessageProps extends MessageType {
  joined?: boolean;
  typing?: boolean;
  error?: boolean;
  retry?: () => void;
}

export interface ChatBoxProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export interface MessageViewProps {
  messages: MessageType[];
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
  scrollToBottom: () => void;
  retry: () => void;
  loadMore: boolean;
  showTyping: boolean;
  error?: ChatErrorType;
}

export interface ChatErrorType {
  message: string;
}

export interface TopBarSecondaryProps {
  title: string;
}

export interface CharacterEditorProps {
  characterId?: string;
  createMode?: boolean;
}

export interface ListFieldProps {
  title: string;
  fields: CharacterEditorFields;
  setFields: React.Dispatch<React.SetStateAction<CharacterEditorFields>>;
  targetField: string;
  inputPlaceholder: string;
  buttonTitle: string;
  minLength: number;
  maxLength: number;
  limit: number;
  disabledButtonMessage?: string;
  description?: string;
  maxWidth?: string;
}

export interface SearchInputProps {
  placeholder?: string;
  defaultValue?: string;
  onSearch: (v: string) => void;
}

export interface CharactersContextType {
  query?: string;
  setQuery: (v: string | undefined) => void;
}

export interface CharactersViewProps {
  params?: object;
}

export interface RealtimeResponseStreamType {
  response: string | null;
  comments: string | null;
  contradictions: string | null;
}

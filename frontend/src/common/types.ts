import React from "react";

export interface UserPlanDetails {
  characters: number;
  id: string;
  maxCharacters: number;
  maxRequests: number;
  name: string;
  requests: number;
  verified: boolean;
  subscriptionId?: string | null;
  subscriptionStatus: "pending" | "activated" | null;
}

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

  userPlanDetails?: UserPlanDetails;
  fetchUserData: () => void;

  storyMode?: boolean;
  storyModeContent?: string | null;
  setStoryMode: (value: boolean) => void;
  setStoryModeContent: (value: string | null) => void;
  setColorScheme: (value: "dark" | "light") => void;
  tweaks: TweaksType | null;
  setTweaks: (value: TweaksType | null) => void;
}

export interface CharacterViewOutletContextType {
  details: CharacterType;
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
  publicDescription: string;
  description: string | null;
  exampleExchanges: ExampleExchange[];
  favoriteWords: string[];
  id: string;
  image: string | null;
  avatarId: string | null;
  knowledge: string[];
  name: string;
  personalities: string[];
  private: boolean;
  uses: number;
  responseStyles: string[];
  favorite: boolean;
  definitionVisibility: boolean;
  nsfw: boolean;
  tags: string[];
  tagsSimilarity: number | null;
}

export interface CharacterItemProps extends CharacterType {
  onDelete: (id: string) => void;
  isOwner?: boolean;
}

export interface SessionType {
  characterId: string;
  createdBy: string;
  id: string;
  name: string;
  storyMode: boolean;
  story: string | null;
  messagesCount?: number;
  lastUsed?: string;
  new?: boolean;
  tweaks: TweaksType | null;
}

export interface MessageType {
  characterId: string;
  content: string;
  createdAt: string;
  role: string;
  id: string;
  createdBy: string;
  generated?: boolean;
  regenerated?: boolean;
  name?: string | null;
  comments?: string | null;
  contradictions?: string | null;
  knowledgeHint?: string | null;
  processingTime?: number | null;

  // Frontend states
  new?: boolean;
}

export interface MessageProps {
  name: string;
  content: string;
  role: string;
  id: string;
  createdAt: string;
  contextMenuButton?: boolean;
  errorContents?: React.ReactNode;
  error?: boolean;
  retryButton?: boolean;
  retryFunction?: () => void;
  regenerateButton?: boolean;
  regenerateFunction?: () => void;
  deleteFunction?: (id: string) => void;
  comments?: string;
  knowledgeHint?: string;
  authorId?: string;
  typing?: boolean;
  avatar?: string;
  followup?: boolean;
  processingTime?: number | null;

  // Frontend states
  new?: boolean;
}

export interface MessageDetailsProps {
  message: MessageProps;
  hovered: boolean;
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
  sort: "latest" | "uses";
}

export interface CharactersViewProps {
  params?: object;
}

export interface RealtimeResponseStreamType {
  response: string | null;
  comments: string | null;
  contradictions: string | null;
}

export interface CharacterEditorFields {
  name: string;
  description: string;
  personalities?: string[];
  favoriteWords?: string[];
  responseStyles?: string[];
  exampleExchanges?: ExampleExchange[];
  private?: boolean;
  image?: string;
  [key: string]: any;
}

export interface CharacterEditorContextType {
  onSubmit: () => void;
  fields: CharacterEditorFields;
  setFields: React.Dispatch<React.SetStateAction<CharacterEditorFields>>;
  id: string | null;
  method: string;
  knowledge: KnowledgePatchType[];
  setKnowledge: React.Dispatch<React.SetStateAction<KnowledgePatchType[]>>;
  setLoadingOpen: (value: boolean) => void;
}

export interface KnowledgeType {
  characterId: string;
  createdBy: string;
  id: string;
  content: string;
}

export interface KnowledgePatchType {
  id?: string;
  content: string;
}

export interface GlobalModalPopupProps {
  hideIn?: number;
  content: React.ReactNode;
  variant: "error" | "success" | "warning" | "info";
  title?: string;
  showCounter: number;
}

export interface UserDetailsLimit {
  limit: number;
  current: number;
}

export interface UserDetailsLimits {
  messages: UserDetailsLimit;
  characters: UserDetailsLimit;
}

export interface UserDetailsStatistics {
  messages: number;
}

export interface UserDetailsBasic {
  email: string;
  display_name: string;
  admin: boolean;
  plan: string;
  plan_name: string;
  created_at: string;
}

export interface UserDetails {
  basic: UserDetailsBasic;
  limits: UserDetailsLimits;
  statistics: UserDetailsStatistics;
}

export interface CharacterFormType {
  name: string;
  avatar_id: string | null;
  public_description: string | null;
  description: string;
  personalities: string[];
  response_styles: string[];
  favorite_words: string[];
  knowledge: KnowledgePatchType[];
  example_exchanges: ExampleExchange[];
  private: boolean;
  definition_visibility: boolean;
  nsfw: boolean;
  tags: string[];

  // Non-submittable
  previewOnly: boolean;
  characterId: string | null;
}

export interface TweaksType {
  length?: string;
  creativity?: string;
}

export interface TagFilterType {
  characters: number;
  name: string;
}

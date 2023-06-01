import { createContext } from "react";
import { CharacterEditorContextType } from "../common/types";

const CharacterEditorContext = createContext<CharacterEditorContextType | null>(null);
export default CharacterEditorContext;

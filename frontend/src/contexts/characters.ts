import { createContext } from "react";
import { CharactersContextType } from "../common/types";

export default createContext<CharactersContextType | null>(null);

import { createContext } from "react";
import { LayoutContextType } from "../common/types";

export default createContext<LayoutContextType | null>(null);

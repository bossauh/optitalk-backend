import { createContext } from "react";
import { StoreContextType } from "../common/types";

export default createContext<StoreContextType | null>(null);

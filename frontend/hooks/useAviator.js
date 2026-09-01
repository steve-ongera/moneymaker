import { useContext } from "react";
import { GameContext } from "../context/GameContext.jsx";

export function useAviator() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useAviator must be used within a GameProvider");
  return ctx;
}

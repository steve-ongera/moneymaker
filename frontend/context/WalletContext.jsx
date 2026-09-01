import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as api from "../services/api.js";
import { AuthContext } from "./AuthContext.jsx";

export const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const auth = useContext(AuthContext);
  const [balance, setBalance] = useState("0.00");
  const [currency, setCurrency] = useState("KES");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!auth?.isAuthenticated) return;
    try {
      const data = await api.getWallet();
      setBalance(data.balance);
      setCurrency(data.currency);
    } catch {
      // handled globally by the api client's error interceptor
    }
  }, [auth?.isAuthenticated]);

  const refreshTransactions = useCallback(async () => {
    if (!auth?.isAuthenticated) return;
    setLoading(true);
    try {
      const data = await api.getTransactions();
      setTransactions(data.results || data);
    } finally {
      setLoading(false);
    }
  }, [auth?.isAuthenticated]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  // Called by GameContext whenever a WS event reports a new balance, so the
  // wallet UI updates instantly without waiting for a REST refetch.
  const setBalanceFromServer = useCallback((newBalance) => {
    setBalance(newBalance);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        balance,
        currency,
        transactions,
        loading,
        refreshWallet,
        refreshTransactions,
        setBalanceFromServer,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

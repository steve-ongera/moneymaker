//context/WalletContext.jsx
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
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [depositStatus, setDepositStatus] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);

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

  // ============================================================
  // Deposit
  // ============================================================
  const initiateDeposit = useCallback(async ({ phoneNumber, amount }) => {
    if (!auth?.isAuthenticated) {
      throw new Error("Please login to make a deposit");
    }

    setIsProcessingDeposit(true);
    setDepositStatus({ status: "PENDING", message: "Initiating payment..." });

    try {
      const response = await api.initiateDeposit({ phoneNumber, amount });
      
      if (response.success) {
        setDepositStatus({
          status: "PENDING",
          message: "STK Push sent. Please check your phone and enter M-Pesa PIN.",
          checkoutRequestId: response.data.checkout_request_id,
          depositId: response.data.deposit_id,
          isMock: response.data.is_mock || false,
        });

        // Start polling for deposit status
        const poll = api.pollDepositStatus(
          response.data.checkout_request_id,
          // onSuccess
          (result) => {
            setDepositStatus({
              status: "COMPLETED",
              message: "Payment successful! Your wallet has been credited.",
              data: result.data,
            });
            setIsProcessingDeposit(false);
            refreshWallet();
            refreshTransactions();
          },
          // onError
          (error) => {
            setDepositStatus({
              status: "FAILED",
              message: error || "Payment failed. Please try again.",
            });
            setIsProcessingDeposit(false);
          },
          // onTimeout
          (timeoutMsg) => {
            setDepositStatus({
              status: "TIMEOUT",
              message: timeoutMsg || "Payment timeout. Please check your M-Pesa statement.",
            });
            setIsProcessingDeposit(false);
          }
        );

        setPollInterval(poll);
        return response;
      } else {
        setDepositStatus({
          status: "FAILED",
          message: response.error || "Failed to initiate payment.",
        });
        setIsProcessingDeposit(false);
        throw new Error(response.error || "Failed to initiate payment");
      }
    } catch (error) {
      setDepositStatus({
        status: "FAILED",
        message: error.message || "Failed to initiate payment.",
      });
      setIsProcessingDeposit(false);
      throw error;
    }
  }, [auth?.isAuthenticated, refreshWallet, refreshTransactions]);

  const checkDepositStatus = useCallback(async (checkoutRequestId) => {
    try {
      const response = await api.checkDepositStatus(checkoutRequestId);
      setDepositStatus({
        status: response.status,
        message: response.status === "COMPLETED" 
          ? "Payment successful! Your wallet has been credited."
          : response.status === "FAILED"
          ? response.data?.result_desc || "Payment failed"
          : "Processing payment...",
        data: response.data,
      });

      if (response.status === "COMPLETED") {
        refreshWallet();
        refreshTransactions();
        setIsProcessingDeposit(false);
        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
      } else if (response.status === "FAILED") {
        setIsProcessingDeposit(false);
        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
      }

      return response;
    } catch (error) {
      console.error("Error checking deposit status:", error);
      throw error;
    }
  }, [pollInterval, refreshWallet, refreshTransactions]);

  const resetDepositState = useCallback(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    setIsProcessingDeposit(false);
    setDepositStatus(null);
  }, [pollInterval]);

  // ============================================================
  // Withdrawal
  // ============================================================
  const initiateWithdrawal = useCallback(async ({ amount }) => {
    if (!auth?.isAuthenticated) {
      throw new Error("Please login to make a withdrawal");
    }

    setIsProcessingDeposit(true);
    setDepositStatus({ status: "PENDING", message: "Processing withdrawal..." });

    try {
      const response = await api.initiateWithdrawal({ amount });
      
      if (response.success) {
        setDepositStatus({
          status: "PENDING",
          message: "Withdrawal request submitted successfully. Processing...",
          data: response.data,
        });
        
        // Refresh wallet after withdrawal
        refreshWallet();
        refreshTransactions();
        setIsProcessingDeposit(false);
        
        // Auto clear status after 5 seconds
        setTimeout(() => {
          if (depositStatus?.status === "PENDING") {
            setDepositStatus({
              status: "COMPLETED",
              message: `Withdrawal of KSh ${amount} submitted successfully.`,
            });
          }
        }, 5000);
        
        return response;
      } else {
        setDepositStatus({
          status: "FAILED",
          message: response.error || "Failed to process withdrawal.",
        });
        setIsProcessingDeposit(false);
        throw new Error(response.error || "Failed to process withdrawal");
      }
    } catch (error) {
      setDepositStatus({
        status: "FAILED",
        message: error.message || "Failed to process withdrawal.",
      });
      setIsProcessingDeposit(false);
      throw error;
    }
  }, [auth?.isAuthenticated, refreshWallet, refreshTransactions]);

  // ============================================================
  // Cleanup polling on unmount
  // ============================================================
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

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
        isProcessingDeposit,
        depositStatus,
        refreshWallet,
        refreshTransactions,
        setBalanceFromServer,
        initiateDeposit,
        checkDepositStatus,
        resetDepositState,
        initiateWithdrawal,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Custom hook for using wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
import { useEffect } from "react";
import { useWallet } from "../hooks/useWallet.js";
import TransactionList from "../components/TransactionList.jsx";

export default function Transactions() {
  const { transactions, loading, refreshTransactions } = useWallet();

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  return (
    <div className="page page-transactions">
      <h1><i className="bi bi-receipt" /> Transactions</h1>
      <TransactionList transactions={transactions} loading={loading} />
    </div>
  );
}

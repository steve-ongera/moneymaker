const TYPE_META = {
  DEPOSIT: { icon: "bi-arrow-down-circle-fill", cls: "tx-credit" },
  WIN: { icon: "bi-trophy-fill", cls: "tx-credit" },
  REFUND: { icon: "bi-arrow-counterclockwise", cls: "tx-credit" },
  BET: { icon: "bi-dice-5-fill", cls: "tx-debit" },
  WITHDRAWAL: { icon: "bi-arrow-up-circle-fill", cls: "tx-debit" },
};

export default function TransactionList({ transactions, loading }) {
  if (loading) return <p>Loading transactions...</p>;
  if (!transactions?.length) return <p className="empty-state">No transactions yet.</p>;

  return (
    <div className="transaction-list">
      {transactions.map((tx) => {
        const meta = TYPE_META[tx.tx_type] || { icon: "bi-circle", cls: "" };
        return (
          <div key={tx.id} className="transaction-row">
            <i className={`bi ${meta.icon} ${meta.cls}`} />
            <div className="transaction-info">
              <span className="transaction-type">{tx.tx_type}</span>
              <span className="transaction-date">{new Date(tx.created_at).toLocaleString()}</span>
            </div>
            <span className={`transaction-amount ${meta.cls}`}>
              {Number(tx.amount) >= 0 ? "+" : ""}
              {tx.amount}
            </span>
            <span className="transaction-balance">Bal: {tx.balance_after}</span>
          </div>
        );
      })}
    </div>
  );
}

import BetCard from "./BetCard.jsx";

export default function BettingHistory({ bets, loading }) {
  if (loading) return <p>Loading bet history...</p>;
  if (!bets?.length) return <p className="empty-state">No bets placed yet.</p>;

  return (
    <div className="betting-history-grid">
      {bets.map((bet) => (
        <BetCard key={bet.id} bet={bet} />
      ))}
    </div>
  );
}

import "./Card.css"

export default function Card({ header, value }) {
  return (
    <div className="card">
      <div className="card-label">{header}</div>
      <div className="card-value">{value}</div>
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="about-page">
      <h1>About This Tool</h1>
      <div className="summary-card">
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          More information coming soon.
        </p>
      </div>
      <div className="btn-group" style={{ justifyContent: 'center' }}>
        <Link to="/" className="btn btn-secondary">&larr; Back to Home</Link>
      </div>
    </div>
  );
}

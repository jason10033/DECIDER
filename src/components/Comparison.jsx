import { Link } from 'react-router-dom';
import comparisonContent from '../content/comparison.json';

export default function Comparison() {
  const { title, intro, options, categories, bestFor } = comparisonContent;

  return (
    <div className="comparison-page">
      <h1>{title}</h1>
      <p className="comparison-intro">{intro}</p>

      {/* Desktop Table */}
      <table className="comparison-table">
        <thead>
          <tr>
            <th></th>
            {options.map(opt => (
              <th key={opt.id} className={opt.colorClass}>
                {opt.name}
                <br />
                <span style={{ fontWeight: 400, fontSize: '0.8rem', opacity: 0.9 }}>
                  ({opt.brandName})
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, idx) => (
            <tr key={idx}>
              <td>{cat.label}</td>
              {options.map(opt => (
                <td key={opt.id}>{cat[opt.id]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Cards */}
      <div className="comparison-cards-mobile">
        {options.map(opt => (
          <div key={opt.id} className="comparison-mobile-card">
            <div className={`card-header ${opt.colorClass}`}>
              {opt.name} ({opt.brandName})
            </div>
            {categories.map((cat, idx) => (
              <div key={idx} className="card-row">
                <div className="row-label">{cat.label}</div>
                <div className="row-value">{cat[opt.id]}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Best For Section */}
      {bestFor && bestFor.length > 0 && (
        <div className="best-for-section">
          <h2>Which option might be best for you?</h2>
          <div className="best-for-grid">
            {bestFor.map(item => (
              <div key={item.id} className={`best-for-item ${item.colorClass}`}>
                <h3>{item.title}</h3>
                <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left' }}>
                  {item.points.map((point, i) => (
                    <li key={i} style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-muted)',
                      padding: 'var(--space-xs) 0',
                      paddingLeft: 'var(--space-lg)',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: 'var(--color-secondary)'
                      }}>&#10003;</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="btn-group">
        <Link to="/education" className="btn btn-secondary">&larr; Back</Link>
        <Link to="/assessment" className="btn btn-primary">Continue to Assessment &rarr;</Link>
      </div>
    </div>
  );
}

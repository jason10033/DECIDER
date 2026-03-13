import { useState } from 'react';
import { Link } from 'react-router-dom';
import comparisonContent from '../content/comparison.json';

export default function Comparison() {
  const { title, intro, options, categories, bestFor } = comparisonContent;

  // Default to first two options selected
  const [selected, setSelected] = useState([options[0].id, options[1].id]);

  const handleSelect = (index, optionId) => {
    setSelected(prev => {
      const next = [...prev];
      next[index] = optionId;
      return next;
    });
  };

  const selectedOptions = selected.map(id => options.find(o => o.id === id));
  const selectedBestFor = selected.map(id => bestFor.find(b => b.id === id));

  return (
    <div className="comparison-page">
      <h1>{title}</h1>
      <p className="comparison-intro">{intro}</p>

      {/* Method Picker */}
      <div className="side-by-side-picker">
        <div className="picker-column">
          <label className="picker-label">First option</label>
          <select
            className="picker-select"
            value={selected[0]}
            onChange={(e) => handleSelect(0, e.target.value)}
          >
            {options.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.name} ({opt.brandName})
              </option>
            ))}
          </select>
        </div>
        <div className="picker-vs">vs</div>
        <div className="picker-column">
          <label className="picker-label">Second option</label>
          <select
            className="picker-select"
            value={selected[1]}
            onChange={(e) => handleSelect(1, e.target.value)}
          >
            {options.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.name} ({opt.brandName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Comparison Table */}
      <div className="sbs-comparison">
        {/* Column Headers */}
        <div className="sbs-header">
          <div className={`sbs-header-cell ${selectedOptions[0]?.colorClass}`}>
            <div className="sbs-header-name">{selectedOptions[0]?.name}</div>
            <div className="sbs-header-brand">{selectedOptions[0]?.brandName}</div>
          </div>
          <div className={`sbs-header-cell ${selectedOptions[1]?.colorClass}`}>
            <div className="sbs-header-name">{selectedOptions[1]?.name}</div>
            <div className="sbs-header-brand">{selectedOptions[1]?.brandName}</div>
          </div>
        </div>

        {/* Comparison Rows */}
        {categories.map((cat, idx) => (
          <div key={idx} className="sbs-row">
            <div className="sbs-row-label">{cat.label}</div>
            <div className="sbs-row-values">
              <div className={`sbs-cell ${selectedOptions[0]?.colorClass}-bg`}>
                {cat[selected[0]]}
              </div>
              <div className={`sbs-cell ${selectedOptions[1]?.colorClass}-bg`}>
                {cat[selected[1]]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Best For Section - only for selected two */}
      {selectedBestFor.some(b => b) && (
        <div className="best-for-section">
          <h2>Which one might be best for you?</h2>
          <div className="best-for-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {selectedBestFor.map((item, idx) => item && (
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

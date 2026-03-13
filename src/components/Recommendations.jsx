import { Link } from 'react-router-dom';

export default function Recommendations({ recommendation, assessmentResponses, selectedAlternativeIds, onToggleAlternative }) {
  if (!recommendation || !recommendation.primary) {
    return (
      <div className="recommendations-page">
        <h1>Your Personalized Results</h1>
        <p className="recommendations-intro">
          Please complete the assessment first to see your personalized PrEP recommendations.
        </p>
        <div className="btn-group">
          <Link to="/assessment" className="btn btn-primary">&larr; Go to Assessment</Link>
        </div>
      </div>
    );
  }

  const { primary, alternatives, rationale, summarySentence } = recommendation;

  return (
    <div className="recommendations-page">
      <h1>Your Personalized Results</h1>
      <p className="recommendations-intro">
        Based on your answers, here is a personalized overview of which PrEP option may be the best fit for you.
        Remember, this is a starting point for your conversation with your healthcare provider.
      </p>

      {/* Summary Sentence */}
      {summarySentence && (
        <div className="summary-sentence" style={{ marginBottom: 'var(--space-lg)' }}>
          <p>{summarySentence}</p>
        </div>
      )}

      {/* Primary Recommendation */}
      <div className={`recommendation-card primary-rec ${primary.colorClass}`}>
        <span className="recommendation-label top-match">Top Match</span>
        <h2>{primary.name}</h2>
        <p>{primary.heading}</p>

        {/* Personalized rationale - WHY this was chosen */}
        {rationale && rationale.length > 0 && (
          <>
            <h3>Why we matched you with this option</h3>
            <ul className="action-items">
              {rationale.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </>
        )}

        <h3 style={{ marginTop: 'var(--space-lg)' }}>Key benefits</h3>
        <ul className="action-items">
          {primary.reasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>

        {primary.considerations && primary.considerations.length > 0 && (
          <>
            <h3 style={{ marginTop: 'var(--space-lg)' }}>Things to consider</h3>
            <ul className="key-points">
              {primary.considerations.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {primary.specialNote && (
          <div className="callout important" style={{ marginTop: 'var(--space-lg)' }}>
            <p>{primary.specialNote}</p>
          </div>
        )}
      </div>

      {/* Other Options - Opt-in for Summary */}
      {alternatives && alternatives.length > 0 && (
        <div className="alternatives-section">
          <h2>Other Options to Explore</h2>
          <p className="alternatives-intro">
            Check any options you'd also like to discuss with your provider. They'll appear on your printable summary.
          </p>
          {alternatives.map((alt, idx) => {
            const isSelected = selectedAlternativeIds?.includes(alt.id);
            return (
              <div key={idx} className={`recommendation-card alternative-selectable ${alt.colorClass} ${isSelected ? 'alt-selected' : ''}`}>
                <label className="alt-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isSelected || false}
                    onChange={() => onToggleAlternative?.(alt.id)}
                  />
                  <span className="alt-checkbox-text">Include in my summary</span>
                </label>
                <span className="recommendation-label also-consider">Also Consider</span>
                <h2>{alt.name}</h2>
                <p>{alt.heading}</p>
                {alt.reasons && (
                  <ul className="action-items">
                    {alt.reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="btn-group">
        <Link to="/assessment" className="btn btn-secondary">&larr; Back</Link>
        <Link to="/resources" className="btn btn-primary">View Resources &rarr;</Link>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function Recommendations({ recommendation, assessmentResponses }) {
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

  const { primary, alternatives, providerTips } = recommendation;

  return (
    <div className="recommendations-page">
      <h1>Your Personalized Results</h1>
      <p className="recommendations-intro">
        Based on your answers, here is a personalized overview of which PrEP option may be the best fit for you.
        Remember, this is a starting point for your conversation with your healthcare provider.
      </p>

      {/* Primary Recommendation */}
      <div className={`recommendation-card primary-rec ${primary.id}`}>
        <span className="recommendation-label top-match">Top Match</span>
        <h2>{primary.name}</h2>
        <p>{primary.heading}</p>

        <h3>Why this might work for you</h3>
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
      </div>

      {/* Alternative Options */}
      {alternatives && alternatives.length > 0 && (
        <>
          {alternatives.map((alt, idx) => (
            <div key={idx} className={`recommendation-card ${alt.id}`}>
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
          ))}
        </>
      )}

      {/* Questions to Ask Your Provider */}
      {primary.providerQuestions && primary.providerQuestions.length > 0 && (
        <div className="provider-section">
          <h2>Questions to Ask Your Provider</h2>
          <ul className="provider-tips">
            {primary.providerQuestions.map((question, i) => (
              <li key={i}>{question}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Provider Conversation Starters */}
      {providerTips && providerTips.length > 0 && (
        <div className="provider-section" style={{ background: 'var(--color-injectable-6mo-light)' }}>
          <h2>Ways to Start the Conversation</h2>
          <ul className="provider-tips">
            {providerTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="btn-group">
        <Link to="/assessment" className="btn btn-secondary">&larr; Back</Link>
        <Link to="/resources" className="btn btn-primary">View Resources &rarr;</Link>
      </div>
    </div>
  );
}

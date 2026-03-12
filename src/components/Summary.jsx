import { Link } from 'react-router-dom';

function getAnswerLabel(questionId, value, questions) {
  const question = questions.find(q => q.id === questionId);
  if (!question) return value;
  if (Array.isArray(value)) {
    return value.map(v => {
      const opt = question.options.find(o => o.value === v);
      return opt ? opt.label : v;
    }).join(', ');
  }
  const option = question.options.find(o => o.value === value);
  return option ? option.label : value;
}

export default function Summary({ recommendation, assessmentResponses, assessmentContent }) {
  const questions = assessmentContent?.questions || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="summary-page">
      <h1>Your PrEP Conversation Guide</h1>
      <p className="summary-subtitle">
        Take this summary to your next healthcare visit to help guide your conversation about PrEP.
      </p>

      {/* About Me Section */}
      <div className="summary-card">
        <h2>About Me</h2>
        {questions.map(q => {
          const answer = assessmentResponses?.[q.id];
          if (answer === undefined || answer === null) return null;
          return (
            <div key={q.id} className="response-item">
              <span className="response-label">{q.text}</span>
              <span className="response-value">
                {getAnswerLabel(q.id, answer, questions)}
              </span>
            </div>
          );
        })}
      </div>

      {/* I'm Interested In */}
      {recommendation?.primary && (
        <div className="summary-card">
          <h2>I'm Interested In</h2>
          <div className={`recommendation-card ${recommendation.primary.id}`} style={{ marginBottom: 0 }}>
            <span className="recommendation-label top-match">Top Match</span>
            <h3>{recommendation.primary.name}</h3>
            <p>{recommendation.primary.heading}</p>
            {recommendation.primary.reasons && (
              <ul className="action-items">
                {recommendation.primary.reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* I'd Also Like to Learn About */}
      {recommendation?.alternatives && recommendation.alternatives.length > 0 && (
        <div className="summary-card">
          <h2>I'd Also Like to Learn About</h2>
          {recommendation.alternatives.map((alt, idx) => (
            <div key={idx} className={`recommendation-card ${alt.id}`}>
              <span className="recommendation-label also-consider">Also Consider</span>
              <h3>{alt.name}</h3>
              <p>{alt.heading}</p>
            </div>
          ))}
        </div>
      )}

      {/* Questions I Have */}
      <div className="summary-card">
        <h2>Questions I Have</h2>
        {recommendation?.primary?.providerQuestions && (
          <ul className="checklist">
            {recommendation.primary.providerQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        )}
        <div className="notes-section">
          <p>Write additional questions or notes here:</p>
        </div>
      </div>

      {/* My Next Steps */}
      <div className="summary-card">
        <h2>My Next Steps</h2>
        <ul className="checklist">
          <li>Schedule an appointment with my healthcare provider</li>
          <li>Ask about getting tested for HIV before starting PrEP</li>
          <li>Discuss which PrEP option is right for me</li>
          <li>Ask about costs, insurance coverage, and assistance programs</li>
          <li>Learn about follow-up visits and monitoring</li>
        </ul>
      </div>

      {/* Print Button */}
      <div className="print-cta">
        <button onClick={handlePrint} className="btn btn-primary btn-lg">
          Print This Guide
        </button>
      </div>

      <div className="btn-group" style={{ justifyContent: 'center' }}>
        <Link to="/resources" className="btn btn-secondary">&larr; Back to Resources</Link>
        <Link to="/" className="btn btn-secondary">Start Over</Link>
      </div>
    </div>
  );
}

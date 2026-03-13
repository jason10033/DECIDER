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

// Group questions into logical categories for a cleaner layout
const questionGroups = [
  {
    label: 'My Preferences',
    ids: ['prep_02', 'prep_03', 'prep_04', 'prep_09']
  },
  {
    label: 'My Situation',
    ids: ['prep_00', 'prep_01', 'prep_05', 'prep_06', 'prep_07', 'prep_10']
  },
  {
    label: 'My Concerns',
    ids: ['prep_08']
  }
];

export default function Summary({ recommendation, assessmentResponses, assessmentContent, selectedAlternatives, selectedQuestionIds, selectedStarterIds }) {
  const questions = assessmentContent?.questions || [];

  const handlePrint = () => {
    window.print();
  };

  // Get selected questions and starters
  const dynamicQuestions = recommendation?.dynamicQuestions || [];
  const dynamicStarters = recommendation?.dynamicConversationStarters || [];
  const selectedQuestions = (selectedQuestionIds || []).map(i => dynamicQuestions[i]).filter(Boolean);
  const selectedStarters = (selectedStarterIds || []).map(i => dynamicStarters[i]).filter(Boolean);

  return (
    <div className="summary-page">
      <h1>Your PrEP Conversation Guide</h1>
      <p className="summary-subtitle">
        Take this summary to your next healthcare visit to help guide your conversation about PrEP.
      </p>

      {/* 1. Summary - AI generated sentence */}
      {recommendation?.summarySentence && (
        <div className="summary-card">
          <h2>Summary</h2>
          <div className="summary-sentence">
            <p>{recommendation.summarySentence}</p>
          </div>
        </div>
      )}

      {/* 2. I'm Interested In */}
      {recommendation?.primary && (
        <div className="summary-card">
          <h2>I'm Interested In</h2>
          <div className={`recommendation-card ${recommendation.primary.colorClass}`} style={{ marginBottom: 0 }}>
            <span className="recommendation-label top-match">Top Match</span>
            <h3>{recommendation.primary.name}</h3>
            <p>{recommendation.primary.heading}</p>

            {recommendation.rationale && recommendation.rationale.length > 0 && (
              <>
                <h4 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}>
                  Why this option matched my preferences:
                </h4>
                <ul className="action-items">
                  {recommendation.rationale.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </>
            )}

            {recommendation.primary.reasons && (
              <>
                <h4 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}>
                  Key benefits of this option:
                </h4>
                <ul className="action-items">
                  {recommendation.primary.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </>
            )}

            {recommendation.primary.considerations && recommendation.primary.considerations.length > 0 && (
              <>
                <h4 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}>
                  Things to discuss with my provider:
                </h4>
                <ul className="key-points">
                  {recommendation.primary.considerations.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </>
            )}

            {recommendation.primary.specialNote && (
              <div className="callout important" style={{ marginTop: 'var(--space-md)' }}>
                <p>{recommendation.primary.specialNote}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. I'd Also Like to Learn About */}
      {selectedAlternatives && selectedAlternatives.length > 0 && (
        <div className="summary-card">
          <h2>I'd Also Like to Learn About</h2>
          {selectedAlternatives.map((alt, idx) => (
            <div key={idx} className={`recommendation-card ${alt.colorClass}`}>
              <span className="recommendation-label also-consider">Also Consider</span>
              <h3>{alt.name}</h3>
              <p>{alt.heading}</p>
            </div>
          ))}
        </div>
      )}

      {/* 4. Questions I Want to Ask */}
      {(selectedQuestions.length > 0 || selectedStarters.length > 0) && (
        <div className="summary-card">
          <h2>Questions I Want to Ask</h2>
          {selectedStarters.length > 0 && (
            <>
              <h3 className="about-me-group-label">How I want to start the conversation</h3>
              <ul className="checklist">
                {selectedStarters.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
          {selectedQuestions.length > 0 && (
            <>
              <h3 className="about-me-group-label" style={{ marginTop: 'var(--space-md)' }}>Questions for my provider</h3>
              <ul className="checklist">
                {selectedQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </>
          )}
          <div className="notes-section">
            <p>Write additional questions or notes here:</p>
          </div>
        </div>
      )}

      {selectedQuestions.length === 0 && selectedStarters.length === 0 && (
        <div className="summary-card">
          <h2>Questions I Want to Ask</h2>
          <div className="notes-section">
            <p>Write your questions or notes here:</p>
          </div>
        </div>
      )}

      {/* 5. My Next Steps */}
      <div className="summary-card">
        <h2>My Next Steps</h2>
        <ul className="checklist">
          <li>Schedule an appointment with my healthcare provider</li>
          <li>Get tested for HIV and STIs before starting PrEP</li>
          <li>Decide together with my provider which PrEP option is right for me</li>
        </ul>
      </div>

      {/* 6. About Me */}
      <div className="summary-card">
        <h2>About Me</h2>
        {questionGroups.map(group => {
          const groupQuestions = group.ids
            .map(id => questions.find(q => q.id === id))
            .filter(Boolean);

          const hasAnswers = groupQuestions.some(q => {
            const answer = assessmentResponses?.[q.id];
            return answer !== undefined && answer !== null;
          });

          if (!hasAnswers) return null;

          return (
            <div key={group.label} className="about-me-group">
              <h3 className="about-me-group-label">{group.label}</h3>
              <div className="about-me-items">
                {groupQuestions.map(q => {
                  const answer = assessmentResponses?.[q.id];
                  if (answer === undefined || answer === null) return null;
                  return (
                    <div key={q.id} className="about-me-item">
                      <span className="about-me-question">{q.text}</span>
                      <span className="about-me-answer">
                        {getAnswerLabel(q.id, answer, questions)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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

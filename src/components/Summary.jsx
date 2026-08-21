import { useState } from 'react';
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
    physicianLabel: 'Preferences',
    ids: ['prep_02', 'prep_03', 'prep_04', 'prep_09']
  },
  {
    label: 'My Situation',
    physicianLabel: 'Clinical Context',
    ids: ['prep_00', 'prep_01', 'prep_05', 'prep_06', 'prep_07', 'prep_10']
  },
  {
    label: 'My Concerns',
    physicianLabel: 'Concerns',
    ids: ['prep_08']
  }
];

// Helper to get pronoun forms from selection
function getPronounForms(pronouns) {
  switch (pronouns) {
    case 'he/him':
      return { subject: 'he', object: 'him', possessive: 'his', reflexive: 'himself' };
    case 'she/her':
      return { subject: 'she', object: 'her', possessive: 'her', reflexive: 'herself' };
    case 'they/them':
      return { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themselves' };
    case 'ze/zir':
      return { subject: 'ze', object: 'zir', possessive: 'zir', reflexive: 'zirself' };
    default:
      return { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themselves' };
  }
}

// Generate text version of physician summary for email
function generatePhysicianEmailBody(name, pronouns, recommendation, assessmentResponses, assessmentContent, selectedAlternatives, selectedQuestionIds, customQuestions) {
  const p = getPronounForms(pronouns);
  const displayName = name || 'Your patient';
  const questions = assessmentContent?.questions || [];
  const dynamicQuestions = recommendation?.dynamicQuestions || [];
  const selectedQuestions = (selectedQuestionIds || []).map(i => dynamicQuestions[i]).filter(Boolean);

  let body = `Physician's Guide for ${displayName}\n`;
  body += `Pronouns: ${pronouns || 'Not specified'}\n`;
  body += '========================================\n\n';

  // Summary
  if (recommendation?.summarySentence) {
    const sentence = recommendation.summarySentence
      .replace(/\bBased on your\b/g, `Based on ${displayName}'s`)
      .replace(/\byour\b/gi, p.possessive)
      .replace(/\bYou\b/g, displayName)
      .replace(/\byou\b/g, p.subject);
    body += `SUMMARY\n${sentence}\n\n`;
  }

  // Primary recommendation
  if (recommendation?.primary) {
    body += `${displayName.toUpperCase()} IS INTERESTED IN\n`;
    body += `Top Match: ${recommendation.primary.name}\n`;
    body += `${recommendation.primary.heading}\n\n`;

    if (recommendation.rationale?.length > 0) {
      body += `Why this option matched ${p.possessive} preferences:\n`;
      recommendation.rationale.forEach(r => { body += `  - ${r}\n`; });
      body += '\n';
    }

    if (recommendation.primary.considerations?.length > 0) {
      body += `Topics to discuss:\n`;
      recommendation.primary.considerations.forEach(c => { body += `  - ${c}\n`; });
      body += '\n';
    }
  }

  // Alternatives
  if (selectedAlternatives?.length > 0) {
    body += `${displayName.toUpperCase()} WOULD ALSO LIKE TO LEARN ABOUT\n`;
    selectedAlternatives.forEach(alt => {
      body += `  - ${alt.name}: ${alt.heading}\n`;
    });
    body += '\n';
  }

  // Questions
  if (selectedQuestions.length > 0 || (customQuestions && customQuestions.length > 0)) {
    body += `QUESTIONS ${displayName.toUpperCase()} WANTS TO ASK\n`;
    selectedQuestions.forEach(q => { body += `  - ${q}\n`; });
    if (customQuestions) {
      customQuestions.forEach(q => { body += `  - ${q}\n`; });
    }
    body += '\n';
  }

  // Next steps
  body += 'RECOMMENDED NEXT STEPS\n';
  body += `  - Discuss PrEP options based on ${displayName}'s preferences and clinical factors\n`;
  body += '  - Order baseline labs: HIV test, STI screening, renal function\n';
  body += `  - Collaboratively select the PrEP regimen that best fits ${p.possessive} needs\n\n`;

  // About patient
  body += `ABOUT ${displayName.toUpperCase()}\n`;
  questionGroups.forEach(group => {
    const groupQuestions = group.ids.map(id => questions.find(q => q.id === id)).filter(Boolean);
    const hasAnswers = groupQuestions.some(q => {
      const answer = assessmentResponses?.[q.id];
      return answer !== undefined && answer !== null;
    });
    if (!hasAnswers) return;

    body += `\n${group.physicianLabel}:\n`;
    groupQuestions.forEach(q => {
      const answer = assessmentResponses?.[q.id];
      if (answer === undefined || answer === null) return;
      body += `  ${q.text}: ${getAnswerLabel(q.id, answer, questions)}\n`;
    });
  });

  return body;
}

// Generate text version of patient summary for email
function generatePatientEmailBody(recommendation, assessmentResponses, assessmentContent, selectedAlternatives, selectedQuestionIds, selectedStarterIds, customQuestions, plan) {
  const questions = assessmentContent?.questions || [];
  const dynamicQuestions = recommendation?.dynamicQuestions || [];
  const dynamicStarters = recommendation?.dynamicConversationStarters || [];
  const selectedQuestions = (selectedQuestionIds || []).map(i => dynamicQuestions[i]).filter(Boolean);
  const selectedStarters = (selectedStarterIds || []).map(i => dynamicStarters[i]).filter(Boolean);

  let body = 'Your PrEP Conversation Guide\n';
  body += '========================================\n\n';

  // Summary
  if (recommendation?.summarySentence) {
    body += `SUMMARY\n${recommendation.summarySentence}\n\n`;
  }

  // Primary recommendation
  if (recommendation?.primary) {
    body += "I'M INTERESTED IN\n";
    body += `Top Match: ${recommendation.primary.name}\n`;
    body += `${recommendation.primary.heading}\n\n`;

    if (recommendation.rationale?.length > 0) {
      body += 'Why this option matched my preferences:\n';
      recommendation.rationale.forEach(r => { body += `  - ${r}\n`; });
      body += '\n';
    }

    if (recommendation.primary.reasons?.length > 0) {
      body += 'Key benefits of this option:\n';
      recommendation.primary.reasons.forEach(r => { body += `  - ${r}\n`; });
      body += '\n';
    }

    if (recommendation.primary.considerations?.length > 0) {
      body += 'Things to discuss with my provider:\n';
      recommendation.primary.considerations.forEach(c => { body += `  - ${c}\n`; });
      body += '\n';
    }
  }

  // Alternatives
  if (selectedAlternatives?.length > 0) {
    body += "I'D ALSO LIKE TO LEARN ABOUT\n";
    selectedAlternatives.forEach(alt => {
      body += `  - ${alt.name}: ${alt.heading}\n`;
    });
    body += '\n';
  }

  // Questions
  if (selectedStarters.length > 0 || selectedQuestions.length > 0 || (customQuestions && customQuestions.length > 0)) {
    body += 'QUESTIONS I WANT TO ASK\n';
    if (selectedStarters.length > 0) {
      body += '\nHow I want to start the conversation:\n';
      selectedStarters.forEach(s => { body += `  - ${s}\n`; });
    }
    if (selectedQuestions.length > 0 || (customQuestions && customQuestions.length > 0)) {
      body += '\nQuestions for my provider:\n';
      selectedQuestions.forEach(q => { body += `  - ${q}\n`; });
      if (customQuestions) {
        customQuestions.forEach(q => { body += `  - ${q}\n`; });
      }
    }
    body += '\n';
  }

  // My plan (implementation intention)
  if (plan && (plan.when || plan.action)) {
    body += 'MY PLAN\n';
    body += `  When ${plan.when || '__________'}, I will ${plan.action || '__________'}.\n\n`;
  }

  // Next steps
  body += 'MY NEXT STEPS\n';
  body += '  - Schedule an appointment with my healthcare provider\n';
  body += '  - Get tested for HIV and STIs before starting PrEP\n';
  body += '  - Decide together with my provider which PrEP option is right for me\n\n';

  // About me
  body += 'ABOUT ME\n';
  questionGroups.forEach(group => {
    const groupQuestions = group.ids.map(id => questions.find(q => q.id === id)).filter(Boolean);
    const hasAnswers = groupQuestions.some(q => {
      const answer = assessmentResponses?.[q.id];
      return answer !== undefined && answer !== null;
    });
    if (!hasAnswers) return;

    body += `\n${group.label}:\n`;
    groupQuestions.forEach(q => {
      const answer = assessmentResponses?.[q.id];
      if (answer === undefined || answer === null) return;
      body += `  ${q.text}: ${getAnswerLabel(q.id, answer, questions)}\n`;
    });
  });

  return body;
}

export default function Summary({
  recommendation, assessmentResponses, assessmentContent,
  selectedAlternatives, selectedQuestionIds, selectedStarterIds,
  customQuestions,
  patientName, onPatientNameChange, patientPronouns, onPatientPronounsChange,
  plan, onPlanChange
}) {
  const [viewMode, setViewMode] = useState('patient'); // 'patient' or 'physician'
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [patientEmailAddress, setPatientEmailAddress] = useState('');
  const [showPatientEmailForm, setShowPatientEmailForm] = useState(false);
  const questions = assessmentContent?.questions || [];

  const isPhysician = viewMode === 'physician';
  const displayName = patientName || 'the patient';
  const p = getPronounForms(patientPronouns);

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    if (!emailAddress) return;
    const subject = encodeURIComponent(`PrEP Conversation Guide for ${patientName || 'Your Patient'}`);
    const body = encodeURIComponent(generatePhysicianEmailBody(
      patientName, patientPronouns, recommendation, assessmentResponses,
      assessmentContent, selectedAlternatives, selectedQuestionIds, customQuestions
    ));
    window.open(`mailto:${emailAddress}?subject=${subject}&body=${body}`, '_self');
    setShowEmailForm(false);
  };

  const handlePatientEmail = () => {
    if (!patientEmailAddress) return;
    const subject = encodeURIComponent('My PrEP Conversation Guide');
    const body = encodeURIComponent(generatePatientEmailBody(
      recommendation, assessmentResponses, assessmentContent,
      selectedAlternatives, selectedQuestionIds, selectedStarterIds, customQuestions, plan
    ));
    window.open(`mailto:${patientEmailAddress}?subject=${subject}&body=${body}`, '_self');
    setShowPatientEmailForm(false);
  };

  // Get selected questions and starters
  const dynamicQuestions = recommendation?.dynamicQuestions || [];
  const dynamicStarters = recommendation?.dynamicConversationStarters || [];
  const selectedQuestions = (selectedQuestionIds || []).map(i => dynamicQuestions[i]).filter(Boolean);
  const selectedStarters = (selectedStarterIds || []).map(i => dynamicStarters[i]).filter(Boolean);

  // Transform summary sentence for physician view
  const getSummarySentence = () => {
    if (!recommendation?.summarySentence) return null;
    if (!isPhysician) return recommendation.summarySentence;
    return recommendation.summarySentence
      .replace(/\bBased on your\b/g, `Based on ${displayName}'s`)
      .replace(/\byour\b/gi, p.possessive)
      .replace(/\bYou\b/g, displayName)
      .replace(/\byou\b/g, p.subject);
  };

  return (
    <div className="summary-page">
      {/* View Toggle */}
      <div className="summary-toggle no-print">
        <button
          className={`toggle-btn ${!isPhysician ? 'active' : ''}`}
          onClick={() => setViewMode('patient')}
        >
          Your PrEP Conversation Guide
        </button>
        <button
          className={`toggle-btn ${isPhysician ? 'active' : ''}`}
          onClick={() => setViewMode('physician')}
        >
          Your Physician's Guide to You
        </button>
      </div>

      {/* Name & Pronoun Fields - only in physician view */}
      {isPhysician && (
        <div className="summary-identity-fields no-print">
          <div className="identity-field">
            <label htmlFor="patient-name">First Name</label>
            <input
              id="patient-name"
              type="text"
              placeholder="Enter your first name"
              value={patientName}
              onChange={(e) => onPatientNameChange(e.target.value)}
              className="identity-input"
            />
          </div>
          <div className="identity-field">
            <label htmlFor="patient-pronouns">Pronouns</label>
            <select
              id="patient-pronouns"
              value={patientPronouns}
              onChange={(e) => onPatientPronounsChange(e.target.value)}
              className="identity-input"
            >
              <option value="">Select pronouns</option>
              <option value="he/him">he/him</option>
              <option value="she/her">she/her</option>
              <option value="they/them">they/them</option>
              <option value="ze/zir">ze/zir</option>
            </select>
          </div>
        </div>
      )}

      {/* Title */}
      <h1>
        {isPhysician
          ? `Physician's Guide for ${patientName || '[Name]'}`
          : 'Your PrEP Conversation Guide'
        }
      </h1>
      <p className="summary-subtitle">
        {isPhysician
          ? `${patientName || 'This patient'} completed a PrEP options assessment and would like to share these preferences with you.${patientPronouns ? ` Pronouns: ${patientPronouns}.` : ''}`
          : 'Take this summary to your next healthcare visit to help guide your conversation about PrEP.'
        }
      </p>

      {/* 1. Summary - AI generated sentence */}
      {getSummarySentence() && (
        <div className="summary-card">
          <h2>Summary</h2>
          <div className="summary-sentence">
            <p>{getSummarySentence()}</p>
          </div>
        </div>
      )}

      {/* 2. Interested In */}
      {recommendation?.primary && (
        <div className="summary-card">
          <h2>{isPhysician ? `${displayName} is Interested In` : "I'm Interested In"}</h2>
          <div className={`recommendation-card ${recommendation.primary.colorClass}`} style={{ marginBottom: 0 }}>
            <span className="recommendation-label top-match">Top Match</span>
            <h3>{recommendation.primary.name}</h3>
            <p>{recommendation.primary.heading}</p>

            {recommendation.rationale && recommendation.rationale.length > 0 && (
              <>
                <h4 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}>
                  {isPhysician
                    ? `Why this option matched ${p.possessive} preferences:`
                    : 'Why this option matched my preferences:'
                  }
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
                  {isPhysician
                    ? `Topics to discuss with ${displayName}:`
                    : 'Things to discuss with my provider:'
                  }
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

      {/* 3. Also Like to Learn About */}
      {selectedAlternatives && selectedAlternatives.length > 0 && (
        <div className="summary-card">
          <h2>{isPhysician ? `${displayName} Would Also Like to Learn About` : "I'd Also Like to Learn About"}</h2>
          {selectedAlternatives.map((alt, idx) => (
            <div key={idx} className={`recommendation-card ${alt.colorClass}`}>
              <span className="recommendation-label also-consider">Also Consider</span>
              <h3>{alt.name}</h3>
              <p>{alt.heading}</p>
            </div>
          ))}
        </div>
      )}

      {/* 4. Questions - Patient view includes starters, Physician view does not */}
      {isPhysician ? (
        // Physician view: questions only, no conversation starters
        (selectedQuestions.length > 0 || (customQuestions && customQuestions.length > 0)) && (
          <div className="summary-card">
            <h2>Questions {displayName} Wants to Ask</h2>
            <ul className="checklist">
              {selectedQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
              {customQuestions && customQuestions.map((q, i) => (
                <li key={`custom-${i}`}>{q}</li>
              ))}
            </ul>
          </div>
        )
      ) : (
        // Patient view: includes starters and questions
        (selectedQuestions.length > 0 || selectedStarters.length > 0 || (customQuestions && customQuestions.length > 0)) && (
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
            {(selectedQuestions.length > 0 || (customQuestions && customQuestions.length > 0)) && (
              <>
                <h3 className="about-me-group-label" style={{ marginTop: 'var(--space-md)' }}>Questions for my provider</h3>
                <ul className="checklist">
                  {selectedQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                  {customQuestions && customQuestions.map((q, i) => (
                    <li key={`custom-${i}`}>{q}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )
      )}

      {/* 5. Next Steps */}
      <div className="summary-card">
        <h2>{isPhysician ? 'Recommended Next Steps' : 'My Next Steps'}</h2>
        <ul className="checklist">
          {isPhysician ? (
            <>
              <li>Discuss PrEP options based on {displayName}'s preferences and clinical factors</li>
              <li>Order baseline labs: HIV test, STI screening, renal function</li>
              <li>Collaboratively select the PrEP regimen that best fits {p.possessive} needs</li>
            </>
          ) : (
            <>
              <li>Schedule an appointment with my healthcare provider</li>
              <li>Get tested for HIV and STIs before starting PrEP</li>
              <li>Decide together with my provider which PrEP option is right for me</li>
            </>
          )}
        </ul>
      </div>

      {/* My Plan - implementation intention (patient view only) */}
      {!isPhysician && (
        <div className="summary-card my-plan-card">
          <h2>My Plan</h2>
          <p className="my-plan-intro">
            A specific plan makes a next step far more likely to happen. Fill in one small, concrete step.
          </p>
          <div className="my-plan-fields no-print">
            <label className="my-plan-label">
              <span>When will you do it?</span>
              <input
                type="text"
                className="identity-input"
                placeholder="e.g., this Friday afternoon"
                value={plan?.when || ''}
                onChange={(e) => onPlanChange({ ...(plan || {}), when: e.target.value })}
              />
            </label>
            <label className="my-plan-label">
              <span>What will you do?</span>
              <input
                type="text"
                className="identity-input"
                placeholder="e.g., call the clinic to book a PrEP visit"
                value={plan?.action || ''}
                onChange={(e) => onPlanChange({ ...(plan || {}), action: e.target.value })}
              />
            </label>
          </div>
          <p className="my-plan-statement">
            {plan?.when || plan?.action ? (
              <><strong>My plan:</strong> When {plan.when || '__________'}, I will {plan.action || '__________'}.</>
            ) : (
              <span className="my-plan-placeholder">When __________, I will __________.</span>
            )}
          </p>
        </div>
      )}

      {/* 6. About Me / About Patient */}
      <div className="summary-card">
        <h2>{isPhysician ? `About ${displayName}` : 'About Me'}</h2>
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
              <h3 className="about-me-group-label">{isPhysician ? group.physicianLabel : group.label}</h3>
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

      {/* Print & Email Buttons */}
      <div className="print-cta">
        <button onClick={handlePrint} className="btn btn-primary btn-lg">
          Print This Guide
        </button>

        {isPhysician ? (
          <div className="email-cta">
            {!showEmailForm ? (
              <button onClick={() => setShowEmailForm(true)} className="btn btn-secondary btn-lg" style={{ marginTop: 'var(--space-md)' }}>
                Email to My Physician
              </button>
            ) : (
              <div className="email-form">
                <p style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Send this guide to your physician:</p>
                <div className="email-form-row">
                  <input
                    type="email"
                    placeholder="Physician's email address"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="identity-input email-input"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEmail(); }}
                  />
                  <button onClick={handleEmail} className="btn btn-primary" disabled={!emailAddress}>
                    Send
                  </button>
                  <button onClick={() => setShowEmailForm(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="email-cta">
            {!showPatientEmailForm ? (
              <button onClick={() => setShowPatientEmailForm(true)} className="btn btn-secondary btn-lg" style={{ marginTop: 'var(--space-md)' }}>
                Email to Myself
              </button>
            ) : (
              <div className="email-form">
                <p style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Send this guide to your email:</p>
                <div className="email-form-row">
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={patientEmailAddress}
                    onChange={(e) => setPatientEmailAddress(e.target.value)}
                    className="identity-input email-input"
                    onKeyDown={(e) => { if (e.key === 'Enter') handlePatientEmail(); }}
                  />
                  <button onClick={handlePatientEmail} className="btn btn-primary" disabled={!patientEmailAddress}>
                    Send
                  </button>
                  <button onClick={() => setShowPatientEmailForm(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="btn-group" style={{ justifyContent: 'center' }}>
        <Link to="/resources" className="btn btn-secondary">&larr; Back</Link>
        <Link to="/additional-resources" className="btn btn-primary">Additional Resources &rarr;</Link>
      </div>
    </div>
  );
}

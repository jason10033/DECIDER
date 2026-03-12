import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ModalityModule({ content, onVisitModality }) {
  const [openSections, setOpenSections] = useState({});

  // Mark this modality as visited on mount and open first section by default
  useEffect(() => {
    if (content && content.id && onVisitModality) {
      onVisitModality(content.id);
    }
    // Open the first section by default
    if (content && content.sections && content.sections.length > 0) {
      setOpenSections({ [content.sections[0].id]: true });
    }
  }, [content?.id]);

  if (!content) return null;

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderCallout = (callout, index) => {
    const typeClass = callout.type || 'note';
    return (
      <div key={index} className={`callout ${typeClass}`}>
        {callout.title && <div className="callout-title">{callout.title}</div>}
        <p>{callout.text}</p>
      </div>
    );
  };

  return (
    <div className="modality-page">
      {/* Color-coded banner */}
      <div className={`modality-banner ${content.colorClass || ''}`}>
        <h1>{content.title}</h1>
        {content.subtitle && <div className="subtitle">{content.subtitle}</div>}
      </div>

      {/* Key Takeaways */}
      {content.keyTakeaways && content.keyTakeaways.length > 0 && (
        <div className="key-takeaways">
          <h2>Key Takeaways</h2>
          <ul>
            {content.keyTakeaways.map((takeaway, i) => (
              <li key={i}>{takeaway}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Accordion sections */}
      {content.sections && content.sections.map(section => (
        <div key={section.id} className="education-section">
          <h2 onClick={() => toggleSection(section.id)}>
            {section.title}
            <span className={`expand-icon ${openSections[section.id] ? 'open' : ''}`}>
              &#9660;
            </span>
          </h2>
          {openSections[section.id] && (
            <div>
              {section.content && (
                <p className="section-content">{section.content}</p>
              )}
              {section.keyPoints && section.keyPoints.length > 0 && (
                <ul className="key-points">
                  {section.keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              )}
              {section.callouts && section.callouts.map((callout, i) => (
                renderCallout(callout, i)
              ))}
            </div>
          )}
        </div>
      ))}

      {/* FAQ section */}
      {content.faqs && content.faqs.length > 0 && (
        <div className="education-section">
          <h2
            onClick={() => toggleSection('faq')}
            style={{ cursor: 'pointer' }}
          >
            Frequently Asked Questions
            <span className={`expand-icon ${openSections['faq'] ? 'open' : ''}`}>
              &#9660;
            </span>
          </h2>
          {openSections['faq'] && (
            <div>
              {content.faqs.map((faq, i) => (
                <div key={i} style={{ marginBottom: 'var(--space-lg)' }}>
                  <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-sm)' }}>
                    Q: {faq.question}
                  </p>
                  <p className="section-content" style={{ marginBottom: 0 }}>
                    A: {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="btn-group">
        <Link to="/education" className="btn btn-secondary">
          &larr; Back to PrEP Overview
        </Link>
        <Link to="/compare" className="btn btn-primary">
          Continue to Comparison &rarr;
        </Link>
      </div>
    </div>
  );
}

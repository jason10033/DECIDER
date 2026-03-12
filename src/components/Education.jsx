import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import educationContent from '../content/education.json';

const sectionIcons = {
  shield: '\uD83D\uDEE1\uFE0F',
  heart: '\u2764\uFE0F',
  lock: '\uD83D\uDD12',
};

export default function Education({ visitedModalities, onVisitModality }) {
  const [openSections, setOpenSections] = useState({});
  const navigate = useNavigate();

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="education-page">
      <h1>{educationContent.title}</h1>
      <p className="education-intro">{educationContent.intro}</p>

      {/* Accordion Sections */}
      {educationContent.sections.map(section => (
        <div key={section.id} className="education-section">
          <h2 onClick={() => toggleSection(section.id)}>
            <span className={`section-icon ${section.icon}`}>
              {sectionIcons[section.icon] || '\u2139\uFE0F'}
            </span>
            {section.title}
            <span className={`expand-icon ${openSections[section.id] ? 'open' : ''}`}>
              {'\u25BC'}
            </span>
          </h2>
          {openSections[section.id] && (
            <div>
              <p className="section-content">{section.content}</p>
              {section.keyPoints && (
                <ul className="key-points">
                  {section.keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Modality Cards */}
      <h2 style={{ marginTop: 'var(--space-2xl)', marginBottom: 'var(--space-lg)' }}>
        Your PrEP Options
      </h2>
      <div className="modality-cards">
        {educationContent.modalityCards.map(card => {
          const visited = visitedModalities && visitedModalities.includes(card.id);
          return (
            <div key={card.id} className={`modality-card ${card.colorClass}`}>
              <span className={`visited-badge ${visited ? 'visited' : 'not-visited'}`}>
                {visited ? '\u2713 Visited' : 'Not visited'}
              </span>
              <div className="modality-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p className="modality-tagline">{card.tagline}</p>
              <Link to={card.route} className="btn btn-secondary">
                Learn More
              </Link>
            </div>
          );
        })}
      </div>

      <div className="btn-group">
        <Link to="/" className="btn btn-secondary">Back</Link>
        <Link to="/compare" className="btn btn-primary">
          {educationContent.continueText} &rarr;
        </Link>
      </div>
    </div>
  );
}

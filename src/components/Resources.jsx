import { Link } from 'react-router-dom';
import resourcesContent from '../content/resources.json';
import recommendationsContent from '../content/recommendations.json';

export default function Resources() {
  const { title, intro, categories } = resourcesContent;
  const { providerSection } = recommendationsContent;

  return (
    <div className="resources-page">
      <h1>{title}</h1>
      <p className="resources-intro">{intro}</p>

      {/* Questions to Ask Your Provider */}
      <div className="provider-section" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2>Questions to Ask Your Provider</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          Here are some helpful questions to bring up at your next appointment:
        </p>
        <ul className="provider-tips">
          <li>Which PrEP option would you recommend for my situation?</li>
          <li>What tests do I need before starting PrEP?</li>
          <li>How often will I need to come in for follow-up visits?</li>
          <li>Are there programs to help me pay for PrEP?</li>
          <li>What should I know about side effects?</li>
          <li>What happens if I want to switch to a different PrEP option later?</li>
        </ul>
      </div>

      {/* Ways to Start the Conversation */}
      {providerSection && providerSection.tips && (
        <div className="provider-section" style={{ background: 'var(--color-injectable-6mo-light)', marginBottom: 'var(--space-2xl)' }}>
          <h2>{providerSection.heading}</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
            {providerSection.intro}
          </p>
          <ul className="provider-tips">
            {providerSection.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {categories.map((category, idx) => (
        <div key={idx} className="resource-category">
          <h2>{category.title}</h2>
          <div className="resources-list">
            {category.resources.map((resource, i) => (
              <div key={i} className="resource-item">
                <div>
                  <div className="name">{resource.name}</div>
                  <div className="description">{resource.description}</div>
                  {resource.url && (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      Visit Website &rarr;
                    </a>
                  )}
                  {resource.phone && (
                    <a href={`tel:${resource.phone}`}>
                      Call: {resource.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="btn-group">
        <Link to="/recommendations" className="btn btn-secondary">&larr; Back</Link>
        <Link to="/summary" className="btn btn-primary">View Summary &rarr;</Link>
      </div>
    </div>
  );
}

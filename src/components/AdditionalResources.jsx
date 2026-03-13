import { Link } from 'react-router-dom';
import resourcesContent from '../content/resources.json';

// Display categories in specific order: Find Provider, Learn More, Help Paying
const categoryOrder = ['find_provider', 'learn_more', 'paying'];

export default function AdditionalResources() {
  const { categories } = resourcesContent;

  // Sort categories by the desired order
  const orderedCategories = categoryOrder
    .map(id => categories.find(c => c.id === id))
    .filter(Boolean);

  return (
    <div className="resources-page">
      <h1>Additional Resources</h1>
      <p className="resources-intro">
        Here are trusted resources to help you find a provider, learn more about PrEP, and get help paying for your medication. All of these are free to access.
      </p>

      {orderedCategories.map((category, idx) => (
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

      <div className="btn-group" style={{ justifyContent: 'center' }}>
        <Link to="/summary" className="btn btn-secondary">&larr; Back to Summary</Link>
        <Link to="/" className="btn btn-secondary">Start Over</Link>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import resourcesContent from '../content/resources.json';

export default function Resources() {
  const { title, intro, categories } = resourcesContent;

  return (
    <div className="resources-page">
      <h1>{title}</h1>
      <p className="resources-intro">{intro}</p>

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

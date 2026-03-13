import { Link } from 'react-router-dom';
import siteConfig from '../content/site.json';

const { welcome } = siteConfig;

export default function Welcome() {
  return (
    <div className="welcome-page">
      <div className="welcome-badge">{welcome.badge}</div>
      <h1>{welcome.heading}</h1>
      <h2>{welcome.subheading}</h2>
      <p className="welcome-description">{welcome.description}</p>

      <div className="how-it-works">
        <h3>How It Works</h3>
        <div className="steps-grid">
          {welcome.steps.map(step => (
            <div key={step.number} className="step-card">
              <div className="step-number">{step.number}</div>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      <Link to="/education" className="btn btn-primary btn-lg">
        {welcome.ctaText}
      </Link>

      <p className="welcome-disclaimer">{welcome.disclaimer}</p>
    </div>
  );
}

import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import siteConfig from '../content/site.json';

const modules = siteConfig.modules; // [{name, path}, ...]

const routeToStep = {
  '/education': 1,
  '/compare': 2,
  '/assessment': 3,
  '/recommendations': 4,
  '/resources': 5,
  '/summary': 6,
  '/additional-resources': 7,
};

export default function Layout({ children }) {
  const location = useLocation();
  const path = location.pathname;

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  // Determine active step from current route
  const activeStep = routeToStep[path] || null;

  // Don't show progress bar on welcome page or modality deep-dive pages
  const showProgress = path !== '/' && !path.startsWith('/learn/');

  // Calculate fill percentage for the progress track
  const fillPercent = activeStep ? ((activeStep - 1) / (modules.length - 1)) * 100 : 0;

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="header-logo">
            {siteConfig.subtitle} <span>{siteConfig.title}</span>
          </Link>
          <nav className="header-nav">
            <Link to="/chatbot" className="header-about-link">Chatbot pilot</Link>
            <Link to="/about" className="header-about-link">About</Link>
          </nav>
        </div>
        {showProgress && (
          <div className="progress-bar-container">
            <div className="progress-steps">
              <div className="progress-track">
                <div
                  className="progress-track-fill"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              {modules.map((mod, idx) => {
                const stepNum = idx + 1;
                let stepClass = 'progress-step';
                if (activeStep && stepNum < activeStep) stepClass += ' completed';
                else if (stepNum === activeStep) stepClass += ' active';

                return (
                  <div key={mod.name} className={stepClass}>
                    <div className="progress-step-dot">
                      {activeStep && stepNum < activeStep ? '\u2713' : stepNum}
                    </div>
                    <span className="progress-step-label">{mod.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer className="app-footer">
        <p>{siteConfig.footer}</p>
      </footer>
    </>
  );
}

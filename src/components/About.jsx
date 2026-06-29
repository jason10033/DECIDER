import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="about-page">
      <h1>About This Tool</h1>

      <div className="summary-card">
        <h2>What this tool is</h2>
        <p>
          DECIDE is a shared decision-making aid for HIV pre-exposure prophylaxis
          (PrEP). It helps you learn about the PrEP options available today, compare
          them side by side, reflect on what matters most to you, and prepare for a
          conversation with your healthcare provider. It is meant to support that
          conversation, not replace it.
        </p>
      </div>

      <div className="summary-card">
        <h2>The options it covers</h2>
        <ul>
          <li>Daily oral PrEP (tenofovir/emtricitabine)</li>
          <li>On-demand oral PrEP (the 2-1-1 schedule)</li>
          <li>The injection given every 2 months (cabotegravir)</li>
          <li>The injection given every 6 months (lenacapavir)</li>
        </ul>
        <p>
          All of these options are highly effective at preventing HIV. The best one
          is the one you will use consistently and feel comfortable with.
        </p>
      </div>

      <div className="summary-card">
        <h2>How it works</h2>
        <ul>
          <li><strong>Learn</strong> the facts about each option.</li>
          <li><strong>Compare</strong> the options side by side.</li>
          <li><strong>Reflect</strong> by answering a few questions about your preferences and lifestyle.</li>
          <li><strong>Decide</strong> with a personalized summary you can bring to your provider.</li>
        </ul>
        <p>
          Your personalized results are a starting point. They are based on the
          preferences you share, and your provider can help you make the final
          decision together.
        </p>
      </div>

      <div className="summary-card">
        <h2>Your privacy</h2>
        <p>
          This tool does not collect or store any personal health information. Your
          answers are used only during this session to generate your results and are
          not saved or shared. We use privacy-preserving analytics to understand how
          the tool is used in aggregate; this does not identify you.
        </p>
      </div>

      <div className="summary-card">
        <h2>Medical disclaimer</h2>
        <p>
          This tool is for educational purposes only and does not replace medical
          advice from your healthcare provider. Always talk to your provider before
          starting or changing any medication. PrEP options, eligibility, and
          availability can change over time, and not every option is offered at every
          clinic.
        </p>
      </div>

      {/* TODO: Add attribution here (developing organization, contributors,
          funding, version, and clinical references) before publishing. */}

      <div className="btn-group" style={{ justifyContent: 'center' }}>
        <Link to="/" className="btn btn-secondary">&larr; Back to Home</Link>
      </div>
    </div>
  );
}

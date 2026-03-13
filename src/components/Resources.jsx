import { useState } from 'react';
import { Link } from 'react-router-dom';
import resourcesContent from '../content/resources.json';

export default function Resources({
  recommendation, selectedQuestionIds, onToggleQuestion,
  selectedStarterIds, onToggleStarter,
  customQuestions, onAddCustomQuestion, onRemoveCustomQuestion
}) {
  const [customInput, setCustomInput] = useState('');
  const { title, intro, categories } = resourcesContent;

  const dynamicQuestions = recommendation?.dynamicQuestions || [];
  const dynamicStarters = recommendation?.dynamicConversationStarters || [];

  const handleAddQuestion = () => {
    if (customInput.trim()) {
      onAddCustomQuestion?.(customInput);
      setCustomInput('');
    }
  };

  return (
    <div className="resources-page">
      <h1>{title}</h1>
      <p className="resources-intro">{intro}</p>

      {/* Dynamic Questions to Ask Your Provider */}
      {dynamicQuestions.length > 0 && (
        <div className="provider-section" style={{ marginBottom: 'var(--space-2xl)' }}>
          <h2>Questions to Ask Your Provider</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)' }}>
            Based on your results, here are some questions you may want to ask. <strong>Check the ones you'd like to include on your printable summary.</strong>
          </p>
          <div className="selectable-list">
            {dynamicQuestions.map((q, i) => {
              const isSelected = selectedQuestionIds?.includes(i);
              return (
                <label key={i} className={`selectable-item ${isSelected ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isSelected || false}
                    onChange={() => onToggleQuestion?.(i)}
                  />
                  <span>{q}</span>
                </label>
              );
            })}
          </div>

          {/* Custom question input */}
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <p style={{ fontWeight: 600, marginBottom: 'var(--space-sm)', fontSize: 'var(--font-size-sm)' }}>
              Have your own question? Add it here:
            </p>
            <div className="custom-question-input-row">
              <input
                type="text"
                placeholder="Type your question..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddQuestion(); }}
              />
              <button onClick={handleAddQuestion} className="btn btn-primary" disabled={!customInput.trim()}>
                Add
              </button>
            </div>

            {/* Show added custom questions */}
            {customQuestions && customQuestions.length > 0 && (
              <div style={{ marginTop: 'var(--space-sm)' }}>
                {customQuestions.map((q, i) => (
                  <div key={i} className="custom-question-tag">
                    <span>{q}</span>
                    <button
                      className="custom-question-remove"
                      onClick={() => onRemoveCustomQuestion?.(i)}
                      title="Remove question"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Conversation Starters */}
      {dynamicStarters.length > 0 && (
        <div className="provider-section" style={{ background: 'var(--color-injectable-6mo-light)', marginBottom: 'var(--space-2xl)' }}>
          <h2>Ways to Start the Conversation</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)' }}>
            Not sure how to bring up PrEP? <strong>Check any conversation starters you'd like on your summary.</strong>
          </p>
          <div className="selectable-list">
            {dynamicStarters.map((tip, i) => {
              const isSelected = selectedStarterIds?.includes(i);
              return (
                <label key={i} className={`selectable-item ${isSelected ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isSelected || false}
                    onChange={() => onToggleStarter?.(i)}
                  />
                  <span>{tip}</span>
                </label>
              );
            })}
          </div>
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

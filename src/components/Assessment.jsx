import { Link } from 'react-router-dom';

export default function Assessment({ content, responses, onAnswer, onToggleMulti, nextPath, backPath }) {
  if (!content) return null;

  const { title, description, reassurance, questions } = content;

  // Filter questions based on conditional logic
  const visibleQuestions = questions.filter(q => {
    // prep_06 (pregnancy) only shows if sex assigned at birth is female
    if (q.id === 'prep_06') {
      return responses.prep_00 === 'female';
    }
    return true;
  });

  const allAnswered = visibleQuestions.every(q => {
    const answer = responses[q.id];
    if (q.type === 'multi_choice') return answer && answer.length > 0;
    return answer !== undefined && answer !== null;
  });

  const renderQuestion = (question, index) => {
    const isMulti = question.type === 'multi_choice';
    const currentAnswer = responses[question.id];

    return (
      <div key={question.id} className="question-card">
        <div className="question-number">Question {index + 1} of {visibleQuestions.length}</div>
        <div className="question-text">{question.text}</div>
        <div className="options-list">
          {question.options.map(option => {
            let isSelected = false;
            if (isMulti) {
              isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(option.value);
            } else {
              isSelected = currentAnswer === option.value;
            }

            return (
              <label
                key={option.value}
                className={`option-label ${isSelected ? 'selected' : ''}`}
              >
                <input
                  type={isMulti ? 'checkbox' : 'radio'}
                  name={question.id}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => {
                    if (isMulti) {
                      onToggleMulti(question.id, option.value);
                    } else {
                      onAnswer(question.id, option.value);
                    }
                  }}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="assessment-page">
      <h1>{title}</h1>
      <p className="assessment-description">{description}</p>
      {reassurance && <p className="assessment-reassurance">{reassurance}</p>}

      {visibleQuestions.map((q, i) => renderQuestion(q, i))}

      <div className="btn-group">
        <Link to={backPath || '/compare'} className="btn btn-secondary">&larr; Back</Link>
        <Link
          to={nextPath || '/recommendations'}
          className={`btn btn-primary ${!allAnswered ? '' : ''}`}
          onClick={(e) => {
            if (!allAnswered) {
              e.preventDefault();
            }
          }}
          style={!allAnswered ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          See What Fits &rarr;
        </Link>
      </div>
    </div>
  );
}

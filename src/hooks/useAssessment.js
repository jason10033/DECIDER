import { useState } from 'react';

export default function useAssessment() {
  const [responses, setResponses] = useState({});

  const setAnswer = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const toggleMultiAnswer = (questionId, value) => {
    setResponses(prev => {
      const current = prev[questionId] || [];
      // Exclusive options: selecting "none" or "prefer_not" clears others
      if (value === 'none' || value === 'prefer_not') {
        return { ...prev, [questionId]: [value] };
      }
      // Remove exclusive options when selecting something else
      const filtered = current.filter(v => v !== 'none' && v !== 'prefer_not');
      if (filtered.includes(value)) {
        return { ...prev, [questionId]: filtered.filter(v => v !== value) };
      }
      return { ...prev, [questionId]: [...filtered, value] };
    });
  };

  const getAnswer = (id) => responses[id];

  const isComplete = (questions) => {
    // Filter to only visible questions (e.g., pregnancy question only for female)
    const visibleQuestions = questions.filter(q => {
      if (q.id === 'prep_06') return responses.prep_00 === 'female';
      return true;
    });
    return visibleQuestions.every(q => {
      const answer = responses[q.id];
      if (q.type === 'multi_choice') return answer && answer.length > 0;
      return answer !== undefined && answer !== null;
    });
  };

  const reset = () => setResponses({});

  return { responses, setAnswer, toggleMultiAnswer, getAnswer, isComplete, reset };
}

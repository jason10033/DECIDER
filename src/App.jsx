import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import Layout from './components/Layout';
import Welcome from './components/Welcome';
import Education from './components/Education';
import ModalityModule from './components/ModalityModule';
import Comparison from './components/Comparison';
import Assessment from './components/Assessment';
import Recommendations from './components/Recommendations';
import Resources from './components/Resources';
import Summary from './components/Summary';
import useAssessment from './hooks/useAssessment';
import { generateRecommendation } from './services/recommendations';
import qualtricsService from './services/qualtrics';
import assessmentContent from './content/assessment.json';
import oralContent from './content/modality-oral.json';
import injectable2moContent from './content/modality-injectable-2mo.json';
import injectable6moContent from './content/modality-injectable-6mo.json';
import onDemandContent from './content/modality-on-demand.json';

export default function App() {
  const { responses, setAnswer, toggleMultiAnswer, getAnswer, isComplete, reset } = useAssessment();
  const [visitedModalities, setVisitedModalities] = useState([]);
  const [selectedAlternativeIds, setSelectedAlternativeIds] = useState([]);
  const navigate = useNavigate();

  const handleVisitModality = (modalityId) => {
    setVisitedModalities(prev => {
      if (prev.includes(modalityId)) return prev;
      return [...prev, modalityId];
    });
  };

  const handleToggleAlternative = (altId) => {
    setSelectedAlternativeIds(prev => {
      if (prev.includes(altId)) {
        return prev.filter(id => id !== altId);
      }
      return [...prev, altId];
    });
  };

  // Generate recommendation from assessment responses
  const recommendation = useMemo(() => {
    if (!assessmentContent?.questions) return null;
    if (!isComplete(assessmentContent.questions)) return null;
    return generateRecommendation(responses);
  }, [responses]);

  // Resolve selected alternative objects from IDs
  const selectedAlternatives = useMemo(() => {
    if (!recommendation?.alternatives) return [];
    return recommendation.alternatives.filter(alt => selectedAlternativeIds.includes(alt.id));
  }, [recommendation, selectedAlternativeIds]);

  // Handle assessment completion - submit to Qualtrics
  const handleContinueToResults = () => {
    if (assessmentContent?.questions && isComplete(assessmentContent.questions)) {
      try {
        qualtricsService.submit(responses);
      } catch (e) {
        // Silently handle submission errors - don't block the user
        console.warn('Qualtrics submission error:', e);
      }
    }
    navigate('/recommendations');
  };

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Welcome />} />

        <Route
          path="/education"
          element={
            <Education
              visitedModalities={visitedModalities}
              onVisitModality={handleVisitModality}
            />
          }
        />

        <Route
          path="/learn/oral-prep"
          element={
            <ModalityModule
              content={oralContent}
              onVisitModality={handleVisitModality}
            />
          }
        />
        <Route
          path="/learn/on-demand"
          element={
            <ModalityModule
              content={onDemandContent}
              onVisitModality={handleVisitModality}
            />
          }
        />
        <Route
          path="/learn/injectable-2mo"
          element={
            <ModalityModule
              content={injectable2moContent}
              onVisitModality={handleVisitModality}
            />
          }
        />
        <Route
          path="/learn/injectable-6mo"
          element={
            <ModalityModule
              content={injectable6moContent}
              onVisitModality={handleVisitModality}
            />
          }
        />

        <Route path="/compare" element={<Comparison />} />

        <Route
          path="/assessment"
          element={
            <Assessment
              content={assessmentContent}
              responses={responses}
              onAnswer={setAnswer}
              onToggleMulti={toggleMultiAnswer}
              nextPath="/recommendations"
              backPath="/compare"
            />
          }
        />

        <Route
          path="/recommendations"
          element={
            <Recommendations
              recommendation={recommendation}
              assessmentResponses={responses}
              selectedAlternativeIds={selectedAlternativeIds}
              onToggleAlternative={handleToggleAlternative}
            />
          }
        />

        <Route path="/resources" element={<Resources />} />

        <Route
          path="/summary"
          element={
            <Summary
              recommendation={recommendation}
              assessmentResponses={responses}
              assessmentContent={assessmentContent}
              selectedAlternatives={selectedAlternatives}
            />
          }
        />
      </Routes>
    </Layout>
  );
}

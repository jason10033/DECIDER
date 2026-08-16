import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { capturePageview, captureEvent } from './services/analytics';
import Layout from './components/Layout';
import Welcome from './components/Welcome';
import Education from './components/Education';
import ModalityModule from './components/ModalityModule';
import Comparison from './components/Comparison';
import Assessment from './components/Assessment';
import Recommendations from './components/Recommendations';
import Resources from './components/Resources';
import Summary from './components/Summary';
import About from './components/About';
import AdditionalResources from './components/AdditionalResources';
import Chatbot from './components/Chatbot';
import useAssessment from './hooks/useAssessment';
import { generateRecommendation } from './services/recommendations';
import qualtricsService from './services/qualtrics';
import assessmentContent from './content/assessment.json';
import oralContent from './content/modality-oral.json';
import injectable2moContent from './content/modality-injectable-2mo.json';
import injectable6moContent from './content/modality-injectable-6mo.json';
import onDemandContent from './content/modality-on-demand.json';

export default function App() {
  const { responses, setAnswer, toggleMultiAnswer, getAnswer, isComplete, reset, setAll } = useAssessment();
  const [visitedModalities, setVisitedModalities] = useState([]);
  const [selectedAlternativeIds, setSelectedAlternativeIds] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [selectedStarterIds, setSelectedStarterIds] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [patientPronouns, setPatientPronouns] = useState('');
  const [customQuestions, setCustomQuestions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Capture a pageview on each route change (HashRouter).
  useEffect(() => {
    capturePageview(location.pathname);
  }, [location.pathname]);

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

  const handleToggleQuestion = (idx) => {
    setSelectedQuestionIds(prev => {
      if (prev.includes(idx)) return prev.filter(id => id !== idx);
      return [...prev, idx];
    });
  };

  const handleToggleStarter = (idx) => {
    setSelectedStarterIds(prev => {
      if (prev.includes(idx)) return prev.filter(id => id !== idx);
      return [...prev, idx];
    });
  };

  const handleAddCustomQuestion = (question) => {
    if (question.trim()) {
      setCustomQuestions(prev => [...prev, question.trim()]);
    }
  };

  const handleRemoveCustomQuestion = (idx) => {
    setCustomQuestions(prev => prev.filter((_, i) => i !== idx));
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
    return recommendation.alternatives.filter(alt => selectedAlternativeIds.includes(alt.id) && !alt.notRecommended);
  }, [recommendation, selectedAlternativeIds]);

  // Chatbot handoff: adopt the conversation-derived responses and route into the
  // same results/summary flow the assessment uses.
  const handleChatComplete = (chatResponses) => {
    setAll(chatResponses);
    try {
      captureEvent('chatbot_completed', { ...chatResponses, source: 'chatbot' });
    } catch (e) {
      console.warn('Analytics error:', e);
    }
    try {
      qualtricsService.submit(chatResponses);
    } catch (e) {
      console.warn('Qualtrics submission error:', e);
    }
    navigate('/recommendations');
  };

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

        <Route path="/resources" element={
          <Resources
            recommendation={recommendation}
            selectedQuestionIds={selectedQuestionIds}
            onToggleQuestion={handleToggleQuestion}
            selectedStarterIds={selectedStarterIds}
            onToggleStarter={handleToggleStarter}
            customQuestions={customQuestions}
            onAddCustomQuestion={handleAddCustomQuestion}
            onRemoveCustomQuestion={handleRemoveCustomQuestion}
          />
        } />

        <Route
          path="/summary"
          element={
            <Summary
              recommendation={recommendation}
              assessmentResponses={responses}
              assessmentContent={assessmentContent}
              selectedAlternatives={selectedAlternatives}
              selectedQuestionIds={selectedQuestionIds}
              selectedStarterIds={selectedStarterIds}
              customQuestions={customQuestions}
              patientName={patientName}
              onPatientNameChange={setPatientName}
              patientPronouns={patientPronouns}
              onPatientPronounsChange={setPatientPronouns}
            />
          }
        />
        <Route path="/additional-resources" element={<AdditionalResources />} />
        <Route path="/chatbot" element={<Chatbot onComplete={handleChatComplete} />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  );
}

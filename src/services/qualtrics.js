const MODE = import.meta.env.VITE_QUALTRICS_MODE || 'mock';

const mockService = {
  async submitAssessment(data) {
    const records = JSON.parse(localStorage.getItem('decider_records') || '[]');
    const recordId = `DECIDER_${Date.now().toString(36).toUpperCase()}`;
    const record = {
      record_id: recordId,
      timestamp: new Date().toISOString(),
      ...data
    };
    records.push(record);
    localStorage.setItem('decider_records', JSON.stringify(records));
    console.log('[Qualtrics Mock] Saved record:', recordId, record);
    return { success: true, record_id: recordId };
  },

  async getRecord(recordId) {
    const records = JSON.parse(localStorage.getItem('decider_records') || '[]');
    return records.find(r => r.record_id === recordId) || null;
  },

  async getAllRecords() {
    return JSON.parse(localStorage.getItem('decider_records') || '[]');
  }
};

const liveService = {
  async submitAssessment(data) {
    try {
      const response = await fetch('/.netlify/functions/qualtrics-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', data })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[Qualtrics] Submit error:', error);
      throw error;
    }
  },

  async getRecord(recordId) {
    try {
      const response = await fetch('/.netlify/functions/qualtrics-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', record_id: recordId })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[Qualtrics] Get error:', error);
      throw error;
    }
  }
};

const qualtricsService = MODE === 'live' ? liveService : mockService;
export default qualtricsService;

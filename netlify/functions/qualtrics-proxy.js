export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { QUALTRICS_API_TOKEN, QUALTRICS_SURVEY_ID, QUALTRICS_DATACENTER } = process.env;

  if (!QUALTRICS_API_TOKEN || !QUALTRICS_SURVEY_ID || !QUALTRICS_DATACENTER) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Qualtrics not configured' }) };
  }

  try {
    const { action, data, record_id } = JSON.parse(event.body);
    const baseUrl = `https://${QUALTRICS_DATACENTER}.qualtrics.com/API/v3`;

    if (action === 'submit') {
      // Create a response in Qualtrics using the Response Import API
      const response = await fetch(`${baseUrl}/surveys/${QUALTRICS_SURVEY_ID}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-TOKEN': QUALTRICS_API_TOKEN
        },
        body: JSON.stringify({
          values: {
            ...data,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            status: 1, // Complete
            distributionChannel: 'anonymous'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Qualtrics API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, responseId: result.result?.responseId })
      };
    }

    if (action === 'get') {
      const response = await fetch(`${baseUrl}/surveys/${QUALTRICS_SURVEY_ID}/responses/${record_id}`, {
        headers: { 'X-API-TOKEN': QUALTRICS_API_TOKEN }
      });

      if (!response.ok) throw new Error(`Qualtrics API error: ${response.status}`);
      const result = await response.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.result)
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
  } catch (error) {
    console.error('Qualtrics proxy error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}

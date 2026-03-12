import recommendationTemplates from '../content/recommendations.json';

export function generateRecommendation(responses) {
  // Score each option based on responses
  const scores = { oral: 0, injectable_2mo: 0, injectable_6mo: 0 };

  // prep_01: Prior PrEP experience
  // If they used oral before, they might want to try something new
  if (responses.prep_01 === 'yes_oral') {
    scores.injectable_2mo += 1;
    scores.injectable_6mo += 1;
  }
  // If they used injectable, they know they're OK with needles
  if (responses.prep_01 === 'yes_injectable') {
    scores.injectable_2mo += 1;
    scores.injectable_6mo += 2;
  }

  // prep_02: Dosing preference
  if (responses.prep_02 === 'daily_pill') {
    scores.oral += 3;
  } else if (responses.prep_02 === 'periodic_injection') {
    scores.injectable_2mo += 2;
    scores.injectable_6mo += 3;
  }
  // 'no_preference' gives no points

  // prep_03: Needle comfort
  if (responses.prep_03 === 'very_comfortable' || responses.prep_03 === 'comfortable') {
    scores.injectable_2mo += 2;
    scores.injectable_6mo += 2;
  } else if (responses.prep_03 === 'uncomfortable') {
    scores.oral += 2;
    scores.injectable_6mo += 1; // less frequent = less needle exposure
  } else if (responses.prep_03 === 'very_uncomfortable') {
    scores.oral += 4;
  }

  // prep_04: Clinic visit frequency comfort
  if (responses.prep_04 === 'every_few_months') {
    scores.injectable_2mo += 2;
  } else if (responses.prep_04 === 'twice_year') {
    scores.injectable_6mo += 3;
  } else if (responses.prep_04 === 'as_few_as_possible') {
    scores.injectable_6mo += 3;
    scores.oral += 1; // oral needs less frequent visits than 2mo
  }

  // prep_05: Privacy importance
  if (responses.prep_05 === 'very_important') {
    scores.injectable_2mo += 2;
    scores.injectable_6mo += 3;
    // Injectables = no pills at home to be seen
  } else if (responses.prep_05 === 'somewhat_important') {
    scores.injectable_2mo += 1;
    scores.injectable_6mo += 1;
  }

  // prep_06: Pregnancy plans — CRITICAL
  if (responses.prep_06 === 'yes' || responses.prep_06 === 'maybe') {
    scores.oral += 5; // Only oral PrEP (Truvada specifically) recommended for pregnancy
    scores.injectable_2mo -= 2;
    scores.injectable_6mo -= 2;
  }

  // prep_07: Taking other medications
  if (responses.prep_07 === 'yes') {
    // Drug interactions are a bigger concern for lenacapavir
    scores.oral += 1;
    scores.injectable_2mo += 1;
    scores.injectable_6mo -= 1;
  }

  // prep_08: Concerns (multi-choice)
  const concerns = responses.prep_08 || [];
  if (concerns.includes('remembering')) {
    scores.injectable_2mo += 2;
    scores.injectable_6mo += 3;
  }
  if (concerns.includes('needles')) {
    scores.oral += 3;
  }
  if (concerns.includes('privacy')) {
    scores.injectable_2mo += 1;
    scores.injectable_6mo += 2;
  }
  if (concerns.includes('cost')) {
    scores.oral += 1; // more established, more coverage options
  }

  // prep_09: Top priority
  if (responses.prep_09 === 'convenience') {
    scores.injectable_6mo += 3;
  } else if (responses.prep_09 === 'most_effective') {
    scores.injectable_2mo += 2;
    scores.injectable_6mo += 2;
  } else if (responses.prep_09 === 'most_private') {
    scores.injectable_6mo += 3;
  } else if (responses.prep_09 === 'easiest_to_stop') {
    scores.oral += 3;
  } else if (responses.prep_09 === 'fewest_visits') {
    scores.injectable_6mo += 3;
    scores.oral += 1;
  }

  // prep_10: Insurance
  if (responses.prep_10 === 'no_insurance') {
    scores.oral += 1; // Ready Set PrEP is well-established
  }

  // Determine primary and alternatives
  const sorted = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .map(([id]) => id);

  const primaryId = sorted[0];
  const alternativeIds = sorted.slice(1);

  const templates = recommendationTemplates.options;

  // Build dynamic reasons based on responses
  const primary = {
    id: primaryId,
    ...templates[primaryId],
    colorClass: primaryId === 'oral' ? 'oral' : primaryId === 'injectable_2mo' ? 'injectable-2mo' : 'injectable-6mo'
  };

  const alternatives = alternativeIds.map(id => ({
    id,
    ...templates[id],
    colorClass: id === 'oral' ? 'oral' : id === 'injectable_2mo' ? 'injectable-2mo' : 'injectable-6mo'
  }));

  // Special case: pregnancy override
  if (responses.prep_06 === 'yes') {
    primary.specialNote = 'Because you are planning a pregnancy, oral PrEP (Truvada) is currently the recommended option. Talk to your provider about the best timing.';
  }

  return {
    primary,
    alternatives,
    providerTips: recommendationTemplates.providerSection.tips,
    providerHeading: recommendationTemplates.providerSection.heading
  };
}

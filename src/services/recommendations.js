import recommendationTemplates from '../content/recommendations.json';

const colorClassMap = {
  oral: 'oral',
  on_demand: 'on-demand',
  injectable_2mo: 'injectable-2mo',
  injectable_6mo: 'injectable-6mo'
};

export function generateRecommendation(responses) {
  // Score each option based on responses
  const scores = { oral: 0, on_demand: 0, injectable_2mo: 0, injectable_6mo: 0 };

  // prep_01: Prior PrEP experience
  if (responses.prep_01 === 'yes_oral') {
    scores.injectable_2mo += 1;
    scores.injectable_6mo += 1;
    scores.on_demand += 1; // might want a different oral approach
  }
  if (responses.prep_01 === 'yes_injectable') {
    scores.injectable_2mo += 1;
    scores.injectable_6mo += 2;
  }

  // prep_02: Dosing preference
  if (responses.prep_02 === 'daily_pill') {
    scores.oral += 3;
  } else if (responses.prep_02 === 'injection') {
    scores.injectable_2mo += 2;
    scores.injectable_6mo += 3;
  }
  // 'no_preference' gives no points

  // prep_03: Needle comfort
  if (responses.prep_03 === 'fine' || responses.prep_03 === 'tolerable') {
    scores.injectable_2mo += 2;
    scores.injectable_6mo += 2;
  } else if (responses.prep_03 === 'prefer_avoid') {
    scores.oral += 2;
    scores.on_demand += 2;
    scores.injectable_6mo += 1; // less frequent = less needle exposure
  } else if (responses.prep_03 === 'no_way') {
    scores.oral += 4;
    scores.on_demand += 4;
  }

  // prep_04: Clinic visit frequency comfort
  if (responses.prep_04 === 'every_2mo') {
    scores.injectable_2mo += 2;
  } else if (responses.prep_04 === 'every_3mo') {
    scores.oral += 1;
    scores.on_demand += 1;
  } else if (responses.prep_04 === 'every_6mo') {
    scores.injectable_6mo += 3;
    scores.oral += 1;
    scores.on_demand += 1;
  }

  // prep_05: Privacy importance
  if (responses.prep_05 === 'very_important') {
    scores.injectable_2mo += 2;
    scores.injectable_6mo += 3;
    scores.on_demand += 1; // fewer pills than daily
  } else if (responses.prep_05 === 'somewhat') {
    scores.injectable_2mo += 1;
    scores.injectable_6mo += 1;
  }

  // prep_06: Pregnancy plans - CRITICAL
  if (responses.prep_06 === 'yes' || responses.prep_06 === 'not_sure') {
    scores.oral += 5;
    scores.on_demand -= 3; // on-demand not studied for this population
    scores.injectable_2mo -= 2;
    scores.injectable_6mo -= 2;
  }

  // prep_07: Taking other medications
  if (responses.prep_07 === 'yes_prescription' || responses.prep_07 === 'yes_both') {
    scores.oral += 1;
    scores.on_demand += 1;
    scores.injectable_2mo += 1;
    scores.injectable_6mo -= 1; // more drug interaction concerns
  }
  if (responses.prep_07 === 'yes_supplements' || responses.prep_07 === 'yes_both') {
    scores.injectable_6mo -= 1; // St. John's wort concern
  }

  // prep_08: Concerns (multi-choice)
  const concerns = responses.prep_08 || [];
  if (concerns.includes('remembering')) {
    scores.injectable_2mo += 2;
    scores.injectable_6mo += 3;
    scores.on_demand += 1; // still need to remember around sex
  }
  if (concerns.includes('needles')) {
    scores.oral += 3;
    scores.on_demand += 3;
  }
  if (concerns.includes('privacy')) {
    scores.injectable_2mo += 1;
    scores.injectable_6mo += 2;
  }
  if (concerns.includes('cost')) {
    scores.oral += 1;
    scores.on_demand += 2; // uses fewer pills
  }
  if (concerns.includes('side_effects')) {
    scores.on_demand += 1; // less medication exposure
  }

  // prep_09: Top priority
  if (responses.prep_09 === 'convenience') {
    scores.injectable_6mo += 3;
    scores.on_demand += 1;
  } else if (responses.prep_09 === 'most_effective') {
    scores.injectable_2mo += 2;
    scores.injectable_6mo += 2;
    scores.oral += 1;
  } else if (responses.prep_09 === 'most_private') {
    scores.injectable_6mo += 3;
  } else if (responses.prep_09 === 'easiest_to_stop') {
    scores.oral += 3;
    scores.on_demand += 3;
  } else if (responses.prep_09 === 'fewest_visits') {
    scores.injectable_6mo += 3;
    scores.oral += 1;
    scores.on_demand += 1;
  } else if (responses.prep_09 === 'lowest_cost') {
    scores.on_demand += 2;
    scores.oral += 1;
  }

  // prep_10: Insurance
  if (responses.prep_10 === 'no_insurance') {
    scores.oral += 1;
    scores.on_demand += 1;
  }

  // Determine primary and alternatives
  const sorted = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .map(([id]) => id);

  const primaryId = sorted[0];
  const alternativeIds = sorted.slice(1);

  const templates = recommendationTemplates.options;

  // Build recommendation with dynamic rationale
  const primary = {
    id: primaryId,
    ...templates[primaryId],
    colorClass: colorClassMap[primaryId] || primaryId,
    score: scores[primaryId],
    allScores: { ...scores }
  };

  const alternatives = alternativeIds.map(id => ({
    id,
    ...templates[id],
    colorClass: colorClassMap[id] || id,
    score: scores[id]
  }));

  // Special case: pregnancy override
  if (responses.prep_06 === 'yes') {
    primary.specialNote = 'Because you are planning a pregnancy, oral PrEP (Truvada) is currently the recommended option. Talk to your provider about the best timing.';
  }

  // Generate personalized rationale based on responses
  const rationale = generateRationale(primaryId, responses);

  return {
    primary,
    alternatives,
    rationale,
    providerTips: recommendationTemplates.providerSection.tips,
    providerHeading: recommendationTemplates.providerSection.heading
  };
}

function generateRationale(primaryId, responses) {
  const reasons = [];

  if (primaryId === 'oral') {
    if (responses.prep_03 === 'prefer_avoid' || responses.prep_03 === 'no_way') {
      reasons.push('You prefer to avoid injections, and this option is a pill you take at home.');
    }
    if (responses.prep_02 === 'daily_pill') {
      reasons.push('You indicated you prefer taking a daily pill.');
    }
    if (responses.prep_09 === 'easiest_to_stop') {
      reasons.push('This option is the easiest to start and stop, which was important to you.');
    }
    if (responses.prep_06 === 'yes' || responses.prep_06 === 'not_sure') {
      reasons.push('For pregnancy planning, oral PrEP (Truvada) is the recommended choice.');
    }
  }

  if (primaryId === 'on_demand') {
    reasons.push('You only take pills when you need them, which means less medication overall.');
    if (responses.prep_03 === 'prefer_avoid' || responses.prep_03 === 'no_way') {
      reasons.push('No injections are required with this option.');
    }
    if (responses.prep_09 === 'easiest_to_stop') {
      reasons.push('This option is easy to start and stop whenever your needs change.');
    }
    if (responses.prep_09 === 'lowest_cost') {
      reasons.push('Using fewer pills can help lower your medication costs.');
    }
  }

  if (primaryId === 'injectable_2mo') {
    if (responses.prep_02 === 'injection') {
      reasons.push('You prefer an injection so you don\'t have to think about prevention daily.');
    }
    if (responses.prep_05 === 'very_important') {
      reasons.push('Privacy was important to you, and with injections there are no pills at home to be seen.');
    }
    if (responses.prep_09 === 'most_effective') {
      reasons.push('This option was shown to be even more effective than daily pills in clinical studies.');
    }
    if (concerns(responses).includes('remembering')) {
      reasons.push('You were concerned about remembering daily doses, and this option removes that worry.');
    }
  }

  if (primaryId === 'injectable_6mo') {
    if (responses.prep_04 === 'every_6mo') {
      reasons.push('You preferred the fewest clinic visits possible, and this option requires just two per year.');
    }
    if (responses.prep_09 === 'convenience') {
      reasons.push('Convenience was your top priority, and this is the most hands-off PrEP option.');
    }
    if (responses.prep_05 === 'very_important') {
      reasons.push('Privacy was very important to you, and with this option there are no pills at home.');
    }
    if (responses.prep_09 === 'fewest_visits') {
      reasons.push('You wanted the fewest clinic visits, and this option only requires visits every 6 months.');
    }
  }

  if (reasons.length === 0) {
    reasons.push('Based on the combination of your preferences and priorities, this option aligns best with what you shared.');
  }

  return reasons;
}

function concerns(responses) {
  return responses.prep_08 || [];
}

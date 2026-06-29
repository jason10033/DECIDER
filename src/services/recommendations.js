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

  // prep_00: Sex assigned at birth - CRITICAL for on-demand eligibility
  // On-demand PrEP (2-1-1) is only recommended for persons assigned male at birth
  if (responses.prep_00 === 'female') {
    scores.on_demand -= 10; // effectively disqualify on-demand
  } else if (responses.prep_00 === 'intersex' || responses.prep_00 === 'prefer_not_say') {
    scores.on_demand -= 5; // strongly discourage but don't fully disqualify
  }

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

  const alternatives = alternativeIds.map(id => {
    const cautionReason = getCautionReason(id, responses);
    return {
      id,
      ...templates[id],
      colorClass: colorClassMap[id] || id,
      score: scores[id],
      notRecommended: !!cautionReason,
      cautionReason
    };
  });

  // Special case: pregnancy override
  if (responses.prep_06 === 'yes') {
    primary.specialNote = 'Because you are planning a pregnancy, oral PrEP (tenofovir/emtricitabine) is currently the recommended option. Talk to your provider about the best timing.';
  }

  // Generate personalized rationale based on responses
  const rationale = generateRationale(primaryId, responses);

  // Generate a plain-language summary sentence
  const summarySentence = generateSummarySentence(primaryId, responses, templates[primaryId]?.name);

  // Generate dynamic provider questions and conversation starters based on results
  const dynamicQuestions = generateDynamicProviderQuestions(primaryId, responses);
  const dynamicConversationStarters = generateDynamicConversationStarters(primaryId, responses);

  return {
    primary,
    alternatives,
    rationale,
    summarySentence,
    dynamicQuestions,
    dynamicConversationStarters
  };
}

function generateSummarySentence(primaryId, responses, primaryName) {
  const factors = [];
  const isOralType = primaryId === 'oral' || primaryId === 'on_demand';
  const isInjectable = primaryId === 'injectable_2mo' || primaryId === 'injectable_6mo';

  // Only include factors that actually SUPPORT the chosen option
  // Dosing preference - only if it matches the result
  if (responses.prep_02 === 'daily_pill' && primaryId === 'oral') {
    factors.push('your preference for a daily pill');
  } else if (responses.prep_02 === 'injection' && isInjectable) {
    factors.push('your preference for injections over daily pills');
  }

  // Needle comfort - only if congruent with result
  if ((responses.prep_03 === 'no_way' || responses.prep_03 === 'prefer_avoid') && isOralType) {
    factors.push('your preference to avoid needles');
  } else if ((responses.prep_03 === 'fine' || responses.prep_03 === 'tolerable') && isInjectable) {
    factors.push('your comfort with injections');
  }

  // Privacy - relevant for injectables (no pills at home)
  if (responses.prep_05 === 'very_important' && isInjectable) {
    factors.push('the importance of privacy to you');
  }

  // Pregnancy - relevant for oral
  if (responses.prep_06 === 'yes' && primaryId === 'oral') {
    factors.push('your pregnancy plans');
  }

  // Top priority - only if it aligns with the result
  if (responses.prep_09 === 'convenience' && primaryId === 'injectable_6mo') {
    factors.push('your priority for convenience');
  } else if (responses.prep_09 === 'most_effective' && isInjectable) {
    factors.push('your priority for effectiveness');
  } else if (responses.prep_09 === 'easiest_to_stop' && isOralType) {
    factors.push('your desire for flexibility to stop easily');
  } else if (responses.prep_09 === 'fewest_visits' && (primaryId === 'injectable_6mo' || isOralType)) {
    factors.push('your preference for fewer clinic visits');
  } else if (responses.prep_09 === 'lowest_cost' && isOralType) {
    factors.push('your focus on keeping costs low');
  } else if (responses.prep_09 === 'most_private' && isInjectable) {
    factors.push('your priority for privacy');
  }

  // Visit frequency - only if it matches
  if (responses.prep_04 === 'every_6mo' && primaryId === 'injectable_6mo') {
    factors.push('your preference for infrequent appointments');
  }

  // Concerns - only if relevant to the result
  const userConcerns = responses.prep_08 || [];
  if (userConcerns.includes('remembering') && isInjectable) {
    factors.push('your concern about remembering daily doses');
  }
  if (userConcerns.includes('needles') && isOralType) {
    factors.push('your concern about needles');
  }

  // Build the sentence
  if (factors.length === 0) {
    return `Based on your overall preferences, ${primaryName} was the closest match to what matters most to you. Discuss this option with your provider to see if it's right for your situation.`;
  }

  const factorText = factors.length === 1
    ? factors[0]
    : factors.slice(0, -1).join(', ') + ' and ' + factors[factors.length - 1];

  return `Based on ${factorText}, ${primaryName} was the closest match to what matters most to you. This is a starting point for your conversation with your provider, who can help you make the final decision together.`;
}

// Flag alternatives that a hard clinical rule rules out for this patient,
// returning a plain-language reason (or null if the option is appropriate).
function getCautionReason(id, responses) {
  const reasons = [];
  const planningPregnancy = responses.prep_06 === 'yes' || responses.prep_06 === 'not_sure';

  if (id === 'on_demand') {
    if (responses.prep_00 === 'female') {
      reasons.push('On-demand (2-1-1) PrEP is currently studied and recommended only for cisgender men who have sex with men.');
    } else if (responses.prep_00 === 'intersex' || responses.prep_00 === 'prefer_not_say') {
      reasons.push('On-demand (2-1-1) PrEP is currently studied only for cisgender men who have sex with men. Ask your provider whether it applies to you.');
    }
    if (planningPregnancy) {
      reasons.push('On-demand PrEP has not been studied for people who are pregnant or planning a pregnancy.');
    }
  }

  if ((id === 'injectable_2mo' || id === 'injectable_6mo') && planningPregnancy) {
    const drug = id === 'injectable_2mo' ? 'cabotegravir' : 'lenacapavir';
    reasons.push(`There is limited safety data for ${drug} during pregnancy or pregnancy planning, so oral PrEP is the recommended choice.`);
  }

  return reasons.length ? reasons.join(' ') : null;
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
      reasons.push('For pregnancy planning, oral PrEP (tenofovir/emtricitabine) is the recommended choice.');
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

function generateDynamicProviderQuestions(primaryId, responses) {
  const questions = [];

  // Questions based on the primary recommendation
  if (primaryId === 'oral') {
    questions.push('Which oral PrEP medication - Truvada or Descovy - would you recommend for me?');
    questions.push('What should I do if I miss a dose?');
  }
  if (primaryId === 'on_demand') {
    questions.push('Is on-demand (2-1-1) PrEP a good option for my situation?');
    questions.push('How do I make sure I follow the dosing schedule correctly?');
  }
  if (primaryId === 'injectable_2mo') {
    questions.push('Do you offer the cabotegravir (Apretude) injection at this clinic?');
    questions.push('What should I expect during the oral lead-in period?');
    questions.push('What happens if I miss or am late for an injection appointment?');
  }
  if (primaryId === 'injectable_6mo') {
    questions.push('Do you offer lenacapavir (Yeztugo) for PrEP at this clinic?');
    questions.push('What does the oral loading phase involve?');
  }

  // Questions based on their concerns
  const userConcerns = responses.prep_08 || [];
  if (userConcerns.includes('side_effects')) {
    questions.push('What side effects should I watch for, and when should I contact you?');
  }
  if (userConcerns.includes('cost')) {
    questions.push('Are there programs to help me pay for PrEP, like Ready Set PrEP or copay assistance?');
  }
  if (userConcerns.includes('stopping')) {
    if (primaryId === 'injectable_2mo' || primaryId === 'injectable_6mo') {
      questions.push('If I want to stop, what is the plan for staying protected during the medication tail period?');
    } else {
      questions.push('What happens if I decide to stop taking PrEP?');
    }
  }
  if (userConcerns.includes('privacy')) {
    questions.push('How can I keep my PrEP use private?');
  }

  // Questions based on pregnancy
  if (responses.prep_06 === 'yes' || responses.prep_06 === 'not_sure') {
    questions.push('How does PrEP work with pregnancy planning? Is it safe during pregnancy?');
  }

  // Questions based on medications
  if (responses.prep_07 === 'yes_prescription' || responses.prep_07 === 'yes_both') {
    questions.push('Will any of my current medications interact with this PrEP option?');
  }
  if (responses.prep_07 === 'yes_supplements' || responses.prep_07 === 'yes_both') {
    if (primaryId === 'injectable_6mo') {
      questions.push('Do any of my supplements interact with lenacapavir?');
    }
  }

  // General question everyone should ask
  questions.push('What tests do I need before starting, and how often will I need follow-up visits?');

  return questions;
}

function generateDynamicConversationStarters(primaryId, responses) {
  const starters = [];

  // Personalized opening based on their journey
  if (responses.prep_01 === 'no' || responses.prep_01 === 'not_sure') {
    starters.push("I've been learning about PrEP and I'm interested in getting started. Can we talk about which option might be right for me?");
  } else {
    starters.push("I've used PrEP before and I'd like to explore whether a different option might work better for me now.");
  }

  // Based on primary recommendation
  if (primaryId === 'oral') {
    starters.push("I think a daily pill might work well for my lifestyle. Can you tell me more about oral PrEP?");
  } else if (primaryId === 'on_demand') {
    starters.push("I've read about on-demand PrEP where you take pills before and after sex. Could that be an option for me?");
  } else if (primaryId === 'injectable_2mo') {
    starters.push("I'm interested in the every-2-month PrEP injection. Do you offer that here, and would it be a good fit for me?");
  } else if (primaryId === 'injectable_6mo') {
    starters.push("I've heard about a PrEP injection you only get twice a year. Can we talk about whether that could work for me?");
  }

  // Based on what matters to them
  starters.push("I used a decision tool that helped me think about my PrEP options. Can I share what I learned with you?");

  if (responses.prep_05 === 'very_important') {
    starters.push("Privacy is really important to me. What PrEP options would let me be the most discreet?");
  }

  if (responses.prep_09 === 'lowest_cost' || (responses.prep_08 || []).includes('cost')) {
    starters.push("I'm concerned about the cost of PrEP. What assistance programs are available to help me?");
  }

  return starters;
}

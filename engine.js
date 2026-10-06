/* 診断ロジック。UIから独立しているので、後で質問やデザインを変えても使い回せます。 */
(function () {
  'use strict';

  function average(values) {
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function buildProfile(answers, data) {
    const axisBuckets = {};
    data.axes.forEach(axis => { axisBuckets[axis.key] = []; });

    const flags = { competence: false, vitality: false, management: false };

    data.questions.forEach(question => {
      const answerKey = answers[question.id];
      const choice = question.choices.find(item => item.key === answerKey);
      if (!choice) return;

      Object.entries(choice.scores || {}).forEach(([axisKey, value]) => {
        if (axisBuckets[axisKey] && Number.isFinite(value)) axisBuckets[axisKey].push(value);
      });

      Object.entries(choice.flags || {}).forEach(([flagKey, value]) => {
        if (value === true && Object.prototype.hasOwnProperty.call(flags, flagKey)) flags[flagKey] = true;
      });
    });

    const profile = {};
    Object.entries(axisBuckets).forEach(([key, values]) => {
      profile[key] = average(values);
    });

    return { profile, flags, axisBuckets };
  }

  function baseCompatibility(profile, character, data) {
    let weightedSimilarity = 0;
    let totalWeight = 0;

    data.axes.forEach(axis => {
      const userValue = profile[axis.key];
      const ideal = character.ideal[axis.key];
      const weight = character.weight[axis.key];
      if (!Number.isFinite(userValue) || !Number.isFinite(ideal) || !Number.isFinite(weight)) return;

      const similarity = 10 - Math.abs(userValue - ideal);
      weightedSimilarity += similarity * weight;
      totalWeight += weight;
    });

    if (!totalWeight) return 0;
    return (weightedSimilarity / totalWeight) * 10;
  }

  function applySpecialRules(character, baseScore, flags, data) {
    const rules = data.rules;
    let finalScore = baseScore;
    let eligible = true;
    const notes = [];

    if (character.id === 'yui') {
      const competence = flags.competence === true;
      const vitality = flags.vitality === true;
      eligible = competence || vitality;

      if (!eligible) {
        notes.push('能力ゲート未通過');
      } else if (competence && vitality) {
        finalScore += rules.yui.bothFlagsBonus;
        notes.push(`有能＋バイタリティ +${rules.yui.bothFlagsBonus}`);
      } else {
        finalScore += rules.yui.oneFlagBonus;
        notes.push(`能力ゲート突破 +${rules.yui.oneFlagBonus}`);
      }
    }

    if (character.id === 'tachibana' && flags.management && baseScore >= rules.tachibana.minBaseScore) {
      finalScore += rules.tachibana.managementBonus;
      notes.push(`マネジメント +${rules.tachibana.managementBonus}`);
    }

    if (character.id === 'tsurumi') {
      if (flags.vitality && baseScore >= rules.tsurumi.vitalityMinBaseScore) {
        finalScore += rules.tsurumi.vitalityBonus;
        notes.push(`バイタリティ +${rules.tsurumi.vitalityBonus}`);
      }
      if (flags.management && baseScore >= rules.tsurumi.managementMinBaseScore) {
        finalScore += rules.tsurumi.managementBonus;
        notes.push(`マネジメント +${rules.tsurumi.managementBonus}`);
      }
    }

    finalScore = Math.min(rules.maxScore, finalScore);
    return { finalScore, eligible, notes };
  }

  function diagnose(answers, data) {
    const built = buildProfile(answers, data);
    const results = data.characters.map((character, order) => {
      const baseScore = baseCompatibility(built.profile, character, data);
      const special = applySpecialRules(character, baseScore, built.flags, data);
      return {
        ...character,
        order,
        baseScore,
        finalScore: special.finalScore,
        eligible: special.eligible,
        notes: special.notes
      };
    });

    const eligibleResults = results
      .filter(result => result.eligible)
      .sort((a, b) => {
        if (Math.abs(b.finalScore - a.finalScore) > 1e-9) return b.finalScore - a.finalScore;
        if (Math.abs(b.baseScore - a.baseScore) > 1e-9) return b.baseScore - a.baseScore;
        return a.order - b.order;
      });

    return {
      profile: built.profile,
      flags: built.flags,
      results,
      ranking: eligibleResults,
      winner: eligibleResults[0] || null
    };
  }

  window.DiagnosisEngine = { buildProfile, baseCompatibility, diagnose };
})();

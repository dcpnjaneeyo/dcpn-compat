(function () {
  'use strict';

  const data = window.DIAGNOSIS_DATA;
  const engine = window.DiagnosisEngine;
  const root = document.getElementById('app');

  const state = {
    userName: '',
    questionIndex: 0,
    answers: {},
    version: data.currentVersion,
    compareCharacterId: null
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function activeData() {
    if (state.version !== data.currentVersion && data.legacy && data.legacy[state.version]) {
      return data.legacy[state.version];
    }
    return data;
  }

  function copyText(path, fallback, variables = {}) {
    const parts = path.split('.');
    let value = data.copy;
    for (const part of parts) value = value && value[part];
    const template = typeof value === 'string' ? value : fallback;
    return String(template || '').replace(/\{(\w+)\}/g, (_, key) => Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : `{${key}}`);
  }

  function renderBrand() {
    return `
      <header class="brand-row">
        <div>
          <p class="brand-row__kicker">${escapeHtml(copyText('brand.kicker', '江頭家'))}</p>
          <p class="brand-row__title">${escapeHtml(copyText('brand.title', 'Uchinoko Match'))}</p>
        </div>
        <span class="brand-row__spark" aria-hidden="true">✦</span>
      </header>`;
  }

  function renderStart() {
    state.version = data.currentVersion;
    root.innerHTML = `
      <section class="screen screen--start">
        <article class="page-card page-card--start surface-card">
          <div class="start-hero" role="img" aria-label="江頭家のキャラクターイラストパターン">
            ${renderBrand()}
          </div>
          <div class="start-card">
            <div class="start-copy">
              <p class="eyebrow">${escapeHtml(copyText('start.kicker', '江頭家'))}</p>
              <h1>${escapeHtml(copyText('start.title', 'Uchinoko Match'))}</h1>
              <p class="lead">${escapeHtml(copyText('start.lead', '質問は全8問。飼い主さんの名前でも、お子さんの名前でもお気軽にどうぞ～！'))}</p>
            </div>
            <form id="start-form" novalidate>
              <div class="form-group">
                <label class="label" for="user-name">${escapeHtml(copyText('start.nameLabel', 'あなたのお名前'))}</label>
                <input class="text-input" id="user-name" name="userName" maxlength="20" autocomplete="nickname" placeholder="${escapeHtml(copyText('start.namePlaceholder', '名前を入力'))}" value="${escapeHtml(state.userName)}">
                <p class="help">${escapeHtml(copyText('start.nameHelp', '結果の「○○さん」に使う名前です。'))}</p>
                <p class="error" id="name-error" role="alert"></p>
              </div>
              <button class="primary-button" type="submit">${escapeHtml(copyText('start.button', '診断をはじめる！'))}</button>
            </form>
          </div>
        </article>
      </section>`;

    const form = document.getElementById('start-form');
    const input = document.getElementById('user-name');
    form.addEventListener('submit', event => {
      event.preventDefault();
      const name = input.value.trim();
      const error = document.getElementById('name-error');
      if (!name) {
        error.textContent = copyText('start.nameRequired', 'お名前を入力してください。');
        input.focus();
        return;
      }
      state.userName = name.slice(0, 20);
      state.questionIndex = 0;
      state.answers = {};
      state.compareCharacterId = null;
      renderQuestion();
    });
  }

  function renderQuestion() {
    const currentData = activeData();
    const question = currentData.questions[state.questionIndex];
    const current = state.questionIndex + 1;
    const total = currentData.questions.length;

    const progress = currentData.questions.map((_, index) => `<span class="progress__bar ${index < current ? 'is-done' : ''}"></span>`).join('');
    const choices = question.choices.map(choice => `
      <button class="choice-button" type="button" data-choice="${choice.key}">
        <span class="choice-key">${choice.key}</span>
        <span class="choice-text">${escapeHtml(choice.text)}</span>
      </button>`).join('');

    root.innerHTML = `
      <section class="screen">
        <article class="page-card surface-card">
          ${renderBrand()}
          <div class="question-card">
            <div class="question-head">
              <span class="question-head__label">${escapeHtml(copyText('question.heading', 'あなたのことを教えてね'))}</span>
              <span class="question-head__count">${current} / ${total}</span>
            </div>
            <div class="progress" aria-label="進捗 ${current} / ${total}">${progress}</div>
            <h2 class="question-title">${escapeHtml(question.text)}</h2>
            <p class="question-sub">${escapeHtml(copyText('question.instruction', 'あてはまるものを1つ選んでください'))}</p>
            <div class="choices">${choices}</div>
            <p class="question-footer">${escapeHtml(copyText('question.footer', '選ぶと次の質問に進みます。'))}</p>
          </div>
        </article>
      </section>`;

    root.querySelectorAll('[data-choice]').forEach(button => {
      button.addEventListener('click', () => {
        state.answers[question.id] = button.dataset.choice;
        if (state.questionIndex < total - 1) {
          state.questionIndex += 1;
          renderQuestion();
        } else {
          renderResult();
        }
      });
    });
  }

  function formatScore(value) {
    return Math.round(value);
  }

  function clampPercent(value) {
    if (!Number.isFinite(value)) return 50;
    return Math.max(0, Math.min(100, value * 10));
  }

  function selectResultQuote(character, diagnosis) {
    const rule = character.quoteRule;
    if (!rule) return character.resultQuote || character.quoteA || character.quoteB || '';

    if (rule.type === 'initiativeThreshold') {
      const initiative = diagnosis.profile.initiative;
      return Number.isFinite(initiative) && initiative >= rule.threshold ? character.quoteA : character.quoteB;
    }
    if (rule.type === 'management') {
      return diagnosis.flags.management ? character.quoteA : character.quoteB;
    }
    if (rule.type === 'yuiAbility') {
      return diagnosis.flags.competence ? character.quoteA : character.quoteB;
    }
    if (rule.type === 'tsurumiFlags') {
      if (diagnosis.flags.management) return character.quoteB;
      if (diagnosis.flags.vitality) return character.quoteA;
      return character.quoteB;
    }
    return character.resultQuote || character.quoteA || character.quoteB || '';
  }

  function renderWinnerArt(character) {
    return `
      <div class="winner-art" style="--character-color:${escapeHtml(character.color)}">
        <img src="${escapeHtml(character.image)}" alt="${escapeHtml(character.name)}">
      </div>`;
  }

  function renderRubyName(character) {
    if (character.id === 'mari' || !character.furigana) {
      return escapeHtml(character.name);
    }
    return `<ruby>${escapeHtml(character.name)}<rt>${escapeHtml(character.furigana)}</rt></ruby>`;
  }

  function renderRunner(item, rank) {
    return `
      <div class="runner-card" style="--character-color:${escapeHtml(item.color)}">
        <img class="runner-art" src="${escapeHtml(item.image)}" alt="" aria-hidden="true">
        <div class="runner-copy">
          <span class="runner-rank">${escapeHtml(copyText('result.runnerRank', '{rank}位', { rank }))}</span>
          <span class="runner-name">${escapeHtml(item.name)}</span>
          <span class="runner-score">${escapeHtml(copyText('result.runnerScore', '相性 {score}%', { score: formatScore(item.finalScore) }))}</span>
        </div>
      </div>`;
  }

  function renderCharacterSwitcher(characters, selectedId) {
    return characters.map(character => `
      <button class="character-switch ${character.id === selectedId ? 'is-active' : ''}" type="button" data-compare-character="${escapeHtml(character.id)}" aria-pressed="${character.id === selectedId ? 'true' : 'false'}" aria-label="${escapeHtml(character.name)}と比較" style="--character-color:${escapeHtml(character.color)}">
        <img src="${escapeHtml(character.markerImage)}" alt="">
        <span>${escapeHtml(character.name)}</span>
      </button>`).join('');
  }

  function renderAnswerReview(currentData) {
    const items = currentData.questions.map((question, index) => {
      const selectedKey = state.answers[question.id];
      const selectedChoice = question.choices.find(choice => choice.key === selectedKey);
      const answerText = selectedChoice ? selectedChoice.text : '未回答';
      return `
        <li class="answer-review__item">
          <div class="answer-review__line answer-review__line--question">
            <span class="answer-review__label">Q.</span>
            <span>${escapeHtml(question.text)}</span>
          </div>
          <div class="answer-review__line answer-review__line--answer">
            <span class="answer-review__label">A.</span>
            <span>${escapeHtml(answerText)}</span>
          </div>
        </li>`;
    }).join('');

    return `
      <details class="answer-review">
        <summary class="answer-review__summary">
          <span>選んだ選択肢</span>
          <span class="answer-review__meta">全${currentData.questions.length}問</span>
        </summary>
        <ol class="answer-review__list">${items}</ol>
      </details>`;
  }

  function renderProfileComparison(profile, selectedCharacter, characters) {
    const rows = data.axes.map(axis => {
      const userValue = profile[axis.key];
      const characterValue = selectedCharacter.personality[axis.key];
      const userLeft = clampPercent(userValue);
      const characterLeft = clampPercent(characterValue);
      const userLabel = Number.isFinite(userValue) ? userValue.toFixed(1) : '-';
      const characterLabel = Number.isFinite(characterValue) ? characterValue.toFixed(1) : '-';

      return `
        <div class="profile-row">
          <div class="profile-row__head">
            <span class="profile-row__name">${escapeHtml(axis.label)}</span>
            <span class="profile-row__values">あなた ${userLabel} / ${escapeHtml(selectedCharacter.name)} ${characterLabel}</span>
          </div>
          <div class="profile-scale" aria-label="${escapeHtml(axis.label)}。あなた ${userLabel}、${escapeHtml(selectedCharacter.name)} ${characterLabel}" style="--character-color:${escapeHtml(selectedCharacter.color)}">
            <img class="profile-marker profile-marker--character" src="${escapeHtml(selectedCharacter.markerImage)}" alt="" aria-hidden="true" style="left:${characterLeft}%">
            <span class="profile-marker profile-marker--user" style="left:${userLeft}%" aria-hidden="true"></span>
          </div>
          <div class="profile-poles">
            <span>${escapeHtml(axis.lowLabel)}</span>
            <span>${escapeHtml(axis.highLabel)}</span>
          </div>
        </div>`;
    }).join('');

    return `
      <section class="comparison-card" id="comparison-card" style="--character-color:${escapeHtml(selectedCharacter.color)}">
        <div class="comparison-heading">
          <div>
            <p class="section-kicker">PROFILE</p>
            <h3 class="comparison-title">${escapeHtml(copyText('result.detailsTitle', '診断分析'))}</h3>
          </div>
          <div class="comparison-legend" aria-label="グラフの凡例">
            <span class="legend-item"><span class="legend-user" aria-hidden="true"></span>${escapeHtml(copyText('compare.userLegend', '{name}', { name: state.userName }))}</span>
            <span class="legend-item"><img src="${escapeHtml(selectedCharacter.markerImage)}" alt="" aria-hidden="true">${escapeHtml(selectedCharacter.name)}</span>
          </div>
        </div>
        <div class="character-switcher" aria-label="比較するキャラクター">
          ${renderCharacterSwitcher(characters, selectedCharacter.id)}
        </div>
        <div class="profile-compare">${rows}</div>
        <p class="comparison-note">${escapeHtml(copyText('compare.note', '※キャラクター側の位置は、そのキャラクター本人の性格値です。診断の相性計算に使う「理想値」とは別です。'))}</p>
      </section>`;
  }

  function buildAnswerCode(currentData) {
    return currentData.questions.map(question => state.answers[question.id] || '').join('');
  }

  function buildResultUrl() {
    const currentData = activeData();
    const baseUrl = data.siteUrl || (/^https?:$/.test(location.protocol) ? location.href : 'https://dcpn-compat.pages.dev/');
    const url = new URL(baseUrl, /^https?:$/.test(location.protocol) ? location.href : undefined);
    url.search = '';
    url.hash = '';
    url.searchParams.set('v', data.currentVersion);
    url.searchParams.set('name', state.userName);
    url.searchParams.set('answers', buildAnswerCode(currentData));
    return url.toString();
  }

  function restoreSharedResultFromUrl() {
    if (!/^https?:$/.test(location.protocol)) return false;
    const params = new URLSearchParams(location.search);
    const version = (params.get('v') || data.currentVersion).trim();
    const sourceData = version !== data.currentVersion && data.legacy && data.legacy[version] ? data.legacy[version] : data;
    const name = (params.get('name') || '').trim().slice(0, 20);
    const answerCode = (params.get('answers') || '').trim().toUpperCase();

    if (!name || answerCode.length !== sourceData.questions.length || !/^[A-D]+$/.test(answerCode)) return false;

    const answers = {};
    sourceData.questions.forEach((question, index) => {
      const key = answerCode[index];
      const exists = question.choices.some(choice => choice.key === key);
      if (exists) answers[question.id] = key;
    });
    if (Object.keys(answers).length !== sourceData.questions.length) return false;

    state.userName = name;
    state.questionIndex = sourceData.questions.length - 1;
    state.answers = answers;
    state.version = sourceData === data ? data.currentVersion : version;
    return true;
  }

  function clearResultUrl() {
    if (!/^https?:$/.test(location.protocol) || !history.replaceState) return;
    const clean = location.pathname + (location.hash || '');
    history.replaceState(null, '', clean);
  }

  function wireComparison(profile, characters) {
    root.querySelectorAll('[data-compare-character]').forEach(button => {
      button.addEventListener('click', () => {
        state.compareCharacterId = button.dataset.compareCharacter;
        const selected = characters.find(character => character.id === state.compareCharacterId) || characters[0];
        const current = document.getElementById('comparison-card');
        if (current) current.outerHTML = renderProfileComparison(profile, selected, characters);
        wireComparison(profile, characters);
      });
    });
  }

  function renderResult() {
    const currentData = activeData();
    const diagnosis = engine.diagnose(state.answers, currentData);
    const winner = diagnosis.winner;
    if (!winner) {
      root.innerHTML = `<section class="screen"><article class="page-card surface-card">${renderBrand()}<div class="empty-card"><p>${escapeHtml(copyText('result.error', '診断結果を計算できませんでした。'))}</p></div></article></section>`;
      return;
    }

    const second = diagnosis.ranking[1];
    const third = diagnosis.ranking[2];
    const runners = [second, third].filter(Boolean).map((item, index) => renderRunner(item, index + 2)).join('');
    const quote = selectResultQuote(winner, diagnosis);
    const selectedCharacter = currentData.characters.find(character => character.id === state.compareCharacterId) || winner;
    state.compareCharacterId = selectedCharacter.id;

    root.innerHTML = `
      <section class="screen screen--result">
        <article class="page-card result-page surface-card" style="--character-color:${escapeHtml(winner.color)}">
          ${renderBrand()}

          <div class="result-card">
            <p class="result-kicker">${escapeHtml(copyText('result.intro', '{name}さんといちばん相性がいいのは……', { name: state.userName }))}</p>
            ${renderWinnerArt(winner)}
            <h2 class="result-name">${renderRubyName(winner)}</h2>
            <p class="result-quote">${escapeHtml(quote)}</p>
            <p class="result-text">${escapeHtml(winner.resultText)}</p>
            <div class="score-lockup">
              <span class="score-label">${escapeHtml(copyText('result.scoreLabel', '相性スコア'))}</span>
              <strong class="score-value">${formatScore(winner.finalScore)}<span>%</span></strong>
            </div>
          </div>

          <section class="runner-section">
            <p class="section-kicker">ALSO MATCHED</p>
            <h3 class="section-title">${escapeHtml(copyText('result.runnersTitle', '次点の好相性キャラ'))}</h3>
            <div class="runner-grid">${runners}</div>
          </section>

          <div class="result-actions">
            <button class="primary-button" id="share-result" type="button">${escapeHtml(copyText('result.shareButton', '↗ 結果をシェアする'))}</button>
            <button class="secondary-button" id="restart" type="button">${escapeHtml(copyText('result.retryButton', 'もう一度診断する'))}</button>
          </div>

          ${renderAnswerReview(currentData)}

          ${renderProfileComparison(diagnosis.profile, selectedCharacter, currentData.characters)}
        </article>
      </section>`;

    wireComparison(diagnosis.profile, currentData.characters);

    document.getElementById('restart').addEventListener('click', () => {
      state.questionIndex = 0;
      state.answers = {};
      state.version = data.currentVersion;
      state.compareCharacterId = null;
      clearResultUrl();
      renderStart();
    });

    document.getElementById('share-result').addEventListener('click', () => {
      const resultUrl = buildResultUrl();
      const variables = { name: state.userName, character: winner.name, quote, url: resultUrl };
      let shareText = data.shareTemplate
        .replace(/\{(name|character|quote|url)\}/g, (_, key) => variables[key])
        .trim();
      if (resultUrl && !shareText.includes(resultUrl)) shareText += `\n\n${resultUrl}`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

  if (restoreSharedResultFromUrl()) renderResult();
  else renderStart();
})();

(function () {
  'use strict';

  const data = window.DIAGNOSIS_DATA;
  const engine = window.DiagnosisEngine;
  const root = document.getElementById('app');

  const state = {
    userName: '',
    questionIndex: 0,
    answers: {}
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderBrand() {
    return `
      <div class="brand-row">
        <div class="brand-row__icon" aria-hidden="true">✦</div>
        <div>
          <p class="brand-row__kicker">江頭家</p>
          <p class="brand-row__title">うちのこ相性診断</p>
        </div>
      </div>`;
  }

  function renderStart() {
    root.innerHTML = `
      <section class="screen screen--start">
        <div class="pattern-hero" role="img" aria-label="江頭家のキャラクターイラストパターン"></div>
        <div class="brand-mark" aria-hidden="true">✦</div>
        <div class="start-copy">
          <p class="eyebrow">江頭家</p>
          <h1>うちのこ相性診断</h1>
          <p class="lead">質問は全8問。飼い主さんの名前でも、お子さんの名前でもお気軽にどうぞ～！</p>
        </div>
        <form id="start-form" novalidate>
          <div class="form-group">
            <label class="label" for="user-name">あなたのお名前</label>
            <input class="text-input" id="user-name" name="userName" maxlength="20" autocomplete="nickname" placeholder="名前を入力" value="${escapeHtml(state.userName)}">
            <p class="help">結果の「○○さん」に使う名前です。</p>
            <p class="error" id="name-error" role="alert"></p>
          </div>
          <button class="primary-button" type="submit">診断をはじめる！</button>
        </form>
      </section>`;

    const form = document.getElementById('start-form');
    const input = document.getElementById('user-name');
    form.addEventListener('submit', event => {
      event.preventDefault();
      const name = input.value.trim();
      const error = document.getElementById('name-error');
      if (!name) {
        error.textContent = 'お名前を入力してください。';
        input.focus();
        return;
      }
      state.userName = name.slice(0, 20);
      state.questionIndex = 0;
      state.answers = {};
      renderQuestion();
    });
  }

  function renderQuestion() {
    const question = data.questions[state.questionIndex];
    const current = state.questionIndex + 1;
    const total = data.questions.length;

    const progress = data.questions.map((_, index) => `<span class="progress__bar ${index < current ? 'is-done' : ''}"></span>`).join('');
    const choices = question.choices.map(choice => `
      <button class="choice-button" type="button" data-choice="${choice.key}">
        <span class="choice-key">${choice.key}</span>
        <span class="choice-text">${escapeHtml(choice.text)}</span>
      </button>`).join('');

    root.innerHTML = `
      <section class="screen">
        ${renderBrand()}
        <div class="question-head">
          <span class="question-head__label">あなたのことを教えてね</span>
          <span class="question-head__count">${current} / ${total}</span>
        </div>
        <div class="progress" aria-label="進捗 ${current} / ${total}">${progress}</div>
        <h2 class="question-title">${escapeHtml(question.text)}</h2>
        <p class="question-sub">あてはまるものを1つ選んでください</p>
        <div class="choices">${choices}</div>
        <p class="question-footer">選ぶと次の質問に進みます。</p>
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

  function renderCharacterArt(character) {
    if (character.image) {
      return `<div class="character-art"><img src="${escapeHtml(character.image)}" alt="${escapeHtml(character.name)}"></div>`;
    }
    return `<div class="character-art" aria-label="${escapeHtml(character.name)}の画像は後で差し替え予定"><span class="character-art__placeholder">${escapeHtml(character.name.charAt(0))}</span></div>`;
  }

  function formatScore(value) {
    return Math.round(value);
  }

  function clampPercent(value) {
    if (!Number.isFinite(value)) return 50;
    return Math.max(0, Math.min(100, value * 10));
  }

  function renderProfileComparison(profile, winner) {
    const rows = data.axes.map(axis => {
      const userValue = profile[axis.key];
      const characterValue = winner.personality[axis.key];
      const userLeft = clampPercent(userValue);
      const characterLeft = clampPercent(characterValue);
      const userLabel = Number.isFinite(userValue) ? userValue.toFixed(1) : '-';
      const characterLabel = Number.isFinite(characterValue) ? characterValue.toFixed(1) : '-';

      return `
        <div class="profile-row">
          <div class="profile-row__head">
            <span class="profile-row__name">${escapeHtml(axis.label)}</span>
            <span class="profile-row__values">あなた ${userLabel} / ${escapeHtml(winner.name)} ${characterLabel}</span>
          </div>
          <div class="profile-scale" aria-label="${escapeHtml(axis.label)}。あなた ${userLabel}、${escapeHtml(winner.name)} ${characterLabel}">
            <span class="profile-marker profile-marker--character" style="left:${characterLeft}%" aria-hidden="true"></span>
            <span class="profile-marker profile-marker--user" style="left:${userLeft}%" aria-hidden="true"></span>
          </div>
          <div class="profile-poles">
            <span>${escapeHtml(axis.lowLabel)}</span>
            <span>${escapeHtml(axis.highLabel)}</span>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="comparison-panel">
        <div class="comparison-legend" aria-label="グラフの凡例">
          <span class="legend-item"><span class="legend-dot legend-dot--user" aria-hidden="true"></span>あなた</span>
          <span class="legend-item"><span class="legend-dot legend-dot--character" aria-hidden="true"></span>${escapeHtml(winner.name)}</span>
        </div>
        <div class="profile-compare">${rows}</div>
        <p class="comparison-note">※キャラクター側の位置は、そのキャラクター本人の性格値です。診断の相性計算に使う「理想値」とは別です。</p>
      </div>`;
  }

  function buildAnswerCode() {
    return data.questions.map(question => state.answers[question.id] || '').join('');
  }

  function buildResultUrl() {
    if (!/^https?:$/.test(location.protocol)) return '';
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('v', '1');
    url.searchParams.set('name', state.userName);
    url.searchParams.set('answers', buildAnswerCode());
    return url.toString();
  }

  function restoreSharedResultFromUrl() {
    if (!/^https?:$/.test(location.protocol)) return false;
    const params = new URLSearchParams(location.search);
    const name = (params.get('name') || '').trim().slice(0, 20);
    const answerCode = (params.get('answers') || '').trim().toUpperCase();

    if (!name || answerCode.length !== data.questions.length || !/^[A-D]+$/.test(answerCode)) {
      return false;
    }

    const answers = {};
    data.questions.forEach((question, index) => {
      const key = answerCode[index];
      const exists = question.choices.some(choice => choice.key === key);
      if (exists) answers[question.id] = key;
    });

    if (Object.keys(answers).length !== data.questions.length) return false;

    state.userName = name;
    state.questionIndex = data.questions.length - 1;
    state.answers = answers;
    return true;
  }

  function clearResultUrl() {
    if (!/^https?:$/.test(location.protocol) || !history.replaceState) return;
    const clean = location.pathname + (location.hash || '');
    history.replaceState(null, '', clean);
  }

  function renderResult() {
    const diagnosis = engine.diagnose(state.answers, data);
    const winner = diagnosis.winner;
    if (!winner) {
      root.innerHTML = '<section class="screen"><p>診断結果を計算できませんでした。</p></section>';
      return;
    }

    const second = diagnosis.ranking[1];
    const third = diagnosis.ranking[2];
    const runners = [second, third].filter(Boolean).map((item, index) => `
      <div class="runner-card">
        <span class="runner-rank">${index + 2}位</span>
        <span class="runner-name">${escapeHtml(item.name)}</span>
        <span class="runner-score">相性 ${formatScore(item.finalScore)}%</span>
      </div>`).join('');

    const quote = winner.resultQuote || '「キャラセリフ（あとで差し替え）」';

    root.innerHTML = `
      <section class="screen">
        ${renderBrand()}
        <article class="result-card">
          <p class="result-kicker">${escapeHtml(state.userName)}さんと最も相性がいいのは―</p>
          ${renderCharacterArt(winner)}
          <h2 class="result-name">${escapeHtml(winner.name)}</h2>
          <p class="result-quote">${escapeHtml(quote)}</p>
          <p class="result-text">${escapeHtml(winner.resultText)}</p>
          <div class="score-label">相性スコア</div>
          <div class="score-value">${formatScore(winner.finalScore)}%</div>
        </article>

        <section class="runner-section">
          <h3 class="section-title">こちらのふたりとも好相性</h3>
          <div class="runner-grid">${runners}</div>
        </section>

        <div class="result-actions">
          <button class="primary-button" id="share-result" type="button">↗ 結果をシェアする</button>
          <button class="secondary-button" id="restart" type="button">もう一度診断する</button>
        </div>

        <details class="debug">
          <summary>診断の内訳を見る</summary>
          ${renderProfileComparison(diagnosis.profile, winner)}
        </details>
      </section>`;

    document.getElementById('restart').addEventListener('click', () => {
      state.questionIndex = 0;
      state.answers = {};
      clearResultUrl();
      renderStart();
    });

    document.getElementById('share-result').addEventListener('click', () => {
      const resultUrl = buildResultUrl();
      const text = `【江頭家相性診断】${state.userName}さんと相性がいいのは${winner.name}でした！`;
      const shareText = resultUrl ? `${text}\n${resultUrl}` : text;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

  if (restoreSharedResultFromUrl()) {
    renderResult();
  } else {
    renderStart();
  }
})();

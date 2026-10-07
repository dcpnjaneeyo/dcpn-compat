/*
 * Uchinoko Match - 診断データ
 * Google Sheets「うちのこ相性診断_調整シート」2026-10-07 時点の最新版を反映。
 * v2: 新Q2 + 最新重要度。v1共有リンクは旧Q2/旧重要度で再現します。
 */
(function () {
  'use strict';

  const AXES = [
    { key: 'flexibility', label: '柔軟性', lowLabel: '規律派', highLabel: '柔軟派' },
    { key: 'initiative', label: '積極性', lowLabel: '見守る派', highLabel: '積極派' },
    { key: 'independence', label: '自立性', lowLabel: '同調派', highLabel: '自立派' },
    { key: 'actionOrientation', label: '行動志向', lowLabel: '慎重派', highLabel: '勢い派' },
    { key: 'novelty', label: '刺激志向', lowLabel: '安定派', highLabel: '刺激派' }
  ];

  const QUESTIONS = [
    {
      id: 1,
      text: '友達数人で旅行することになった。\nあなたはどの立ち位置になりがち？',
      choices: [
        { key: 'A', text: '日程や交通を調べて、ざっくり予定を組む', scores: { flexibility: 3, actionOrientation: 3 } },
        { key: 'B', text: '「ここに行きたい！」の気持ちが強い人に合わせる', scores: { flexibility: 2, actionOrientation: 4 } },
        { key: 'C', text: '行きたい場所だけ伝えて、あとは流れに任せる', scores: { flexibility: 6, actionOrientation: 6 } },
        { key: 'D', text: '現地で気になったところに寄りたい', scores: { flexibility: 8, actionOrientation: 9 } }
      ]
    },
    {
      id: 2,
      text: '大切な人の誕生日。「何が欲しい？」と聞いたら「なんでもいいよ」と言われた。どうする？',
      choices: [
        { key: 'A', text: 'もうちょっと掘り下げて本人に聞いてみる', scores: { flexibility: 3, independence: 3, actionOrientation: 5 } },
        { key: 'B', text: '相手の好みを思い出しながら、自分で選ぶ', scores: { flexibility: 6, independence: 8, actionOrientation: 4 } },
        { key: 'C', text: '「じゃあ一緒に見に行こう！」と、そのまま買い物に誘う', scores: { flexibility: 8, independence: 3, actionOrientation: 8 } },
        { key: 'D', text: '勢い重視で自分が「これいい！」と思ったものを贈る', scores: { flexibility: 6, independence: 6, actionOrientation: 7 } }
      ]
    },
    {
      id: 3,
      text: '友達が、自分のまったく知らない趣味に最近ハマっているみたい。',
      choices: [
        { key: 'A', text: '「どんなところが好きなの？」と本人にいろいろ聞く', scores: { initiative: 8, novelty: 7 } },
        { key: 'B', text: '気になって、あとで自分でもちょっと調べてみる', scores: { initiative: 5, novelty: 9 } },
        { key: 'C', text: '今度一緒にやってみたい・見てみたいと本人に言う', scores: { initiative: 10, novelty: 10 } },
        { key: 'D', text: '相手が楽しそうならそれでいい。自分は特に触れない', scores: { initiative: 1, novelty: 3 } }
      ]
    },
    {
      id: 4,
      text: '知り合いから、自分なら普段選ばないような誘いを受けた。',
      choices: [
        { key: 'A', text: 'あまり興味がなければ断る', scores: { actionOrientation: 5, novelty: 2 } },
        { key: 'B', text: '相手と行くなら楽しそうなので参加する', scores: { actionOrientation: 7, novelty: 7 } },
        { key: 'C', text: 'やったことがないのが面白そうなので参加する', scores: { actionOrientation: 8, novelty: 10 } },
        { key: 'D', text: '詳しく聞いてから決める', scores: { actionOrientation: 3, novelty: 6 } }
      ]
    },
    {
      id: 5,
      text: 'もうすぐ仕事だけど憂鬱。\n「たまには休んでもいいんじゃない？」と言われた。',
      choices: [
        { key: 'A', text: '確かにそうかも。今日くらい休んじゃおうかな！？', scores: { flexibility: 7, independence: 1 } },
        { key: 'B', text: '確かにそうかも。でも、頑張ろうと思う', scores: { flexibility: 5, independence: 7 } },
        { key: 'C', text: 'ありがたく受け取るけれど、休むかどうかは自分で決める', scores: { flexibility: 6, independence: 9 } },
        { key: 'D', text: '周りに迷惑がかかるし、軽い気持ちで休むなんてできないよ〜', scores: { flexibility: 1, independence: 5 } }
      ]
    },
    {
      id: 6,
      text: '突然「この案件、今日中にお願いできる？」と上司に仕事を振られた。詳しい説明はまだない。',
      choices: [
        { key: 'A', text: '上司の言うことは絶対。「はい、やります！今日中に終わらせます！」', scores: {}, flags: { vitality: true } },
        { key: 'B', text: '上司が忙しそうにしていて振られるだろうと予想していた。「昨日部長と話していた案件（盗み聞き）ですよね。わかりました」', scores: {}, flags: { competence: true } },
        { key: 'C', text: '上司に応えたいけれど自信はない。「頑張ります。内容だけ先に確認してもいいですか？」', scores: {} },
        { key: 'D', text: '上司からのお願いでも冷静に。「まず他の仕事との優先順位を確認したいです」', scores: {} }
      ]
    },
    {
      id: 7,
      text: '締切ギリギリになりやすい人と一緒に作業することになった。',
      choices: [
        { key: 'A', text: '「今回は絶対締切を守って」と最初にはっきり伝える', scores: { flexibility: 1 } },
        { key: 'B', text: 'その人が遅れる可能性を考えて、嘘をついて少し早い締切を伝える', scores: { flexibility: 9 }, flags: { management: true } },
        { key: 'C', text: 'こまめに進捗を確認して、遅れていたら声をかける', scores: { flexibility: 4 } },
        { key: 'D', text: 'その人の担当なので、基本的には本人に任せる', scores: { flexibility: 5 } }
      ]
    },
    {
      id: 8,
      text: '最近少し落ち込んでいるけれど、大切な人が忙しくてあまり構ってもらえない。',
      choices: [
        { key: 'A', text: '相手が落ち着くまで待つ。構ってもらえないと余計に落ち込む', scores: { initiative: 1, independence: 1 } },
        { key: 'B', text: '少しだけ時間を作ってほしいと伝える', scores: { initiative: 6, independence: 3 } },
        { key: 'C', text: '今は忙しいんだなと思って、自分なりに気分転換する', scores: { initiative: 5, independence: 7 } },
        { key: 'D', text: '友達に会ったり、好きなことをしたりして自分で立て直す', scores: { initiative: 7, independence: 9 } }
      ]
    }
  ];

  const CHARACTERS = [
    {
      id: 'nayuki', name: '七夕希', furigana: 'なゆき', color: '#f795bd',
      image: 'assets/characters/c_nayuki.png', markerImage: 'assets/characters/m_nayuki.png',
      ideal: { flexibility: 7, initiative: 5, independence: 7, actionOrientation: 7, novelty: 8 },
      personality: { flexibility: 8, initiative: 9, independence: 7, actionOrientation: 9, novelty: 9 },
      resultQuote: '「週末なにして遊ぶ？行きたいところあったら教えてね！あっ、タコヤキ焼く！？」',
      quoteA: '「えっ、なゆも『おいも万博』気になってた……！行こ～！新しく買った服着ていくねっ！」',
      quoteB: '「週末なにして遊ぶ？行きたいところあったら教えてね！あっ、タコヤキ焼く！？」',
      quoteRule: { type: 'initiativeThreshold', threshold: 5 },
      weight: { flexibility: 1, initiative: 1, independence: 1.5, actionOrientation: 1, novelty: 1 },
      resultText: 'なゆはあなたの味方！あなたの世界を大切にしながら、新しい扉も開いてくれるよ。'
    },
    {
      id: 'tachibana', name: '橘', furigana: 'たちばな', color: '#e62429',
      image: 'assets/characters/c_tachibana.png', markerImage: 'assets/characters/m_tachibana.png',
      ideal: { flexibility: 8, initiative: 5, independence: 8, actionOrientation: 6, novelty: 7 },
      personality: { flexibility: 10, initiative: 5, independence: 10, actionOrientation: 5, novelty: 5 },
      resultQuote: '「……たまには休んでもいいと思うよ？」',
      quoteA: '『ん？いまからコンビニ集合？何時だと思ってる？……いいよ。明日予定ないし』',
      quoteB: '「……たまには休んでもいいと思うよ？」',
      quoteRule: { type: 'management' },
      weight: { flexibility: 2, initiative: 0.5, independence: 2, actionOrientation: 0.5, novelty: 0.5 },
      resultText: 'あなたはきっと甘い言葉に惑わされず前を向ける人。近すぎない距離感が心地よさそう。'
    },
    {
      id: 'shiratori', name: '白鳥', furigana: 'しらとり', color: '#a46de5',
      image: 'assets/characters/c_shiratori.png', markerImage: 'assets/characters/m_shiratori.png',
      ideal: { flexibility: 2, initiative: 3, independence: 3, actionOrientation: 5, novelty: 4 },
      personality: { flexibility: 5, initiative: 8, independence: 5, actionOrientation: 4, novelty: 3 },
      resultQuote: '「もしかして振り回されたいですか？僕、得意です♡」',
      quoteA: '「静かなところと賑やかなところ、どっちがいいですか？どこでもお付き合いします♡」',
      quoteB: '「もしかして振り回されたいタイプですか？僕、得意です♡」',
      quoteRule: null,
      weight: { flexibility: 2, initiative: 0.5, independence: 2, actionOrientation: 0.5, novelty: 0.5 },
      resultText: '包容力高め犬系お兄さんにおまかせあれ！あなたをしっかりリードします♡'
    },
    {
      id: 'yui', name: '由井', furigana: 'ゆい', color: '#83e0c0',
      image: 'assets/characters/c_yui.png', markerImage: 'assets/characters/m_yui.png',
      ideal: { flexibility: 7, initiative: 3, independence: 7, actionOrientation: 5, novelty: 5 },
      personality: { flexibility: 4, initiative: 5, independence: 10, actionOrientation: 3, novelty: 5 },
      resultQuote: '「……君、うちで働いてくれないかな？悪いようにはしないからさ」',
      quoteA: '「……君、うちで働いてくれないかな？悪いようにはしないからさ」',
      quoteB: '「君、ずいぶん無茶が効くと見た。明日事務所まで来てくれるかな。予定がある？僕が断っておくからさ」',
      quoteRule: { type: 'yuiAbility' },
      weight: { flexibility: 1, initiative: 1, independence: 1, actionOrientation: 0.5, novelty: 0.5 },
      resultText: '大変。ある選択肢を選んだことで、由井にその能力を買われてしまいました。どうやら面白い人物と思われたみたい。'
    },
    {
      id: 'mari', name: 'マリ', furigana: 'まり', color: '#e7b5fc',
      image: 'assets/characters/c_mari.png', markerImage: 'assets/characters/m_mari.png',
      ideal: { flexibility: 7, initiative: 6, independence: 3, actionOrientation: 8, novelty: 7 },
      personality: { flexibility: 8, initiative: 9, independence: 4, actionOrientation: 9, novelty: 8 },
      resultQuote: '「ね♡ハロウィンのコスプレなにがいい～？もちろん一緒に着てくれるよね？」',
      quoteA: '「ね♡ハロウィンのコスプレなにがいい～？もちろん一緒に着てくれるよね？」',
      quoteB: '「わかる〜！やなことってなぜか続いちゃうよね。飲み行こ！話聞くから！あたしに任せな〜？♡」',
      quoteRule: null,
      weight: { flexibility: 1.5, initiative: 0.5, independence: 0.5, actionOrientation: 1.5, novelty: 1 },
      resultText: '人生は勢いとノリ！バイブスあげてこ！一緒にいる時間を楽しく過ごそうね♡'
    },
    {
      id: 'tsurumi', name: '鶴水', furigana: 'つるみ', color: '#f9f339',
      image: 'assets/characters/c_tsurumi.png', markerImage: 'assets/characters/m_tsurumi.png',
      ideal: { flexibility: 6, initiative: 5, independence: 6, actionOrientation: 9, novelty: 5 },
      personality: { flexibility: 5, initiative: 6, independence: 4, actionOrientation: 10, novelty: 6 },
      resultQuote: '「オイ。朝まで飲み行くぞ。明日仕事だァ？関係ねえ！俺もだ！」',
      quoteA: '「オイ……朝まで飲み行くぞ。明日仕事だァ？関係ねえ、俺もだ！」',
      quoteB: '「お前ッ！？荷物全部持たせてんじゃねぇよ！あ？まぁ鍛えてるからな。このくらい軽い……お前ッ！？」',
      quoteRule: { type: 'tsurumiFlags' },
      weight: { flexibility: 0.5, initiative: 1, independence: 1, actionOrientation: 1.5, novelty: 0.5 },
      resultText: '考えすぎるより一緒に動こう。鶴水についていくためにはバイタリティが必要かも。うまく扱えば意外とイイ奴！'
    }
  ];

  const RULES = {
    yui: { gate: ['competence', 'vitality'], oneFlagBonus: 8, bothFlagsBonus: 12 },
    tachibana: { managementBonus: 8, minBaseScore: 80 },
    tsurumi: { vitalityBonus: 10, vitalityMinBaseScore: 80, managementBonus: 5, managementMinBaseScore: 75 },
    maxScore: 100
  };

  // 既存の v=1 共有URLを壊さないための旧Q2・旧重要度。
  const LEGACY_QUESTIONS = QUESTIONS.map(question => {
    if (question.id !== 2) return question;
    return {
      id: 2,
      text: 'グループで決めた集合時間。\nひとりだけ毎回ちょっと遅れてくる。',
      choices: [
        { key: 'A', text: '「決めた時間なんだから守って」と思う', scores: { flexibility: 1, independence: 3 } },
        { key: 'B', text: '遅れても困らないように予定を組めばいいと思う', scores: { flexibility: 6, independence: 6 } },
        { key: 'C', text: '別に気にならない。来たら合流すればいい', scores: { flexibility: 7, independence: 8 } },
        { key: 'D', text: 'その人に合わせて集合時間を決め直した方がいいと思う', scores: { flexibility: 5, independence: 2 } }
      ]
    };
  });

  const LEGACY_CHARACTERS = CHARACTERS.map(character => {
    const clone = { ...character, weight: { ...character.weight } };
    if (clone.id === 'nayuki') clone.weight.novelty = 1.5;
    if (clone.id === 'mari') clone.weight.independence = 1.5;
    return clone;
  });


  const COPY = {
    site: {
      browserTitle: 'Uchinoko Match｜江頭家'
    },
    brand: {
      kicker: '江頭家',
      title: 'Uchinoko Match'
    },
    start: {
      kicker: '江頭家',
      title: 'Uchinoko Match',
      lead: '質問は全8問。飼い主さんの名前でも、お子さんの名前でもお気軽にどうぞ～！',
      nameLabel: 'あなたのお名前',
      namePlaceholder: '名前を入力',
      nameHelp: '結果の「○○さん」に使う名前です。',
      nameRequired: 'お名前を入力してください。',
      button: '診断をはじめる！'
    },
    question: {
      heading: 'あなたのことを教えてね',
      instruction: 'あてはまるものを1つ選んでください',
      footer: '選ぶと次の質問に進みます。'
    },
    result: {
      intro: '{name}さんといちばん相性がいいのは……',
      scoreLabel: '相性スコア',
      runnersTitle: '次点の好相性キャラ',
      runnerRank: '{rank}位',
      runnerScore: '相性 {score}%',
      shareButton: '↗ 結果をシェアする',
      retryButton: 'もう一度診断する',
      detailsTitle: '診断分析',
      error: '診断結果を計算できませんでした。'
    },
    compare: {
      userLegend: '{name}',
      note: '※キャラクター側の位置は、そのキャラクター本人の性格値です。診断の相性計算に使う「理想値」とは別です。'
    }
  };

  const common = {
    siteUrl: 'https://dcpn-compat.pages.dev/',
    shareTemplate: '【江頭家相性診断】\n{name}さんの相性No.1は{character}！\n{quote}\n\n{url}',
    title: 'Uchinoko Match｜江頭家',
    axes: AXES,
    rules: RULES,
    copy: COPY
  };

  window.DIAGNOSIS_DATA = {
    ...common,
    currentVersion: '2',
    questions: QUESTIONS,
    characters: CHARACTERS,
    legacy: {
      '1': { ...common, questions: LEGACY_QUESTIONS, characters: LEGACY_CHARACTERS }
    }
  };
})();

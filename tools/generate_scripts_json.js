// Generate data/scripts.json from Scripts.txt (UCD v16.0.0)
// - Enumerates all Script values (excluding Common/Inherited/Unknown)
// - Assigns Japanese labels via dictionary, with safe fallback
// - Adds minimal tags (English + Japanese variants)
// - Leaves blocks as [] (to be filled by whitelist mapping later)

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const scriptsTxtPath = path.join(ROOT, 'Scripts.txt');
const outPath = path.join(ROOT, 'data', 'scripts.json');

// Known Japanese labels for common scripts
const LABEL_JA = new Map(Object.entries({
  Adlam: 'アドラム文字',
  Ahom: 'アーホム文字',
  Anatolian_Hieroglyphs: 'アナトリア・ヒエログリフ',
  Arabic: 'アラビア文字',
  Armenian: 'アルメニア文字',
  Avestan: 'アヴェスタ文字',
  Balinese: 'バリ文字',
  Bamum: 'バムン文字',
  Bassa_Vah: 'バサ・ヴァー文字',
  Batak: 'バタク文字',
  Bengali: 'ベンガル文字',
  Bhaiksuki: 'バイシュキ文字',
  Bopomofo: '注音符号',
  Brahmi: 'ブラーフミー文字',
  Braille: '点字',
  Buginese: 'ブギス文字',
  Buhid: 'ブヒド文字',
  Canadian_Aboriginal: 'カナダ先住民音節文字',
  Carian: 'カリア文字',
  Caucasian_Albanian: 'コーカサス・アルバニア文字',
  Chakma: 'チャクマ文字',
  Cham: 'チャム文字',
  Cherokee: 'チェロキー文字',
  Chorasmian: 'ホラズム文字',
  Coptic: 'コプト文字',
  Cuneiform: '楔形文字',
  Cypriot: 'キプロス文字',
  Cypro_Minoan: 'キプロス・ミノア文字',
  Cyrillic: 'キリル文字',
  Deseret: 'デゼレット文字',
  Devanagari: 'デーヴァナーガリー',
  Dives_Akuru: 'ディヴェヒ・アクル文字',
  Dogra: 'ドーグリー文字',
  Duployan: 'デュプロワイエ式速記',
  Egyptian_Hieroglyphs: 'エジプト・ヒエログリフ',
  Elbasan: 'エルバサン文字',
  Elymaic: 'エリュマイス文字',
  Ethiopic: 'エチオピア文字',
  Garay: 'ガライ文字',
  Georgian: 'ジョージア文字',
  Glagolitic: 'グラゴル文字',
  Gothic: 'ゴート文字',
  Grantha: 'グランタ文字',
  Greek: 'ギリシャ文字',
  Gujarati: 'グジャラート文字',
  Gunjala_Gondi: 'グンジャラ・ゴンディ文字',
  Gurmukhi: 'グルムキー文字',
  Gurung_Khema: 'グルン・ケマ文字',
  Han: '漢字',
  Hangul: 'ハングル',
  Hanifi_Rohingya: 'ハニフィ・ロヒンギャ文字',
  Hanunoo: 'ハヌノオ文字',
  Hatran: 'ハトラ文字',
  Hebrew: 'ヘブライ文字',
  Hiragana: 'ひらがな',
  Imperial_Aramaic: 'インペリアル・アラム文字',
  Inscriptional_Pahlavi: '碑文パフラヴィー文字',
  Inscriptional_Parthian: '碑文パルティア文字',
  Javanese: 'ジャワ文字',
  Kaithi: 'カイティ文字',
  Kannada: 'カンナダ文字',
  Katakana: 'カタカナ',
  Kawi: 'カウィ文字',
  Kayah_Li: 'カヤー文字',
  Kharoshthi: 'カローシュティー文字',
  Khitan_Small_Script: '契丹小字',
  Khmer: 'クメール文字',
  Khojki: 'コージュキ文字',
  Khudawadi: 'フダーワディー文字',
  Kirat_Rai: 'キラティ・ライ文字',
  Lao: 'ラーオ文字',
  Latin: 'ラテン文字',
  Lepcha: 'レプチャ文字',
  Limbu: 'リンブ文字',
  Linear_A: '線文字A',
  Linear_B: '線文字B',
  Lisu: 'リーシュ文字',
  Lycian: 'リュキア文字',
  Lydian: 'リディア文字',
  Mahajani: 'マハージャニー文字',
  Makasar: 'マカッサル文字',
  Malayalam: 'マラヤーラム文字',
  Mandaic: 'マンダ文字',
  Manichaean: 'マニ文字',
  Marchen: 'マルチェン文字',
  Masaram_Gondi: 'マサラム・ゴンディ文字',
  Medefaidrin: 'メデファイドリン文字',
  Meetei_Mayek: 'マニプリ文字',
  Mende_Kikakui: 'メンデ・キカクイ文字',
  Meroitic_Cursive: 'メロエ草書',
  Meroitic_Hieroglyphs: 'メロエ・ヒエログリフ',
  Miao: 'ミャオ文字',
  Modi: 'モーディー文字',
  Mongolian: 'モンゴル文字',
  Mro: 'ムロ文字',
  Multani: 'ムルターニー文字',
  Myanmar: 'ミャンマー文字',
  Nabataean: 'ナバテア文字',
  Nag_Mundari: 'ナグ・ムンダリ文字',
  Nandinagari: 'ナンディナーガリー文字',
  New_Tai_Lue: '新タイ・ルー文字',
  Newa: 'ネワール文字',
  Nko: 'ンコ文字',
  Nushu: '女書',
  Nyiakeng_Puachue_Hmong: 'ニャケン・プアチュ・モン文字',
  Ogham: 'オガム文字',
  Ol_Chiki: 'オル・チキ文字',
  Ol_Onal: 'オル・オナル文字',
  Old_Hungarian: '古ハンガリー文字',
  Old_Italic: '古イタリア文字',
  Old_North_Arabian: '古北アラビア文字',
  Old_Permic: '古ペルム文字',
  Old_Persian: '古代ペルシア文字',
  Old_Sogdian: '古ソグド文字',
  Old_South_Arabian: '古南アラビア文字',
  Old_Turkic: '古トルコ文字',
  Old_Uyghur: '古ウイグル文字',
  Oriya: 'オディア文字',
  Osage: 'オセージ文字',
  Osmanya: 'オスマニャ文字',
  Pahawh_Hmong: 'パハウ・フモン文字',
  Palmyrene: 'パルミラ文字',
  Pau_Cin_Hau: 'パウ・チン・ハウ文字',
  Phags_Pa: 'パスパ文字',
  Phoenician: 'フェニキア文字',
  Psalter_Pahlavi: '詩篇パフラヴィー文字',
  Rejang: 'ルジャン文字',
  Runic: 'ルーン文字',
  Samaritan: 'サマリア文字',
  Saurashtra: 'サウラーシュトラ文字',
  Sharada: 'シャーラダー文字',
  Shavian: 'ショー文字',
  Siddham: '悉曇',
  SignWriting: 'シグンライティング',
  Sinhala: 'シンハラ文字',
  Sogdian: 'ソグド文字',
  Sora_Sompeng: 'ソラ・ソンペン文字',
  Soyombo: 'ソヨンボ文字',
  Sundanese: 'スンダ文字',
  Sunuwar: 'スヌワール文字',
  Syloti_Nagri: 'シロティ・ナグリ文字',
  Syriac: 'シリア文字',
  Tagalog: 'タガログ文字',
  Tagbanwa: 'タグバンワ文字',
  Tai_Le: 'タイ・レ文字',
  Tai_Tham: 'ラーンナー文字',
  Tai_Viet: 'タイ・ヴィエト文字',
  Takri: 'タークリ文字',
  Tamil: 'タミル文字',
  Tangsa: 'タンサ文字',
  Tangut: '西夏文字',
  Telugu: 'テルグ文字',
  Thaana: 'ターナ文字',
  Thai: 'タイ文字',
  Tibetan: 'チベット文字',
  Tifinagh: 'ティフナグ文字',
  Tirhuta: 'ティルフータ文字',
  Todhri: 'トズリ文字',
  Toto: 'トト文字',
  Tulu_Tigalari: 'トゥル・ティガラリ文字',
  Ugaritic: 'ウガリット文字',
  Vai: 'ヴァイ文字',
  Vithkuqi: 'ヴィトクチ文字',
  Wancho: 'ワンチョ文字',
  Warang_Citi: 'ワラン・チティ文字',
  Yezidi: 'イェズディ文字',
  Yi: 'イ文字',
  Zanabazar_Square: 'ザナバザル方形文字',
}));

function makeId(scriptName) {
  return scriptName.replace(/_/g, '-').toLowerCase();
}

function makeLabelJa(name) {
  if (LABEL_JA.has(name)) return LABEL_JA.get(name);
  // Fallback: use readable name and append 「文字」 where appropriate
  const base = name.replace(/_/g, ' ');
  // For scripts already Japanese like ひらがな, カタカナ, 漢字, ハングル, return as-is
  if ([ 'Hiragana', 'Katakana', 'Han', 'Hangul' ].includes(name)) return LABEL_JA.get(name) || base;
  return base.replace(/ /g, '・') + '文字';
}

function makeTags(name, label) {
  const baseEn = name.replace(/_/g, ' ');
  const kebab = makeId(name);
  const tags = [baseEn, kebab];
  // Include Japanese label without 「文字」 suffix as a tag variant
  const jaCore = label.replace(/文字$/u, '');
  if (jaCore && jaCore !== label) tags.push(jaCore);
  return Array.from(new Set(tags));
}

function main() {
  const txt = fs.readFileSync(scriptsTxtPath, 'utf8');
  const scripts = new Set();
  for (const line of txt.split(/\r?\n/)) {
    if (!/^[0-9A-F]/.test(line)) continue;
    const semi = line.indexOf(';');
    if (semi === -1) continue;
    let name = line.slice(semi + 1).split('#')[0].trim();
    if (!name) continue;
    scripts.add(name);
  }
  const exclude = new Set(['Common', 'Inherited', 'Unknown']);
  const list = Array.from(scripts).filter(s => !exclude.has(s)).sort((a,b)=>a.localeCompare(b));

  const out = list.map(name => {
    const label = makeLabelJa(name);
    return {
      id: makeId(name),
      label,
      tags: makeTags(name, label),
      blocks: []
    };
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.error(`Generated ${out.length} categories to ${outPath}`);
}

main();


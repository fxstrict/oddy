// Question bank. d = difficulty tier (1 = level 1, 2 = level 2). c = index of the correct option.
// Each option is { ar, en }. Each tier needs at least ROUND_SIZE questions; a round samples ROUND_SIZE at random.
// The first 10 questions per world live here; extra questions are in ./more/<world>.js (merged below).
import { o, Q } from './qhelpers.js';
import moreMath from './more/math.js';
import moreHistory from './more/history.js';
import moreScience from './more/science.js';
import moreLanguages from './more/languages.js';
import moreGeneral from './more/general.js';
import tech from './more/tech.js';
import nature from './more/nature.js';
import health from './more/health.js';
import { EXPLAIN } from './explain.js';
import { TYPED } from './types.js';
import xMath from './extra/math.js';
import xHistory from './extra/history.js';
import xScience from './extra/science.js';
import xLanguages from './extra/languages.js';
import xGeneral from './extra/general.js';
import xTech from './extra/tech.js';
import xNature from './extra/nature.js';
import xHealth from './extra/health.js';

const BASE = {
  math: [
    Q('m1', 1, 'كم ناتج 7 × 8؟', 'What is 7 × 8?', [o('54'), o('56'), o('48'), o('64')], 1),
    Q('m2', 1, 'كم ناتج 15 + 27؟', 'What is 15 + 27?', [o('41'), o('43'), o('42'), o('52')], 2),
    Q('m3', 1, 'ما العدد التالي: 2، 4، 6، 8، …؟', 'What comes next: 2, 4, 6, 8, …?', [o('9'), o('12'), o('10'), o('11')], 2),
    Q('m4', 1, 'كم نصف العدد 90؟', 'What is half of 90?', [o('40'), o('45'), o('35'), o('55')], 1),
    Q('m5', 1, 'كم ناتج 100 − 37؟', 'What is 100 − 37?', [o('73'), o('67'), o('63'), o('53')], 2),
    Q('m6', 2, 'كم ناتج 12 × 12؟', 'What is 12 × 12?', [o('124'), o('144'), o('132'), o('154')], 1),
    Q('m7', 2, 'ما العدد التالي: 1، 4، 9، 16، …؟', 'What comes next: 1, 4, 9, 16, …?', [o('20'), o('24'), o('25'), o('36')], 2),
    Q('m8', 2, 'كم يساوي 25٪ من 200؟', 'What is 25% of 200?', [o('25'), o('40'), o('75'), o('50')], 3),
    Q('m9', 2, 'إذا كان س + 7 = 20 فكم قيمة س؟', 'If x + 7 = 20, what is x?', [o('12'), o('13'), o('27'), o('14')], 1),
    Q('m10', 2, 'ما محيط مربع طول ضلعه 9؟', 'What is the perimeter of a square with side 9?', [o('18'), o('81'), o('27'), o('36')], 3),
  ],
  history: [
    Q('h1', 1, 'ما عاصمة مصر؟', 'What is the capital of Egypt?', [o('الإسكندرية', 'Alexandria'), o('القاهرة', 'Cairo'), o('الأقصر', 'Luxor'), o('أسوان', 'Aswan')], 1),
    Q('h2', 1, 'ما أطول نهر في أفريقيا؟', 'What is the longest river in Africa?', [o('النيل', 'The Nile'), o('الكونغو', 'The Congo'), o('النيجر', 'The Niger'), o('الزامبيزي', 'The Zambezi')], 0),
    Q('h3', 1, 'في أي قارة تقع مصر في معظمها؟', 'Which continent is most of Egypt in?', [o('آسيا', 'Asia'), o('أوروبا', 'Europe'), o('أفريقيا', 'Africa'), o('أستراليا', 'Australia')], 2),
    Q('h4', 1, 'من بنى أهرامات الجيزة؟', 'Who built the pyramids of Giza?', [o('الرومان', 'The Romans'), o('المصريون القدماء', 'The ancient Egyptians'), o('الإغريق', 'The Greeks'), o('الفرس', 'The Persians')], 1),
    Q('h5', 1, 'ما أكبر محيطات العالم؟', 'What is the largest ocean?', [o('الأطلسي', 'Atlantic'), o('الهندي', 'Indian'), o('المتجمد الشمالي', 'Arctic'), o('الهادئ', 'Pacific')], 3),
    Q('h6', 2, 'من وحّد القطرين مصر العليا ومصر السفلى؟', 'Who unified Upper and Lower Egypt?', [o('مينا (نعرمر)', 'Narmer (Menes)'), o('خوفو', 'Khufu'), o('رمسيس الثاني', 'Ramses II'), o('تحتمس الثالث', 'Thutmose III')], 0),
    Q('h7', 2, 'ما الحجر الذي ساعد على فك رموز الهيروغليفية؟', 'Which stone helped decipher hieroglyphs?', [o('حجر رشيد', 'The Rosetta Stone'), o('حجر الشمس', 'The Sun Stone'), o('حجر الأساس', 'The Cornerstone'), o('حجر الجرانيت', 'Granite')], 0),
    Q('h8', 2, 'ما عاصمة المغرب؟', 'What is the capital of Morocco?', [o('الدار البيضاء', 'Casablanca'), o('مراكش', 'Marrakesh'), o('الرباط', 'Rabat'), o('فاس', 'Fez')], 2),
    Q('h9', 2, 'أي مضيق يصل البحر المتوسط بالمحيط الأطلسي؟', 'Which strait links the Mediterranean to the Atlantic?', [o('البوسفور', 'Bosphorus'), o('جبل طارق', 'Gibraltar'), o('هرمز', 'Hormuz'), o('باب المندب', 'Bab-el-Mandeb')], 1),
    Q('h10', 2, 'اشتُهر ابن الهيثم بإسهاماته في علم…', 'Ibn al-Haytham is famous for his work in…', [o('الفلك فقط', 'Astronomy only'), o('الطب', 'Medicine'), o('الجبر', 'Algebra'), o('البصريات', 'Optics')], 3),
  ],
  science: [
    Q('s1', 1, 'ما أقرب كوكب إلى الشمس؟', 'Which planet is closest to the Sun?', [o('عطارد', 'Mercury'), o('الزهرة', 'Venus'), o('الأرض', 'Earth'), o('المريخ', 'Mars')], 0),
    Q('s2', 1, 'أي غاز تمتصه النباتات في البناء الضوئي؟', 'Which gas do plants absorb for photosynthesis?', [o('الأكسجين', 'Oxygen'), o('ثاني أكسيد الكربون', 'Carbon dioxide'), o('الهيدروجين', 'Hydrogen'), o('الهيليوم', 'Helium')], 1),
    Q('s3', 1, 'عند أي درجة مئوية يغلي الماء؟', 'At what temperature (°C) does water boil?', [o('50'), o('90'), o('100'), o('120')], 2),
    Q('s4', 1, 'كم عدد أرجل الحشرة؟', 'How many legs does an insect have?', [o('4'), o('6'), o('8'), o('10')], 1),
    Q('s5', 1, 'أي مما يلي من الثدييات؟', 'Which of these is a mammal?', [o('القرش', 'Shark'), o('الحوت', 'Whale'), o('السلمون', 'Salmon'), o('الأخطبوط', 'Octopus')], 1),
    Q('s6', 2, 'ما الغاز الأكثر وفرة في الهواء؟', 'Which gas is most abundant in air?', [o('النيتروجين', 'Nitrogen'), o('الأكسجين', 'Oxygen'), o('الأرجون', 'Argon'), o('ثاني أكسيد الكربون', 'Carbon dioxide')], 0),
    Q('s7', 2, 'ما وحدة قياس القوة؟', 'What is the unit of force?', [o('الجول', 'Joule'), o('الواط', 'Watt'), o('نيوتن', 'Newton'), o('باسكال', 'Pascal')], 2),
    Q('s8', 2, 'ما «محطة الطاقة» في الخلية؟', 'What is the "powerhouse" of the cell?', [o('النواة', 'Nucleus'), o('الميتوكوندريا', 'Mitochondria'), o('الريبوسوم', 'Ribosome'), o('الجدار الخلوي', 'Cell wall')], 1),
    Q('s9', 2, 'تقريباً، كم سرعة الضوء بالكيلومتر في الثانية؟', 'Roughly how fast is light, in km per second?', [o('300 ألف', '300,000'), o('30 ألف', '30,000'), o('3 ملايين', '3 million'), o('3 آلاف', '3,000')], 0),
    Q('s10', 2, 'ما أصلب مادة طبيعية؟', 'What is the hardest natural material?', [o('الحديد', 'Iron'), o('الذهب', 'Gold'), o('الكوارتز', 'Quartz'), o('الألماس', 'Diamond')], 3),
  ],
  languages: [
    Q('l1', 1, 'ما معنى الكلمة الإنجليزية «Apple»؟', 'What does the Arabic word «تفاحة» mean?', [o('موزة', 'Banana'), o('تفاحة', 'Apple'), o('برتقالة', 'Orange'), o('عنب', 'Grapes')], 1),
    Q('l2', 1, 'ما معنى الكلمة الإنجليزية «Water»؟', 'What does the Arabic word «ماء» mean?', [o('ماء', 'Water'), o('نار', 'Fire'), o('هواء', 'Air'), o('تراب', 'Soil')], 0),
    Q('l3', 1, 'ما معنى الكلمة الإنجليزية «Sun»؟', 'What does the Arabic word «شمس» mean?', [o('قمر', 'Moon'), o('نجم', 'Star'), o('شمس', 'Sun'), o('سحابة', 'Cloud')], 2),
    Q('l4', 1, 'ما معنى الكلمة الإنجليزية «House»؟', 'What does the Arabic word «بيت» mean?', [o('مدرسة', 'School'), o('سيارة', 'Car'), o('شجرة', 'Tree'), o('بيت', 'House')], 3),
    Q('l5', 1, 'ما معنى الكلمة الإنجليزية «Red»؟', 'What does the Arabic word «أحمر» mean?', [o('أزرق', 'Blue'), o('أحمر', 'Red'), o('أخضر', 'Green'), o('أصفر', 'Yellow')], 1),
    Q('l6', 2, 'ما عكس كلمة «كبير»؟', 'What is the opposite of "big"?', [o('طويل', 'Tall'), o('قصير', 'Short'), o('صغير', 'Small'), o('ضخم', 'Huge')], 2),
    Q('l7', 2, 'ما جمع كلمة «كتاب»؟', 'What is the plural of "child"?', [o('كتب', 'Children'), o('كتابات', 'Childs'), o('كاتبون', 'Childes'), o('أكتاب', 'Childrens')], 0),
    Q('l8', 2, 'ما مرادف كلمة «سعيد»؟', 'Which word is closest in meaning to "happy"?', [o('حزين', 'Sad'), o('مسرور', 'Joyful'), o('غاضب', 'Angry'), o('متعب', 'Tired')], 1),
    Q('l9', 2, 'ما معنى الكلمة الإنجليزية «Library»؟', 'What does the Arabic word «مكتبة» mean?', [o('مكتبة', 'Library'), o('مكتب', 'Office'), o('مطعم', 'Restaurant'), o('مستشفى', 'Hospital')], 0),
    Q('l10', 2, 'ما معنى الكلمة الإنجليزية «Knowledge»؟', 'What does the Arabic word «معرفة» mean?', [o('قوة', 'Power'), o('ثروة', 'Wealth'), o('معرفة', 'Knowledge'), o('سرعة', 'Speed')], 2),
  ],
  general: [
    Q('g1', 1, 'كم يوماً في الأسبوع؟', 'How many days are in a week?', [o('5'), o('6'), o('8'), o('7')], 3),
    Q('g2', 1, 'كم عدد ألوان قوس قزح؟', 'How many colours are in a rainbow?', [o('5'), o('7'), o('6'), o('9')], 1),
    Q('g3', 1, 'ما أكبر حيوان في العالم؟', 'What is the largest animal in the world?', [o('الفيل', 'Elephant'), o('الزرافة', 'Giraffe'), o('الحوت الأزرق', 'Blue whale'), o('القرش الأبيض', 'Great white shark')], 2),
    Q('g4', 1, 'كم شهراً في السنة؟', 'How many months are in a year?', [o('12'), o('10'), o('11'), o('13')], 0),
    Q('g5', 1, 'أي حيوان يُلقَّب بـ«سفينة الصحراء»؟', 'Which animal is called the "ship of the desert"?', [o('الحصان', 'Horse'), o('الجمل', 'Camel'), o('الحمار', 'Donkey'), o('الغزال', 'Gazelle')], 1),
    Q('g6', 2, 'كم عدد قارات العالم؟', 'How many continents are there?', [o('5'), o('6'), o('8'), o('7')], 3),
    Q('g7', 2, 'كم قطعة شطرنج مع كل لاعب في بداية اللعبة؟', 'How many chess pieces does each player start with?', [o('16'), o('12'), o('20'), o('32')], 0),
    Q('g8', 2, 'من مخترع الهاتف؟', 'Who invented the telephone?', [o('إديسون', 'Edison'), o('تسلا', 'Tesla'), o('ألكسندر غراهام بيل', 'Alexander Graham Bell'), o('نيوتن', 'Newton')], 2),
    Q('g9', 2, 'ما أصغر عدد أولي؟', 'What is the smallest prime number?', [o('1'), o('2'), o('3'), o('0')], 1),
    Q('g10', 2, 'ما أسرع حيوان بري؟', 'What is the fastest land animal?', [o('الأسد', 'Lion'), o('الفهد', 'Cheetah'), o('النمر', 'Tiger'), o('الغزال', 'Gazelle')], 1),
  ],
};

const EXTRA = { math: moreMath, history: moreHistory, science: moreScience, languages: moreLanguages, general: moreGeneral, tech, nature, health };
// v0.7: 40 more questions per world (age groups 1 and 3, plus the missing level tiers of group 2), each with an explanation.
const NEW = { math: xMath, history: xHistory, science: xScience, languages: xLanguages, general: xGeneral, tech: xTech, nature: xNature, health: xHealth };

// Questions written before age groups existed: level 1 = kids (1), level 2 = juniors (2). Explanations for them live in explain.js.
const norm = (q) => ({ ...q, age: q.age ?? (q.d === 1 ? 1 : 2), e: q.e ?? EXPLAIN[q.id] ?? null });

export const QUESTIONS = Object.freeze(
  Object.fromEntries(Object.keys(EXTRA).map((id) => [id, Object.freeze([...(BASE[id] || []), ...EXTRA[id], ...NEW[id], ...(TYPED[id] || [])].map(norm))])),
);

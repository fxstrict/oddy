import { o, Q } from '../qhelpers.js';

export default [
  Q('s11', 1, 'كم عدد كواكب المجموعة الشمسية؟', 'How many planets are in the Solar System?', [o('7'), o('8'), o('9'), o('10')], 1),
  Q('s12', 1, 'أي عضو يضخ الدم في الجسم؟', 'Which organ pumps blood around the body?', [o('الرئتان', 'Lungs'), o('القلب', 'Heart'), o('المعدة', 'Stomach'), o('الكبد', 'Liver')], 1),
  Q('s13', 1, 'ماذا يتكوّن عندما يتجمد الماء؟', 'What forms when water freezes?', [o('بخار', 'Steam'), o('جليد', 'Ice'), o('سحاب', 'Cloud'), o('مطر', 'Rain')], 1),
  Q('s14', 1, 'أي كوكب يُعرف بالكوكب الأحمر؟', 'Which planet is known as the Red Planet?', [o('المشتري', 'Jupiter'), o('زحل', 'Saturn'), o('المريخ', 'Mars'), o('الزهرة', 'Venus')], 2),
  Q('s15', 1, 'بأي عضو نشمّ الروائح؟', 'Which organ do we use to smell?', [o('الأذن', 'Ear'), o('الأنف', 'Nose'), o('العين', 'Eye'), o('اللسان', 'Tongue')], 1),
  Q('s16', 2, 'ما الصيغة الكيميائية للماء؟', 'What is the chemical formula of water?', [o('CO₂'), o('H₂O'), o('O₂'), o('NaCl')], 1),
  Q('s17', 2, 'ما أكبر كوكب في المجموعة الشمسية؟', 'What is the largest planet in the Solar System?', [o('زحل', 'Saturn'), o('المشتري', 'Jupiter'), o('نبتون', 'Neptune'), o('الأرض', 'Earth')], 1),
  Q('s18', 2, 'أي عظمة تحمي الدماغ؟', 'Which bone protects the brain?', [o('الأضلاع', 'Ribs'), o('الجمجمة', 'Skull'), o('العمود الفقري', 'Spine'), o('الحوض', 'Pelvis')], 1),
  Q('s19', 2, 'ما اسم تحوّل الماء السائل إلى بخار؟', 'What is it called when liquid water turns into vapour?', [o('التكاثف', 'Condensation'), o('التبخر', 'Evaporation'), o('التجمد', 'Freezing'), o('الانصهار', 'Melting')], 1),
  Q('s20', 2, 'كم عدد عظام جسم الإنسان البالغ تقريباً؟', 'Roughly how many bones does an adult human have?', [o('106'), o('206'), o('306'), o('406')], 1),
];

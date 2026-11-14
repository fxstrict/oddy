import { o, Q } from '../qhelpers.js';

export default [
  Q('h11', 1, 'ما عاصمة المملكة العربية السعودية؟', 'What is the capital of Saudi Arabia?', [o('جدة', 'Jeddah'), o('الرياض', 'Riyadh'), o('مكة المكرمة', 'Mecca'), o('الدمام', 'Dammam')], 1),
  Q('h12', 1, 'أي بحر يقع شمال مصر؟', 'Which sea lies north of Egypt?', [o('البحر الأحمر', 'Red Sea'), o('البحر المتوسط', 'Mediterranean Sea'), o('البحر الأسود', 'Black Sea'), o('بحر العرب', 'Arabian Sea')], 1),
  Q('h13', 1, 'ما أكبر قارات العالم مساحةً؟', 'Which is the largest continent by area?', [o('أفريقيا', 'Africa'), o('آسيا', 'Asia'), o('أوروبا', 'Europe'), o('أمريكا الشمالية', 'North America')], 1),
  Q('h14', 1, 'ما عاصمة فرنسا؟', 'What is the capital of France?', [o('لندن', 'London'), o('مدريد', 'Madrid'), o('باريس', 'Paris'), o('روما', 'Rome')], 2),
  Q('h15', 1, 'في أي محافظة يقع تمثال أبو الهول؟', 'Where is the Great Sphinx located?', [o('الأقصر', 'Luxor'), o('الجيزة', 'Giza'), o('أسوان', 'Aswan'), o('الإسكندرية', 'Alexandria')], 1),
  Q('h16', 2, 'لأي فرعون بُني الهرم الأكبر في الجيزة؟', 'For which pharaoh was the Great Pyramid of Giza built?', [o('خوفو', 'Khufu'), o('خفرع', 'Khafre'), o('منكاورع', 'Menkaure'), o('زوسر', 'Djoser')], 0),
  Q('h17', 2, 'في أي عام افتُتحت قناة السويس للملاحة؟', 'In which year did the Suez Canal open to ships?', [o('1805'), o('1869'), o('1914'), o('1952')], 1),
  Q('h18', 2, 'ما أكبر صحراء حارة في العالم؟', 'What is the largest hot desert in the world?', [o('الربع الخالي', 'Rub al Khali'), o('الصحراء الكبرى', 'The Sahara'), o('صحراء غوبي', 'Gobi'), o('كالاهاري', 'Kalahari')], 1),
  Q('h19', 2, 'من القائد المصري الذي طرد الهكسوس؟', 'Which Egyptian king drove out the Hyksos?', [o('أحمس الأول', 'Ahmose I'), o('رمسيس الثالث', 'Ramses III'), o('توت عنخ آمون', 'Tutankhamun'), o('أمنحتب الثالث', 'Amenhotep III')], 0),
  Q('h20', 2, 'ما عاصمة دولة الإمارات العربية المتحدة؟', 'What is the capital of the United Arab Emirates?', [o('دبي', 'Dubai'), o('أبوظبي', 'Abu Dhabi'), o('الشارقة', 'Sharjah'), o('العين', 'Al Ain')], 1),
];

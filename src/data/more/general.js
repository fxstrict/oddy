import { o, Q } from '../qhelpers.js';

export default [
  Q('g11', 1, 'كم ساعة في اليوم الواحد؟', 'How many hours are in one day?', [o('12'), o('24'), o('20'), o('60')], 1),
  Q('g12', 1, 'ما لون السماء في يوم صافٍ؟', 'What colour is the sky on a clear day?', [o('أخضر', 'Green'), o('أزرق', 'Blue'), o('أحمر', 'Red'), o('أصفر', 'Yellow')], 1),
  Q('g13', 1, 'أي حيوان يعطينا الحليب؟', 'Which animal gives us milk?', [o('الأسد', 'Lion'), o('البقرة', 'Cow'), o('الذئب', 'Wolf'), o('النسر', 'Eagle')], 1),
  Q('g14', 1, 'كم عدد أصابع اليد الواحدة؟', 'How many fingers are on one hand (thumb included)?', [o('4'), o('5'), o('6'), o('10')], 1),
  Q('g15', 1, 'في أي فصل تتساقط أوراق الأشجار عادةً؟', 'In which season do leaves usually fall from trees?', [o('الصيف', 'Summer'), o('الخريف', 'Autumn'), o('الربيع', 'Spring'), o('الشتاء', 'Winter')], 1),
  Q('g16', 2, 'ما أكبر دولة في العالم مساحةً؟', 'Which is the largest country in the world by area?', [o('الصين', 'China'), o('كندا', 'Canada'), o('روسيا', 'Russia'), o('الولايات المتحدة', 'United States')], 2),
  Q('g17', 2, 'كم لاعباً في فريق كرة القدم داخل الملعب؟', 'How many players does a football team have on the pitch?', [o('9'), o('10'), o('11'), o('12')], 2),
  Q('g18', 2, 'كم عدد حروف اللغة العربية؟', 'How many letters are in the Arabic alphabet?', [o('26'), o('28'), o('30'), o('29')], 1),
  Q('g19', 2, 'ما اللون الناتج من خلط الأزرق والأصفر؟', 'Which colour do you get by mixing blue and yellow?', [o('برتقالي', 'Orange'), o('أخضر', 'Green'), o('بنفسجي', 'Purple'), o('بني', 'Brown')], 1),
  Q('g20', 2, 'ما أعلى جبل في العالم فوق مستوى سطح البحر؟', 'What is the highest mountain above sea level?', [o('كليمنجارو', 'Kilimanjaro'), o('إفرست', 'Everest'), o('مونت بلان', 'Mont Blanc'), o('فوجي', 'Fuji')], 1),
];

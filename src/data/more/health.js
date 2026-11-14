import { o, Q } from '../qhelpers.js';

export default [
  Q('hl1', 1, 'كم مرة يُنصح بتنظيف الأسنان يومياً؟', 'How often should you brush your teeth each day?', [o('مرتين على الأقل', 'At least twice'), o('مرة كل شهر', 'Once a month'), o('لا حاجة لذلك', 'No need'), o('مرة في السنة', 'Once a year')], 0),
  Q('hl2', 1, 'أي مما يلي فاكهة؟', 'Which of these is a fruit?', [o('البطاطس', 'Potato'), o('التفاح', 'Apple'), o('البصل', 'Onion'), o('السبانخ', 'Spinach')], 1),
  Q('hl3', 1, 'ماذا يجب أن نفعل قبل الأكل؟', 'What should we do before eating?', [o('غسل اليدين', 'Wash our hands'), o('الركض', 'Run around'), o('اللعب بالتراب', 'Play in the dirt'), o('النوم', 'Sleep')], 0),
  Q('hl4', 1, 'أي مشروب هو الأفضل لجسمك كل يوم؟', 'Which drink is best for your body every day?', [o('الماء', 'Water'), o('المشروبات الغازية', 'Soda'), o('المشروبات المحلّاة', 'Sweet drinks'), o('مشروبات الطاقة', 'Energy drinks')], 0),
  Q('hl5', 1, 'كم ساعة نوم يحتاجها طفل في سن المدرسة تقريباً؟', 'About how much sleep does a school-age child need?', [o('3 ساعات', '3 hours'), o('5 ساعات', '5 hours'), o('9 إلى 11 ساعة', '9 to 11 hours'), o('15 ساعة', '15 hours')], 2),
  Q('hl6', 1, 'أي عضو نستخدمه للرؤية؟', 'Which organ do we use to see?', [o('الأذن', 'Ear'), o('العين', 'Eye'), o('الأنف', 'Nose'), o('اللسان', 'Tongue')], 1),
  Q('hl7', 1, 'أي عضو نفكر به ونتذكر به؟', 'Which organ do we think and remember with?', [o('القلب', 'Heart'), o('الدماغ', 'Brain'), o('المعدة', 'Stomach'), o('الكلية', 'Kidney')], 1),
  Q('hl8', 1, 'ما الذي يعطينا الطاقة للعب والحركة؟', 'What gives us energy to play and move?', [o('الطعام الصحي', 'Healthy food'), o('الصراخ', 'Shouting'), o('الظلام', 'Darkness'), o('الضوضاء', 'Noise')], 0),
  Q('hl9', 1, 'أي نشاط يقوّي الجسم؟', 'Which activity makes the body stronger?', [o('الجلوس الطويل أمام الشاشة', 'Sitting long in front of a screen'), o('ممارسة الرياضة', 'Doing sports'), o('السهر', 'Staying up late'), o('ترك الطعام', 'Skipping meals')], 1),
  Q('hl10', 1, 'كم عدد الحواس الأساسية عند الإنسان؟', 'How many main senses do humans have?', [o('3'), o('4'), o('5'), o('6')], 2),
  Q('hl11', 2, 'أي فيتامين يصنعه الجسم عند التعرض لأشعة الشمس؟', 'Which vitamin does the body make with sunlight?', [o('فيتامين A', 'Vitamin A'), o('فيتامين D', 'Vitamin D'), o('فيتامين C', 'Vitamin C'), o('فيتامين B12', 'Vitamin B12')], 1),
  Q('hl12', 2, 'أي غذاء غني بالكالسيوم لعظام قوية؟', 'Which food is rich in calcium for strong bones?', [o('الحليب ومشتقاته', 'Milk and dairy'), o('الحلوى', 'Candy'), o('المقرمشات', 'Chips'), o('المشروبات الغازية', 'Soda')], 0),
  Q('hl13', 2, 'أي عضو يتبادل الأكسجين مع الدم أثناء التنفس؟', 'Which organ exchanges oxygen with the blood when we breathe?', [o('الكلية', 'Kidney'), o('الرئتان', 'Lungs'), o('الكبد', 'Liver'), o('المعدة', 'Stomach')], 1),
  Q('hl14', 2, 'كم عدد الأسنان اللبنية الكاملة عند الطفل؟', 'How many baby teeth does a child have in total?', [o('16'), o('20'), o('28'), o('32')], 1),
  Q('hl15', 2, 'أي فيتامين يوجد بكثرة في البرتقال؟', 'Which vitamin is plentiful in oranges?', [o('فيتامين A', 'Vitamin A'), o('فيتامين B12', 'Vitamin B12'), o('فيتامين C', 'Vitamin C'), o('فيتامين K', 'Vitamin K')], 2),
  Q('hl16', 2, 'أي عنصر غذائي يساعد على بناء العضلات؟', 'Which nutrient helps build muscles?', [o('البروتين', 'Protein'), o('السكر فقط', 'Sugar only'), o('الدهون فقط', 'Fat only'), o('الملح', 'Salt')], 0),
  Q('hl17', 2, 'أي خلايا في الدم تحمل الأكسجين؟', 'Which blood cells carry oxygen?', [o('الحمراء', 'Red blood cells'), o('البيضاء', 'White blood cells'), o('الصفائح الدموية', 'Platelets'), o('الأوتار', 'Tendons')], 0),
  Q('hl18', 2, 'أي مما يلي أفضل وجبة خفيفة؟', 'Which is the healthiest snack?', [o('الشيبس', 'Chips'), o('الحلويات', 'Sweets'), o('الفواكه', 'Fruit'), o('المشروبات الغازية', 'Soda')], 2),
  Q('hl19', 2, 'ما أكبر عضو في جسم الإنسان؟', 'What is the largest organ of the human body?', [o('الكبد', 'Liver'), o('الجلد', 'Skin'), o('الرئتان', 'Lungs'), o('الدماغ', 'Brain')], 1),
  Q('hl20', 2, 'كم عدد حجرات القلب؟', 'How many chambers does the human heart have?', [o('2'), o('3'), o('4'), o('6')], 2),
];

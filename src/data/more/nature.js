import { o, Q } from '../qhelpers.js';

export default [
  Q('n1', 1, 'أي حيوان يُلقَّب بـ«ملك الغابة»؟', 'Which animal is called the "king of the jungle"?', [o('النمر', 'Tiger'), o('الأسد', 'Lion'), o('الفيل', 'Elephant'), o('الذئب', 'Wolf')], 1),
  Q('n2', 1, 'أي حيوان يعيش في الماء ويتنفس بالخياشيم؟', 'Which animal lives in water and breathes with gills?', [o('القطة', 'Cat'), o('السمكة', 'Fish'), o('البقرة', 'Cow'), o('العصفور', 'Sparrow')], 1),
  Q('n3', 1, 'ماذا تنتج النحلة؟', 'What do bees make?', [o('الحليب', 'Milk'), o('العسل', 'Honey'), o('الحرير', 'Silk'), o('الزيت', 'Oil')], 1),
  Q('n4', 1, 'أي جزء من النبات يمتص الماء من التربة؟', 'Which part of a plant absorbs water from the soil?', [o('الورقة', 'Leaf'), o('الجذر', 'Root'), o('الزهرة', 'Flower'), o('الثمرة', 'Fruit')], 1),
  Q('n5', 1, 'أي طائر يستطيع تقليد كلام البشر؟', 'Which bird can imitate human speech?', [o('الببغاء', 'Parrot'), o('النسر', 'Eagle'), o('البطريق', 'Penguin'), o('اللقلق', 'Stork')], 0),
  Q('n6', 1, 'أي حيوان له خرطوم طويل؟', 'Which animal has a long trunk?', [o('الحصان', 'Horse'), o('الفيل', 'Elephant'), o('الدب', 'Bear'), o('الغزال', 'Deer')], 1),
  Q('n7', 1, 'من أي حيوان نحصل على الصوف؟', 'Which animal gives us wool?', [o('البقرة', 'Cow'), o('الخروف', 'Sheep'), o('الدجاجة', 'Hen'), o('السمكة', 'Fish')], 1),
  Q('n8', 1, 'ماذا تحتاج النباتات لتنمو؟', 'What do plants need to grow?', [o('الماء وضوء الشمس', 'Water and sunlight'), o('الحلوى', 'Sweets'), o('البلاستيك', 'Plastic'), o('الظلام فقط', 'Only darkness')], 0),
  Q('n9', 1, 'أي حيوان يحمل صغاره في كيس على بطنه؟', 'Which animal carries its baby in a pouch?', [o('الأرنب', 'Rabbit'), o('الكنغر', 'Kangaroo'), o('الدب', 'Bear'), o('الذئب', 'Wolf')], 1),
  Q('n10', 1, 'كم عدد أرجل العنكبوت؟', 'How many legs does a spider have?', [o('6'), o('8'), o('10'), o('4')], 1),
  Q('n11', 2, 'ما اسم صغير الضفدع؟', 'What is a baby frog called?', [o('شرغوف', 'Tadpole'), o('جرو', 'Puppy'), o('فرخ', 'Chick'), o('مهر', 'Foal')], 0),
  Q('n12', 2, 'ما اسم عملية صنع النبات لغذائه بمساعدة الضوء؟', 'What is the process by which plants make food using light?', [o('التنفس', 'Respiration'), o('البناء الضوئي', 'Photosynthesis'), o('الهضم', 'Digestion'), o('التبخر', 'Evaporation')], 1),
  Q('n13', 2, 'أي مما يلي حيوان عاشب؟', 'Which of these is a herbivore?', [o('الذئب', 'Wolf'), o('البقرة', 'Cow'), o('الأسد', 'Lion'), o('النمر', 'Tiger')], 1),
  Q('n14', 2, 'ما أكبر طائر في العالم؟', 'What is the largest bird in the world?', [o('النسر', 'Eagle'), o('النعامة', 'Ostrich'), o('البجعة', 'Swan'), o('الببغاء', 'Parrot')], 1),
  Q('n15', 2, 'في أي بيئة يعيش الجمل؟', 'In which environment does the camel live?', [o('القطب الشمالي', 'The Arctic'), o('الصحراء', 'The desert'), o('الغابة المطيرة', 'The rainforest'), o('المحيط', 'The ocean')], 1),
  Q('n16', 2, 'ما الحيوان الأطول رقبة؟', 'Which animal has the longest neck?', [o('الفيل', 'Elephant'), o('الزرافة', 'Giraffe'), o('الجمل', 'Camel'), o('الحصان', 'Horse')], 1),
  Q('n17', 2, 'ما الغاز الذي تُطلقه النباتات أثناء البناء الضوئي؟', 'Which gas do plants release during photosynthesis?', [o('الأكسجين', 'Oxygen'), o('ثاني أكسيد الكربون', 'Carbon dioxide'), o('النيتروجين', 'Nitrogen'), o('الميثان', 'Methane')], 0),
  Q('n18', 2, 'أي مما يلي من الزواحف؟', 'Which of these is a reptile?', [o('الضفدع', 'Frog'), o('التمساح', 'Crocodile'), o('الدلفين', 'Dolphin'), o('الخفاش', 'Bat')], 1),
  Q('n19', 2, 'أي ثدييٍّ يستطيع الطيران حقاً (لا الانزلاق فقط)؟', 'Which mammal can truly fly (not just glide)?', [o('السنجاب الطائر', 'Flying squirrel'), o('الخفاش', 'Bat'), o('الدلفين', 'Dolphin'), o('الكنغر', 'Kangaroo')], 1),
  Q('n20', 2, 'كم قلباً لدى الأخطبوط؟', 'How many hearts does an octopus have?', [o('1'), o('2'), o('3'), o('4')], 2),
];

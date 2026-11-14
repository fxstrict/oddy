import { o, Q } from '../qhelpers.js';

export default [
  Q('l11', 1, 'ما معنى الكلمة الإنجليزية «Book»؟', 'What does the Arabic word «كتاب» mean?', [o('كتاب', 'Book'), o('قلم', 'Pen'), o('باب', 'Door'), o('نافذة', 'Window')], 0),
  Q('l12', 1, 'ما معنى الكلمة الإنجليزية «Cat»؟', 'What does the Arabic word «قطة» mean?', [o('قطة', 'Cat'), o('كلب', 'Dog'), o('أرنب', 'Rabbit'), o('حصان', 'Horse')], 0),
  Q('l13', 1, 'ما معنى الكلمة الإنجليزية «Blue»؟', 'What does the Arabic word «أزرق» mean?', [o('أخضر', 'Green'), o('أزرق', 'Blue'), o('أبيض', 'White'), o('أسود', 'Black')], 1),
  Q('l14', 1, 'ما معنى الكلمة الإنجليزية «Teacher»؟', 'What does the Arabic word «معلمة» mean?', [o('طالب', 'Student'), o('معلمة', 'Teacher'), o('طبيب', 'Doctor'), o('مهندس', 'Engineer')], 1),
  Q('l15', 1, 'ما معنى الكلمة الإنجليزية «School»؟', 'What does the Arabic word «مدرسة» mean?', [o('مدرسة', 'School'), o('مستشفى', 'Hospital'), o('سوق', 'Market'), o('حديقة', 'Garden')], 0),
  Q('l16', 2, 'ما جمع كلمة «قلم»؟', 'What is the plural of "mouse" (the animal)?', [o('أقلام', 'Mice'), o('قلمات', 'Mouses'), o('قلمون', 'Mousen'), o('أقلم', 'Meese')], 0),
  Q('l17', 2, 'ما عكس كلمة «سريع»؟', 'What is the opposite of "fast"?', [o('بطيء', 'Slow'), o('عاجل', 'Quick'), o('قوي', 'Strong'), o('خفيف', 'Light')], 0),
  Q('l18', 2, 'أي كلمة مما يلي فعل؟', 'Which of these words is a verb?', [o('يكتب', 'Run'), o('كتاب', 'Table'), o('مكتبة', 'Happy'), o('كاتب', 'Quickly')], 0),
  Q('l19', 2, 'ما معنى الكلمة الإنجليزية «Friend»؟', 'What does the Arabic word «صديق» mean?', [o('عدو', 'Enemy'), o('صديق', 'Friend'), o('جار', 'Neighbour'), o('أخ', 'Brother')], 1),
  Q('l20', 2, 'ما مؤنث كلمة «طالب»؟', 'Choose the correct word: "She ___ a student."', [o('طالبة', 'is'), o('طالبات', 'are'), o('طلاب', 'am'), o('طالبان', 'be')], 0),
];

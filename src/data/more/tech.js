import { o, Q } from '../qhelpers.js';

export default [
  Q('tc1', 1, 'أي جهاز نستخدمه لكتابة النصوص على الحاسوب؟', 'Which device do we use to type text on a computer?', [o('الفأرة', 'Mouse'), o('لوحة المفاتيح', 'Keyboard'), o('الطابعة', 'Printer'), o('الشاشة', 'Monitor')], 1),
  Q('tc2', 1, 'أي جهاز نحرّكه لنؤشر على الشاشة؟', 'Which device do we move to point at things on the screen?', [o('الفأرة', 'Mouse'), o('السماعة', 'Speaker'), o('الطابعة', 'Printer'), o('الكاميرا', 'Camera')], 0),
  Q('tc3', 1, 'أي جهاز يطبع المستندات على الورق؟', 'Which device prints documents on paper?', [o('الماسح الضوئي', 'Scanner'), o('الطابعة', 'Printer'), o('الشاشة', 'Monitor'), o('الميكروفون', 'Microphone')], 1),
  Q('tc4', 1, 'أي مما يلي متصفح إنترنت؟', 'Which of these is a web browser?', [o('Chrome'), o('Word'), o('Excel'), o('Paint')], 0),
  Q('tc5', 1, 'أي جهاز نسمع به الصوت من الحاسوب؟', 'Which device lets us hear sound from a computer?', [o('الميكروفون', 'Microphone'), o('السماعات', 'Speakers'), o('الفأرة', 'Mouse'), o('الطابعة', 'Printer')], 1),
  Q('tc6', 1, 'ما الذي نحتاجه لتصفح الإنترنت؟', 'What do we need to browse the internet?', [o('اتصال بالإنترنت', 'An internet connection'), o('طابعة', 'A printer'), o('ماسح ضوئي', 'A scanner'), o('قلم ضوئي', 'A light pen')], 0),
  Q('tc7', 1, 'أي زر نضغطه للانتقال إلى سطر جديد؟', 'Which key moves the cursor to a new line?', [o('Enter'), o('Shift'), o('Ctrl'), o('Esc')], 0),
  Q('tc8', 1, 'أي شركة تصنع هواتف آيفون؟', 'Which company makes the iPhone?', [o('سامسونج', 'Samsung'), o('آبل', 'Apple'), o('هواوي', 'Huawei'), o('نوكيا', 'Nokia')], 1),
  Q('tc9', 1, 'أي جزء في الحاسوب يخزّن ملفاتنا وصورنا؟', 'Which part of a computer stores our files and photos?', [o('القرص الصلب', 'Hard drive'), o('الشاشة', 'Monitor'), o('السماعة', 'Speaker'), o('لوحة المفاتيح', 'Keyboard')], 0),
  Q('tc10', 1, 'أي مما يلي وحدة تخزين محمولة؟', 'Which of these is a portable storage device?', [o('فلاش USB', 'USB flash drive'), o('كابل الطاقة', 'Power cable'), o('الفأرة', 'Mouse'), o('مكبر الصوت', 'Speaker')], 0),
  Q('tc11', 2, 'ماذا يفعل الاختصار Ctrl + C؟', 'What does the shortcut Ctrl + C do?', [o('قص', 'Cut'), o('نسخ', 'Copy'), o('لصق', 'Paste'), o('حذف', 'Delete')], 1),
  Q('tc12', 2, 'ماذا يفعل الاختصار Ctrl + V؟', 'What does the shortcut Ctrl + V do?', [o('قص', 'Cut'), o('نسخ', 'Copy'), o('لصق', 'Paste'), o('حفظ', 'Save')], 2),
  Q('tc13', 2, 'ما «دماغ» الحاسوب الذي ينفّذ التعليمات؟', 'Which part is the "brain" of the computer that runs instructions?', [o('المعالج (CPU)', 'Processor (CPU)'), o('مزوّد الطاقة', 'Power supply'), o('الشاشة', 'Monitor'), o('الفأرة', 'Mouse')], 0),
  Q('tc14', 2, 'أي لغة تُستخدم لبناء هيكل صفحات الويب؟', 'Which language structures web pages?', [o('HTML'), o('MP3'), o('JPEG'), o('PDF')], 0),
  Q('tc15', 2, 'كم بتّاً في البايت الواحد؟', 'How many bits are in one byte?', [o('4'), o('8'), o('16'), o('10')], 1),
  Q('tc16', 2, 'ماذا يعني الاختصار USB؟', 'What does USB stand for?', [o('Universal Serial Bus'), o('United System Base'), o('Unique Software Block'), o('Universal Storage Box')], 0),
  Q('tc17', 2, 'أي امتداد ملف يخص الصور؟', 'Which file extension belongs to an image?', [o('.jpg'), o('.mp3'), o('.docx'), o('.xlsx')], 0),
  Q('tc18', 2, 'أي وحدة تخزين هي الأكبر؟', 'Which storage unit is the largest?', [o('بايت', 'Byte'), o('كيلوبايت', 'Kilobyte'), o('جيجابايت', 'Gigabyte'), o('ميجابايت', 'Megabyte')], 2),
  Q('tc19', 2, 'ما أفضل طريقة لحماية حسابك؟', 'What is the best way to protect your account?', [o('كلمة مرور قوية وفريدة', 'A strong, unique password'), o('مشاركة كلمة المرور مع الأصدقاء', 'Sharing your password with friends'), o('استخدام 123456', 'Using 123456'), o('كتابتها على الشاشة', 'Writing it on the screen')], 0),
  Q('tc20', 2, 'ماذا يعني الاختصار PDF؟', 'What does PDF stand for?', [o('Portable Document Format'), o('Personal Data File'), o('Printed Digital Form'), o('Public Document Folder')], 0),
];

// «هل تعلم؟» / "Did you know?" — shown on the result screen. Keep each fact short and well established.
const f = (ar, en) => ({ ar, en });

export const FACTS = Object.freeze({
  math: [
    f('كلمة «صفر» العربية هي أصل كلمة Zero الإنجليزية، ومعناها «الفراغ».', 'The English word "zero" comes from the Arabic word «صفر» (sifr), meaning "empty".'),
    f('مجموع زوايا أي مثلث على سطح مستوٍ هو دائماً 180 درجة.', 'The angles of any triangle on a flat surface always add up to 180 degrees.'),
    f('العدد 2 هو العدد الأولي الزوجي الوحيد.', 'The number 2 is the only even prime number.'),
    f('كلمة «خوارزمية» (Algorithm) جاءت من اسم العالم الخوارزمي الذي عاش في القرن التاسع الميلادي.', 'The word "algorithm" comes from the name of al-Khwarizmi, a scholar of the 9th century.'),
    f('111,111,111 × 111,111,111 = 12,345,678,987,654,321 — ناتج جميل ومرتّب!', '111,111,111 × 111,111,111 = 12,345,678,987,654,321 — a neat pattern!'),
  ],
  history: [
    f('بُني الهرم الأكبر قبل أكثر من 4500 سنة.', 'The Great Pyramid was built more than 4,500 years ago.'),
    f('صنع المصريون القدماء «الورق» من نبات البردي.', 'The ancient Egyptians made paper-like sheets from the papyrus plant.'),
    f('تُعدّ جامعة القرويين في فاس، التي أسستها فاطمة الفهرية عام 859م، من أقدم الجامعات العاملة في العالم.', 'The University of al-Qarawiyyin in Fez, founded by Fatima al-Fihri in 859 CE, is one of the oldest universities still working.'),
    f('قناة السويس تختصر على السفن رحلة الدوران حول قارة أفريقيا.', 'The Suez Canal saves ships from sailing all the way around Africa.'),
    f('مساحة الصحراء الكبرى قريبة من مساحة الولايات المتحدة كلها.', 'The Sahara is nearly as large as the whole United States.'),
  ],
  science: [
    f('يحتاج ضوء الشمس إلى نحو 8 دقائق ليصل إلى الأرض.', 'Sunlight takes about 8 minutes to reach Earth.'),
    f('نسمع الرعد بعد رؤية البرق لأن الضوء أسرع من الصوت.', 'We hear thunder after seeing lightning because light travels faster than sound.'),
    f('الزهرة أحرّ كواكب المجموعة الشمسية رغم أن عطارد أقرب إلى الشمس.', 'Venus is the hottest planet even though Mercury is closer to the Sun.'),
    f('اليوم الواحد على الزهرة أطول من سنتها كاملة.', 'One day on Venus is longer than its whole year.'),
    f('الماء يشكّل ما بين نصف جسم الإنسان البالغ وثلثيه تقريباً.', 'Water makes up roughly half to two thirds of an adult human body.'),
  ],
  languages: [
    f('العربية إحدى اللغات الرسمية الست في الأمم المتحدة.', 'Arabic is one of the six official languages of the United Nations.'),
    f('يوم اللغة العربية العالمي هو 18 ديسمبر من كل عام.', 'World Arabic Language Day is on 18 December every year.'),
    f('كلمات مثل «سكر» و«قهوة» و«جبر» انتقلت من العربية إلى لغات أوروبية (sugar, coffee, algebra).', 'Words like sugar, coffee and algebra came into European languages from Arabic («سكر»، «قهوة»، «جبر»).'),
    f('تُكتب العربية من اليمين إلى اليسار، وكذلك العبرية والفارسية.', 'Arabic is written right to left, and so are Hebrew and Persian.'),
    f('في العالم نحو 7000 لغة، ويتحدث بعضها أقل من ألف شخص.', 'There are about 7,000 languages in the world, and some are spoken by fewer than a thousand people.'),
  ],
  general: [
    f('في العالم نحو 195 دولة.', 'There are about 195 countries in the world.'),
    f('يصل ارتفاع قمة إفرست إلى نحو 8849 متراً.', 'The summit of Mount Everest is about 8,849 metres high.'),
    f('الفهد يستطيع الجري بسرعة تتجاوز 90 كم/ساعة لمسافات قصيرة.', 'A cheetah can sprint faster than 90 km/h over short distances.'),
    f('لا يفسد العسل بسهولة إذا حُفظ جيداً، لأن فيه ماءً قليلاً وحموضة.', 'Honey hardly spoils when stored well, because it has little water and is slightly acidic.'),
    f('الحوت الأزرق أكبر حيوان عرفته الأرض على الإطلاق.', 'The blue whale is the largest animal known to have ever lived.'),
  ],
  tech: [
    f('الإنترنت هو الشبكة، أما الويب فخدمة تعمل عليها، وليسا الشيء نفسه.', 'The internet is the network; the web is a service that runs on it. They are not the same thing.'),
    f('أُرسل أول بريد إلكتروني بين حاسوبين عام 1971.', 'The first email between two computers was sent in 1971.'),
    f('كلمة «بت» (bit) اختصار لعبارة binary digit أي «رقم ثنائي».', 'The word "bit" is short for "binary digit".'),
    f('الحاسوب يخزّن كل شيء — حتى الصور والأغاني — بالصفر والواحد.', 'A computer stores everything, even photos and songs, as zeros and ones.'),
    f('كلمة «روبوت» أصلها من كلمة تشيكية تعني «العمل الشاق».', 'The word "robot" comes from a Czech word meaning "hard work".'),
  ],
  nature: [
    f('الدلفين من الثدييات وليس سمكة؛ يتنفس الهواء ويرضع صغاره.', 'A dolphin is a mammal, not a fish: it breathes air and feeds its young milk.'),
    f('للزرافة سبع فقرات في رقبتها، مثل الإنسان تماماً، لكنها أطول بكثير.', 'A giraffe has seven neck bones, just like a human, but much longer ones.'),
    f('الجمل يخزّن الدهون في سنامه لا الماء.', 'A camel stores fat in its hump, not water.'),
    f('للفراشات مستقبلات تذوّق في أقدامها.', 'Butterflies can taste with their feet.'),
    f('يحمل النمل أشياء تزن أضعاف وزن جسمه.', 'Ants can carry things many times heavier than their own bodies.'),
  ],
  health: [
    f('قلب الإنسان يدق نحو مئة ألف مرة في اليوم.', 'The human heart beats about 100,000 times a day.'),
    f('أصغر عظمة في الجسم (الركاب) موجودة داخل الأذن.', 'The smallest bone in the body (the stapes) is inside the ear.'),
    f('الجلد يتجدد طوال حياتنا طبقةً بعد طبقة.', 'Our skin renews itself layer by layer throughout life.'),
    f('النوم الكافي يساعد الدماغ على ترتيب ما تعلمناه خلال اليوم.', 'Enough sleep helps the brain sort out what we learned during the day.'),
    f('غسل اليدين بالماء والصابون من أبسط وأقوى طرق الوقاية من الأمراض.', 'Washing hands with soap and water is one of the simplest and strongest ways to prevent illness.'),
  ],
});

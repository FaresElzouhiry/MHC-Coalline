/* M.H.C website content: every text in Arabic (a) and English (e), shared by all the design models.
   Edit the text here and every model updates.
   DRAFT marks anything that did not come from the company's papers and needs the company's review before going live. */
window.MHC = {
  company: {
    name: { a: 'شركة M.H.C للتصنيع والتصدير', e: 'M.H.C for Manufacturing & Export' },
    short: { a: 'للتصنيع والتصدير', e: 'Manufacturing & Export' },
    brand: 'MHC Coalline',
    legal: {
      a: 'مؤسسة محمد حسين للتوريدات وتوزيع الفحم · السمة التجارية M.H.C · سجل تجاري 69764 الإسكندرية',
      e: 'Mohamed Hussein Est. for Supplies & Coal Distribution · Trade name M.H.C · C.R. 69764 Alexandria'
    },
    email: 'info@mhc-coal.com',
    // Change to the number that really answers WhatsApp (international format, digits only)
    whatsapp: '201220473987',
    phones: [
      { d: '+20 3 483 8210', tel: '+2034838210', k: { a: 'مكتب الإسكندرية', e: 'Alexandria Office' } },
      { d: '+20 122 047 3987', tel: '+201220473987', k: { a: 'موبايل', e: 'Mobile' } },
      { d: '+20 122 047 5957', tel: '+201220475957', k: { a: 'موبايل', e: 'Mobile' } }
    ],
    // Quote form: leave empty to send through WhatsApp. To receive it by email use e.g. 'https://formsubmit.co/ajax/YOUR@EMAIL'
    formEndpoint: '',
    addresses: [
      {
        id: 'factory',
        k: { a: 'المصنع', e: 'Factory' },
        v: { a: 'رقم 4، بلوك 14، جنوب المنطقة الصناعية الثالثة، مدينة برج العرب الجديدة، الإسكندرية', e: 'No. 4, Block 14, South of the Third Industrial Zone, New Borg El Arab City, Alexandria' },
        map: 'https://www.google.com/maps/search/?api=1&query=New+Borg+El+Arab+Third+Industrial+Zone+Alexandria+Egypt'
      },
      {
        id: 'alex',
        k: { a: 'مكتب الإسكندرية', e: 'Alexandria Office' },
        v: { a: '20 شارع صلاح سالم، الدور الخامس، شقة 10، الإسكندرية', e: '20 Salah Salem St., 5th Floor, Apt. 10, Alexandria' },
        map: 'https://www.google.com/maps/search/?api=1&query=20+Salah+Salem+Street+Alexandria+Egypt'
      },
      {
        id: 'cairo',
        k: { a: 'مكتب القاهرة', e: 'Cairo Office' },
        v: { a: '13 شارع أحمد أمين، متفرع من شارع التحرير، الدقي، الجيزة', e: '13 Ahmed Amin St., off Tahrir St., Dokki, Giza' },
        map: 'https://www.google.com/maps/search/?api=1&query=Ahmed+Amin+Street+Tahrir+Street+Dokki+Giza+Egypt'
      }
    ]
  },

  nav: [
    { id: 'about', t: { a: 'من نحن', e: 'About' } },
    { id: 'products', t: { a: 'المنتجات', e: 'Products' } },
    { id: 'process', t: { a: 'خط الإنتاج', e: 'Process' } },
    { id: 'export', t: { a: 'التصدير', e: 'Export' } },
    { id: 'label', t: { a: 'علامتك الخاصة', e: 'Private Label' } },
    { id: 'trust', t: { a: 'الاعتمادات', e: 'Credentials' } },
    { id: 'contact', t: { a: 'تواصل معنا', e: 'Contact' } }
  ],

  // The six design models (the gallery page and each model's own opening line)
  models: [
    {
      id: 1, name: { a: 'الجمرة', e: 'The Ember' },
      hero: { a: 'من قلب النار،<br>طاقة تعبر القارات', e: 'Forged In Fire.<br>Built To Travel.' },
      idea: { a: 'قطعة فحم واقعية جدًا تملأ الشاشة. تسخن مع السكرول وتتوهج شقوقها بالذهبي، ثم تنفجر شظايا فتكشف قلبها المنصهر ومواصفاتها.', e: 'One hyper-real piece of charcoal fills the screen. It heats up as you scroll, its cracks glow gold, then it bursts apart to reveal its molten core and its specs.' },
      tags: [{ a: 'واقعية سينمائية', e: 'Cinematic Realism' }, { a: 'تتفتت وتتجمع', e: 'Shatters & Reforms' }, { a: 'الأفخم', e: 'Most Premium' }]
    },
    {
      id: 2, name: { a: 'خط الفحم', e: 'The Coalline' },
      hero: { a: 'خط واحد،<br>من الخشب إلى الحاوية', e: 'One Line,<br>From Timber To Container' },
      idea: { a: 'مصنع كامل ثلاثي الأبعاد. تركب على سير الإنتاج وتمشي معه: الأخشاب، الأفران المشتعلة، الفرز، الفحص، التعبئة، وحتى رفع الحاوية على السفينة، مع عدّاد للأيام والحرارة.', e: 'A full 3D factory. Ride the production belt past the timber yard, burning kilns, sorting, testing and packing, right up to the container being lifted onto the ship, with a live day and temperature readout.' },
      tags: [{ a: 'رحلة داخل المصنع', e: 'Factory Ride' }, { a: 'عدّاد الزمن والحرارة', e: 'Time & Heat Readout' }, { a: 'الأقرب لاسم Coalline', e: 'Closest To The Name' }]
    },
    {
      id: 3, name: { a: 'المسار', e: 'The Route' },
      hero: { a: 'من الإسكندرية<br>إلى موانئ العالم', e: 'From Alexandria<br>To The World’s Ports' },
      idea: { a: 'كرة أرضية من نقاط ذهبية تلفها بإيدك. اختر ميناء فتنطلق السفينة على مسارها مع مدة الرحلة، ثم حمّل حاوية 3D وشوف كم طن وكم كيس يدخل فيها.', e: 'A globe of gold dots you spin by hand. Pick a port and the ship sails its route with the transit time, then load a 3D container and see how many tons and bags fit.' },
      tags: [{ a: 'كرة أرضية تفاعلية', e: 'Interactive Globe' }, { a: 'حاسبة حاويات 3D', e: '3D Container Calculator' }, { a: 'الأنسب للمستوردين', e: 'Best For Importers' }]
    },
    {
      id: 4, name: { a: 'المعرض', e: 'The Showroom' },
      hero: { a: 'تصنيع وتصدير الفحم<br>من مصر إلى العالم', e: 'Charcoal Manufacturing<br>And Export From Egypt' },
      idea: { a: 'موقع شركات رسمي بتصميم فاتح وخطوط كلاسيكية. وفيه استوديو للعلامة الخاصة: العميل يكتب اسم علامته، يرفع شعاره، يختار اللون والوزن على عبوة 3D، ثم يطلب نفس التصميم.', e: 'A formal corporate site with a bright, classic design. It includes a private label studio: buyers type the brand name, upload a logo, pick the colour and weight on a 3D pack, then request that exact design.' },
      tags: [{ a: 'رسمي وكلاسيكي', e: 'Formal & Classic' }, { a: 'استوديو عبوات 3D', e: '3D Pack Studio' }, { a: 'الأقوى في البيع', e: 'Strongest For Sales' }]
    },
    {
      id: 5, name: { a: 'الجبل', e: 'The Summit' },
      hero: { a: 'صلابة الجبل<br>في كل قطعة', e: 'Solid As<br>The Mountain' },
      idea: { a: 'الجبل والجاروف والفأس من لوجو الشركة بقوا عالم ضخم. تطير بين قمم سوداء عليها خطوط كنتور ذهبية، وتعبر من قوس اللوجو نفسه، وسط خطوط ضخمة بأسلوب الملصقات.', e: 'The mountain, shovel and pickaxe from the company logo become a vast world. Fly over black peaks with gold contour lines and pass through the logo’s own arch, framed by huge poster type.' },
      tags: [{ a: 'مستوحى من اللوجو', e: 'Born From The Logo' }, { a: 'طيران فوق الجبال', e: 'Mountain Flight' }, { a: 'جريء وضخم', e: 'Bold & Massive' }]
    },
    {
      id: 6, name: { a: 'الشظايا', e: 'The Shards' },
      hero: { a: 'قطعة فوق قطعة،<br>نبني الثقة', e: 'Piece By Piece,<br>We Build Trust' },
      idea: { a: 'موقع رسمي فاتح وواضح. عشرات الآلاف من شظايا الفحم تكوّن اللوجو بالأسود والذهبي على خلفية بيضاء، ثم تتحول مع السكرول إلى قطعة فحم، مكعبات، كيس، حاوية، وكرة أرضية.', e: 'A clear, formal site on a bright page. Tens of thousands of charcoal shards form the logo in black and gold on white, then morph with the scroll into a lump, cubes, a bag, a container and a globe.' },
      tags: [{ a: 'رسمي وفاتح', e: 'Formal & Bright' }, { a: 'شظايا تتحول لأشكال', e: 'Morphing Shards' }, { a: 'أسود وذهبي على أبيض', e: 'Black & Gold On White' }]
    }
  ],

  gallery: {
    kicker: { a: 'MHC Coalline · نماذج الموقع', e: 'MHC Coalline · Website Models' },
    title: { a: 'ستة عوالم،<br>لشركة واحدة', e: 'Six Worlds.<br>One Company.' },
    body: {
      a: 'كل نموذج موقع كامل بنفس محتوى M.H.C، لكن بفكرة وتصميم وعالم ثلاثي الأبعاد مختلف تمامًا. افتح كل نموذج، جرّب السكرول والماوس وزرار 4D، واختر الأقرب لهوية الشركة.',
      e: 'Each model is a complete website with the same M.H.C content, but a completely different idea, design and 3D world. Open each one, try the scroll, the cursor and the 4D button, then pick the closest to the company.'
    },
    open: { a: 'افتح النموذج', e: 'Open Model' },
    fdTitle: { a: 'ما معنى 4D هنا؟', e: 'What Does 4D Mean Here?' },
    fdBody: { a: '3D حقيقي يعمل في المتصفح، يضاف إليه البعد الرابع: الزمن والإحساس.', e: 'Real-time 3D in the browser, plus a fourth dimension: time and feeling.' },
    fd: [
      { t: { a: 'الزمن', e: 'Time' }, x: { a: 'المشهد يتغير مع السكرول: الفحم يسخن، الأيام تعد، الشمس تشرق، والسفينة تبحر.', e: 'The scene evolves as you scroll: charcoal heats up, days count on, the sun rises and the ship sails.' } },
      { t: { a: 'الصوت', e: 'Sound' }, x: { a: 'طقطقة نار وهدير خفيف يتغيران مع حرارة المشهد، مولّدان داخل المتصفح.', e: 'Fire crackle and a low rumble that follow the heat of the scene, generated live in the browser.' } },
      { t: { a: 'الشرر والحرارة', e: 'Sparks & Heat' }, x: { a: 'شرر يطير فوق الصفحة نفسها ويتأثر بالماوس، وتموّج حراري على الصورة.', e: 'Sparks fly over the page itself and react to the cursor, with a heat shimmer on the image.' } },
      { t: { a: 'الاهتزاز والميل', e: 'Vibration & Tilt' }, x: { a: 'على الموبايل: اهتزاز مع كل انتقال، والمشهد يتحرك مع ميل الجهاز.', e: 'On phones: a vibration on each transition, and the scene moves as the device tilts.' } }
    ],
    note: { a: 'جميع النماذج تعمل بالعربية والإنجليزية، على الكمبيوتر والموبايل.', e: 'All models work in Arabic and English, on desktop and mobile.' }
  },

  hero: {
    eyebrow: { a: 'مصنع مصري · تصنيع وتصدير الفحم', e: 'Egyptian Factory · Charcoal Manufacturing & Export' },
    sub: {
      a: 'M.H.C مصنع مرخّص في مدينة برج العرب الجديدة، بالقرب من موانئ الإسكندرية والدخيلة. نصنّع الفحم ونعبئه ونشحنه إلى المستوردين والموزعين حول العالم.',
      e: 'M.H.C is a licensed factory in New Borg El Arab, close to the ports of Alexandria and Dekheila. We manufacture, pack and ship charcoal for importers and distributors around the world.'
    },
    cta: { a: 'اطلب عرض سعر', e: 'Request A Quote' },
    cta2: { a: 'استكشف المنتجات', e: 'Explore Products' },
    scroll: { a: 'مرّر للأسفل', e: 'Scroll Down' }
  },

  about: {
    kicker: { a: 'من نحن', e: 'About Us' },
    title: { a: 'من برج العرب إلى موانئ العالم', e: 'From Borg El Arab To The World’s Ports' },
    body: {
      a: 'M.H.C منشأة مصرية متخصصة في تصنيع الفحم وتوزيعه وتصديره. بدأنا نشاطنا في نوفمبر 2022، وأضفنا التصدير خلال أسابيع، ثم افتتحنا مصنعنا في المنطقة الصناعية الثالثة ببرج العرب عام 2023. اليوم ندير السلسلة كاملة بأنفسنا: التصنيع، والفرز، والتعبئة، والتحميل.',
      e: 'M.H.C is an Egyptian company specialised in manufacturing, distributing and exporting charcoal. We started in November 2022, added export within weeks, and opened our factory in the Third Industrial Zone of Borg El Arab in 2023. Today we run the whole chain ourselves: manufacturing, sorting, packing and loading.'
    },
    stats: [
      { n: '2022', k: { a: 'بداية النشاط', e: 'Started Operations' } },
      { n: '3', k: { a: 'مواقع: مصنع ومكتبان', e: 'Sites: A Factory & Two Offices' } },
      { n: '2', k: { a: 'مسارا نقل: بحري وبري', e: 'Transport Routes: Sea & Land' } },
      { n: '6', k: { a: 'سجلات واعتمادات رسمية', e: 'Official Registrations' } }
    ],
    timeline: [
      { d: '11/2022', t: { a: 'بداية النشاط', e: 'Operations Begin' }, x: { a: 'بدء توريد وتوزيع الفحم من الإسكندرية.', e: 'Coal supply and distribution begin in Alexandria.' } },
      { d: '12/2022', t: { a: 'السجل التجاري والتصدير', e: 'Commercial Register & Export' }, x: { a: 'القيد في سجل غرفة الإسكندرية وإضافة نشاط توزيع الفحم وتصديره.', e: 'Registered with the Alexandria Chamber, adding coal distribution and export.' } },
      { d: '01/2023', t: { a: 'سجل المصدرين', e: 'Exporters Register' }, x: { a: 'القيد لدى الهيئة العامة للرقابة على الصادرات والواردات.', e: 'Registered with the General Organization for Export and Import Control.' } },
      { d: '05/2023', t: { a: 'افتتاح المصنع', e: 'Factory Opens' }, x: { a: 'فرع التصنيع في برج العرب، وإضافة نشاط تصنيع الفحم والنقل الدولي البحري والبري.', e: 'The Borg El Arab manufacturing branch opens, adding coal manufacturing and international sea and land transport.' } },
      { d: '12/2023', t: { a: 'التسجيل الضريبي', e: 'VAT Registration' }, x: { a: 'التسجيل في ضريبة القيمة المضافة.', e: 'Registered for Value Added Tax.' } }
    ]
  },

  /* DRAFT: the product list, specs, sizes, packing and container loads are typical market values, not company data. Replace with the real ones. */
  products: {
    kicker: { a: 'المنتجات', e: 'Products' },
    title: { a: 'أربعة خطوط، لكل سوق ما يناسبه', e: 'Four Lines, One For Every Market' },
    note: { a: 'القيم استرشادية، وتُحدَّد نهائيًا في عرض السعر.', e: 'Indicative values, confirmed in each quotation.' },
    specLabels: { carbon: { a: 'الكربون الثابت', e: 'Fixed Carbon' }, ash: { a: 'الرماد', e: 'Ash' }, moisture: { a: 'الرطوبة', e: 'Moisture' }, burn: { a: 'زمن الاحتراق', e: 'Burn Time' }, size: { a: 'الحجم', e: 'Size' } },
    packLabel: { a: 'التعبئة', e: 'Packing' },
    items: [
      {
        id: 'lump', form: 'lump',
        name: { a: 'فحم المطاعم والشواء', e: 'Restaurant & BBQ Lump' },
        tag: { a: 'حرارة عالية، اشتعال طويل', e: 'High Heat, Long Burn' },
        desc: { a: 'قطع كبيرة من الفحم النباتي الصلب، مختارة لأفران المطاعم والشوايات المفتوحة. حرارة ثابتة، وشرر قليل، ودخان منخفض.', e: 'Large pieces of hard charcoal selected for restaurant ovens and open grills. Steady heat, few sparks and low smoke.' },
        specs: { carbon: '≥ 75%', ash: '≤ 5%', moisture: '≤ 6%', burn: { a: '3–4 ساعات', e: '3–4 Hours' }, size: { a: '4–15 سم', e: '4–15 cm' } },
        pct: { carbon: 75, ash: 5, moisture: 6 },
        pack: { a: 'أكياس 3، 5، 10، 15 كجم', e: '3, 5, 10, 15 kg Bags' },
        weights: [3, 5, 10, 15], load: { c20: 10, c40: 22 }, bagKg: 10
      },
      {
        id: 'shisha', form: 'cube',
        name: { a: 'فحم الشيشة الطبيعي', e: 'Natural Shisha Charcoal' },
        tag: { a: 'مكعبات متساوية، بلا رائحة', e: 'Uniform Cubes, No Odour' },
        desc: { a: 'مكعبات مضغوطة بمقاسات دقيقة، تشتعل بثبات وتدوم طويلًا دون رائحة أو طعم يؤثر على النكهة.', e: 'Pressed cubes cut to precise sizes. They light evenly and last long, with no odour or taste to affect the flavour.' },
        specs: { carbon: '≥ 78%', ash: '≤ 4%', moisture: '≤ 5%', burn: { a: '60–90 دقيقة', e: '60–90 Minutes' }, size: { a: 'مكعب 25 مم', e: '25 mm Cube' } },
        pct: { carbon: 78, ash: 4, moisture: 5 },
        pack: { a: 'علب 1 كجم، كراتين 10 و20 كجم', e: '1 kg Boxes, 10 & 20 kg Cartons' },
        weights: [1, 10, 20], load: { c20: 17, c40: 26 }, bagKg: 10
      },
      {
        id: 'briquette', form: 'hex',
        name: { a: 'قوالب الفحم المضغوط', e: 'Compressed Briquettes' },
        tag: { a: 'شكل موحّد، احتراق متوازن', e: 'Uniform Shape, Balanced Burn' },
        desc: { a: 'قوالب مضغوطة من نشارة الأخشاب الطبيعية، بكثافة عالية وأطول زمن احتراق. خيار اقتصادي للمطاعم وأسواق التجزئة.', e: 'Dense briquettes pressed from natural sawdust, with the longest burn time. An economical choice for restaurants and retail.' },
        specs: { carbon: '≥ 72%', ash: '≤ 6%', moisture: '≤ 6%', burn: { a: '4–5 ساعات', e: '4–5 Hours' }, size: { a: 'سداسي 5 × 20 سم', e: 'Hexagon 5 × 20 cm' } },
        pct: { carbon: 72, ash: 6, moisture: 6 },
        pack: { a: 'كراتين وأكياس 5، 10، 20 كجم', e: '5, 10, 20 kg Cartons & Bags' },
        weights: [5, 10, 20], load: { c20: 15, c40: 26 }, bagKg: 10
      },
      {
        id: 'fruit', form: 'cluster',
        name: { a: 'فحم الأخشاب المثمرة', e: 'Fruitwood Charcoal' },
        tag: { a: 'رائحة طيبة لأفخر الأطباق', e: 'A Fine Aroma For Fine Dishes' },
        desc: { a: 'فحم من خشب الموالح والأشجار المثمرة، يمنح المشويات نكهة مميزة، ويناسب المطاعم الفاخرة وأسواق التجزئة الراقية.', e: 'Charcoal from citrus and fruit trees that gives grilled food a distinct flavour. Suited to fine restaurants and premium retail.' },
        specs: { carbon: '≥ 78%', ash: '≤ 4%', moisture: '≤ 5%', burn: { a: '3–4 ساعات', e: '3–4 Hours' }, size: { a: '3–10 سم', e: '3–10 cm' } },
        pct: { carbon: 78, ash: 4, moisture: 5 },
        pack: { a: 'أكياس 3، 5، 10 كجم', e: '3, 5, 10 kg Bags' },
        weights: [3, 5, 10], load: { c20: 9, c40: 20 }, bagKg: 10
      }
    ]
  },

  inside: {
    kicker: { a: 'تشريح الجودة', e: 'Anatomy Of Quality' },
    title: { a: 'داخل كل قطعة', e: 'Inside Every Piece' },
    body: { a: 'ما يهم المستورد لا يظهر من الخارج. هذا ما نقيسه داخل كل دفعة قبل أن تغادر المصنع.', e: 'What matters to an importer does not show on the outside. This is what we measure inside every batch before it leaves the factory.' }
  },

  /* DRAFT: typical charcoal process. Replace the days and temperatures with the factory's real figures. */
  process: {
    kicker: { a: 'خط الإنتاج', e: 'The Production Line' },
    title: { a: 'سبع مراحل، ومسؤول واحد عن الجودة', e: 'Seven Stages, One Team Answerable For Quality' },
    note: { a: 'الأيام والحرارة قيم تقريبية لدورة الإنتاج.', e: 'Days and temperatures are approximate for one production cycle.' },
    tempLabel: { a: 'الحرارة', e: 'Temperature' },
    dayLabel: { a: 'اليوم', e: 'Day' },
    steps: [
      { id: 'wood', day: 1, temp: 30, t: { a: 'اختيار الخشب', e: 'Wood Selection' }, x: { a: 'نختار الأخشاب الصلبة وأخشاب الأشجار المثمرة، ونتركها تجف قبل دخول الأفران.', e: 'We select hardwoods and fruit woods and let them dry before they enter the kilns.' } },
      { id: 'kiln', day: 5, temp: 520, t: { a: 'الكربنة', e: 'Carbonisation' }, x: { a: 'يتحول الخشب إلى فحم داخل الأفران عند حرارة عالية ونسبة أكسجين محدودة.', e: 'Wood turns into charcoal inside the kilns at high heat with limited oxygen.' } },
      { id: 'cool', day: 10, temp: 70, t: { a: 'التبريد المُحكَم', e: 'Controlled Cooling' }, x: { a: 'نغلق الأفران ليبرد الفحم تدريجيًا، فيحتفظ بصلابته ويخرج آمنًا.', e: 'The kilns are sealed so the charcoal cools gradually, keeping its hardness and coming out safe to handle.' } },
      { id: 'sort', day: 13, temp: 35, t: { a: 'التكسير والفرز', e: 'Crushing & Sorting' }, x: { a: 'نكسّر القطع ونفرزها بحسب الحجم، ونفصل الغبار والقطع الصغيرة.', e: 'Pieces are broken and graded by size, and the dust and fines are removed.' } },
      { id: 'qc', day: 13, temp: 28, t: { a: 'فحص الجودة', e: 'Quality Control' }, x: { a: 'نختبر الرطوبة والرماد والكربون الثابت وزمن الاحتراق قبل التعبئة.', e: 'We test moisture, ash, fixed carbon and burn time before packing.' } },
      { id: 'pack', day: 14, temp: 26, t: { a: 'التعبئة', e: 'Packing' }, x: { a: 'نعبئ بالأوزان المطلوبة في أكياس أو كراتين، باسمنا أو باسم علامتك التجارية.', e: 'We pack to the required weights in bags or cartons, under our name or your own brand.' } },
      { id: 'ship', day: 15, temp: 26, t: { a: 'التحميل والشحن', e: 'Loading & Shipping' }, x: { a: 'نحمّل الحاويات في المصنع ونوصلها إلى موانئ الإسكندرية والدخيلة مع مستندات التصدير.', e: 'Containers are loaded at the factory and delivered to the ports of Alexandria and Dekheila with the export documents.' } }
    ]
  },

  /* DRAFT: routes show where we can ship, with indicative transit times. Replace with the real markets and lines. */
  export: {
    kicker: { a: 'التصدير', e: 'Export' },
    title: { a: 'كل شحنة، مسار محسوب', e: 'Every Shipment, A Calculated Route' },
    body: {
      a: 'نجهّز شحنتك من باب المصنع حتى الميناء: تعبئة، وتحميل حاويات، ومستندات تصدير كاملة، عبر موانئ الإسكندرية والدخيلة، مع إمكانية النقل الدولي البحري والبري.',
      e: 'We prepare your shipment from the factory gate to the port: packing, container loading and full export documents through the ports of Alexandria and Dekheila, with international sea and land transport available.'
    },
    origin: { lat: 31.2, lon: 29.92, name: { a: 'الإسكندرية', e: 'Alexandria' } },
    routes: [
      { id: 'jed', lat: 21.49, lon: 39.19, days: [5, 8], port: { a: 'جدة', e: 'Jeddah' }, land: { a: 'السعودية', e: 'Saudi Arabia' } },
      { id: 'jea', lat: 25.01, lon: 55.06, days: [14, 20], port: { a: 'جبل علي', e: 'Jebel Ali' }, land: { a: 'الإمارات', e: 'UAE' } },
      { id: 'dmm', lat: 26.43, lon: 50.1, days: [16, 22], port: { a: 'الدمام', e: 'Dammam' }, land: { a: 'السعودية', e: 'Saudi Arabia' } },
      { id: 'kwi', lat: 29.35, lon: 47.93, days: [18, 24], port: { a: 'الشويخ', e: 'Shuwaikh' }, land: { a: 'الكويت', e: 'Kuwait' } },
      { id: 'mer', lat: 36.8, lon: 34.63, days: [2, 5], port: { a: 'مرسين', e: 'Mersin' }, land: { a: 'تركيا', e: 'Turkey' } },
      { id: 'bey', lat: 33.9, lon: 35.52, days: [2, 4], port: { a: 'بيروت', e: 'Beirut' }, land: { a: 'لبنان', e: 'Lebanon' } },
      { id: 'pir', lat: 37.94, lon: 23.63, days: [2, 5], port: { a: 'بيرايوس', e: 'Piraeus' }, land: { a: 'اليونان', e: 'Greece' } },
      { id: 'goa', lat: 44.41, lon: 8.93, days: [4, 7], port: { a: 'جنوة', e: 'Genoa' }, land: { a: 'إيطاليا', e: 'Italy' } },
      { id: 'rtm', lat: 51.95, lon: 4.14, days: [11, 16], port: { a: 'روتردام', e: 'Rotterdam' }, land: { a: 'هولندا', e: 'Netherlands' } },
      { id: 'ham', lat: 53.54, lon: 9.98, days: [13, 18], port: { a: 'هامبورج', e: 'Hamburg' }, land: { a: 'ألمانيا', e: 'Germany' } },
      { id: 'nyc', lat: 40.68, lon: -74.04, days: [18, 26], port: { a: 'نيويورك', e: 'New York' }, land: { a: 'أمريكا', e: 'USA' } },
      { id: 'sha', lat: 31.23, lon: 121.47, days: [28, 36], port: { a: 'شنغهاي', e: 'Shanghai' }, land: { a: 'الصين', e: 'China' } }
    ],
    routesNote: { a: 'مدد الرحلات تقديرية وتختلف حسب الخط الملاحي.', e: 'Transit times are estimates and vary by shipping line.' },
    head: { port: { a: 'ميناء الوصول', e: 'Destination Port' }, land: { a: 'الدولة', e: 'Country' }, days: { a: 'مدة الرحلة (يوم)', e: 'Transit (Days)' } },
    daysWord: { a: 'يوم', e: 'Days' },
    terms: [
      { k: 'FOB', v: { a: 'التسليم على ظهر السفينة في ميناء الإسكندرية', e: 'Free on board at the port of Alexandria' } },
      { k: 'CFR', v: { a: 'السعر شامل الشحن حتى ميناء الوصول', e: 'Price includes freight to the destination port' } },
      { k: 'CIF', v: { a: 'السعر شامل الشحن والتأمين حتى ميناء الوصول', e: 'Price includes freight and insurance to the destination port' } }
    ],
    docsTitle: { a: 'مستندات كل شحنة', e: 'Documents With Every Shipment' },
    docs: [
      { a: 'الفاتورة التجارية', e: 'Commercial Invoice' },
      { a: 'قائمة التعبئة', e: 'Packing List' },
      { a: 'بوليصة الشحن', e: 'Bill Of Lading' },
      { a: 'شهادة المنشأ', e: 'Certificate Of Origin' },
      { a: 'شهادة التحليل عند الطلب', e: 'Analysis Certificate On Request' }
    ],
    hs: { k: { a: 'البند الجمركي', e: 'HS Code' }, v: '4402.90' },
    containers: [
      { id: 'c20', name: { a: 'حاوية 20 قدم', e: '20 ft Container' }, l: 5.9, w: 2.35, h: 2.39 },
      { id: 'c40', name: { a: 'حاوية 40 قدم عالية', e: '40 ft High Cube' }, l: 12.03, w: 2.35, h: 2.69 }
    ],
    calc: {
      title: { a: 'حمّل حاويتك', e: 'Load Your Container' },
      product: { a: 'المنتج', e: 'Product' },
      box: { a: 'الحاوية', e: 'Container' },
      tons: { a: 'طن تقريبًا', e: 'Tons Approx.' },
      bags: { a: 'كيس 10 كجم', e: '10 kg Bags' },
      note: { a: 'أرقام تقديرية للتوضيح.', e: 'Illustrative estimates.' }
    }
  },

  label: {
    kicker: { a: 'علامتك الخاصة', e: 'Private Label' },
    title: { a: 'علامتك أنت، على فحمنا', e: 'Your Brand, Our Charcoal' },
    body: {
      a: 'نصنّع ونعبئ باسم علامتك التجارية: تصميم العبوة، والأوزان، والكراتين، وتحميل الحاويات حسب مواصفاتك.',
      e: 'We manufacture and pack under your brand: pack design, weights, cartons and container loading to your specification.'
    },
    points: [
      { t: { a: 'تصميم العبوة', e: 'Pack Design' }, x: { a: 'بشعارك وألوانك ولغة سوقك.', e: 'Your logo, colours and market language.' } },
      { t: { a: 'أوزان حسب الطلب', e: 'Custom Weights' }, x: { a: 'من علب 1 كجم حتى أكياس 20 كجم.', e: 'From 1 kg boxes to 20 kg bags.' } },
      { t: { a: 'جاهز للرفوف', e: 'Shelf Ready' }, x: { a: 'كراتين وبالتات بمواصفات التجزئة.', e: 'Cartons and pallets to retail standards.' } },
      { t: { a: 'عينات قبل الإنتاج', e: 'Samples First' }, x: { a: 'تراجع العينة قبل بدء الكمية.', e: 'Review a sample before the full run.' } }
    ],
    designer: {
      title: { a: 'صمّم عبوتك الآن', e: 'Design Your Pack Now' },
      brand: { a: 'اسم علامتك', e: 'Your Brand Name' },
      brandPh: { a: 'اكتب اسم علامتك', e: 'Type your brand name' },
      logo: { a: 'ارفع شعارك', e: 'Upload Your Logo' },
      logoHint: { a: 'يظل على جهازك ولا يُرفع لأي مكان.', e: 'It stays on your device and is not uploaded anywhere.' },
      color: { a: 'لون العبوة', e: 'Pack Colour' },
      weight: { a: 'الوزن', e: 'Weight' },
      product: { a: 'المنتج', e: 'Product' },
      kg: { a: 'كجم', e: 'kg' },
      request: { a: 'اطلب هذا التصميم', e: 'Request This Design' },
      drag: { a: 'اسحب لتدوير العبوة', e: 'Drag To Rotate The Pack' },
      colors: [
        { id: 'black', c: '#111113', ink: '#E7C24F', n: { a: 'أسود وذهبي', e: 'Black & Gold' } },
        { id: 'kraft', c: '#B98F5E', ink: '#1a120a', n: { a: 'ورق كرافت', e: 'Natural Kraft' } },
        { id: 'white', c: '#F2EEE6', ink: '#111113', n: { a: 'أبيض', e: 'White' } },
        { id: 'red', c: '#7D1A12', ink: '#F7E7C4', n: { a: 'أحمر ناري', e: 'Fire Red' } },
        { id: 'green', c: '#17362A', ink: '#E7C24F', n: { a: 'أخضر داكن', e: 'Deep Green' } }
      ]
    }
  },

  trust: {
    kicker: { a: 'الاعتمادات', e: 'Credentials' },
    title: { a: 'شركة مسجلة رسميًا في مصر', e: 'Officially Registered In Egypt' },
    body: { a: 'نعمل وفق السجلات الرسمية في مصر، ونوفر صور المستندات للعملاء عند الطلب.', e: 'We operate under Egypt’s official registers, and copies of the documents are available to clients on request.' },
    items: [
      { k: { a: 'السجل التجاري', e: 'Commercial Register' }, by: { a: 'غرفة تجارة الإسكندرية', e: 'Alexandria Chamber Of Commerce' }, no: '69764', until: '12/2027' },
      { k: { a: 'سجل المصدرين', e: 'Exporters Register' }, by: { a: 'الهيئة العامة للرقابة على الصادرات والواردات', e: 'General Organization For Export & Import Control' }, no: '600013978', until: '12/2027' },
      { k: { a: 'ضريبة القيمة المضافة', e: 'VAT Registration' }, by: { a: 'مصلحة الضرائب المصرية', e: 'Egyptian Tax Authority' }, no: '704-945-487', until: '12/2028' },
      { k: { a: 'ترخيص مزاولة التجارة · تصنيع فحم', e: 'Trade Licence · Coal Manufacturing' }, by: { a: 'الغرفة التجارية بالإسكندرية', e: 'Alexandria Chamber Of Commerce' }, no: '196126', until: '' },
      { k: { a: 'غرفة الصناعات الكيماوية', e: 'Chamber Of Chemical Industries' }, by: { a: 'اتحاد الصناعات المصرية', e: 'Federation Of Egyptian Industries' }, no: '19187', until: '' },
      { k: { a: 'شهادة مزاولة التصدير', e: 'Export Practice Certificate' }, by: { a: 'الاتحاد العام للغرف التجارية · وزارة التجارة والصناعة', e: 'FEDCOC · Ministry Of Trade & Industry' }, no: '2023', until: '' }
    ],
    noLabel: { a: 'رقم', e: 'No.' },
    untilLabel: { a: 'سارٍ حتى', e: 'Valid To' }
  },

  /* DRAFT: confirm each answer with the company */
  faq: {
    kicker: { a: 'أسئلة شائعة', e: 'FAQ' },
    title: { a: 'قبل أن تطلب', e: 'Before You Order' },
    items: [
      { q: { a: 'ما أقل كمية للطلب؟', e: 'What is the minimum order?' }, a: { a: 'نبدأ عادةً من حاوية 20 قدم، ويمكن الاتفاق على شحنات تجريبية.', e: 'We usually start from one 20 ft container, and trial shipments can be arranged.' } },
      { q: { a: 'هل ترسلون عينات؟', e: 'Do you send samples?' }, a: { a: 'نعم، نرسل عينات لتقييم الجودة قبل الطلب.', e: 'Yes, we send samples so you can assess the quality before ordering.' } },
      { q: { a: 'من أي ميناء تشحنون؟', e: 'Which port do you ship from?' }, a: { a: 'من موانئ الإسكندرية والدخيلة، وهي الأقرب إلى مصنعنا في برج العرب.', e: 'From the ports of Alexandria and Dekheila, the closest to our factory in Borg El Arab.' } },
      { q: { a: 'هل يمكن التعبئة باسم علامتي؟', e: 'Can you pack under my brand?' }, a: { a: 'نعم، نوفر التعبئة بعلامتك الخاصة في الأكياس والعلب والكراتين.', e: 'Yes, we offer private label packing in bags, boxes and cartons.' } },
      { q: { a: 'ما شروط التسليم المتاحة؟', e: 'Which delivery terms are available?' }, a: { a: 'نعمل بشروط FOB وCFR وCIF بحسب الاتفاق.', e: 'We work on FOB, CFR and CIF terms, as agreed.' } }
    ]
  },

  contact: {
    kicker: { a: 'تواصل معنا', e: 'Contact' },
    title: { a: 'أخبرنا بما تحتاجه، وسنرد بعرض سعر', e: 'Tell Us What You Need And We’ll Reply With A Quote' },
    whatsapp: { a: 'واتساب', e: 'WhatsApp' },
    call: { a: 'اتصل بنا', e: 'Call Us' },
    map: { a: 'افتح الخريطة', e: 'Open Map' },
    email: { a: 'البريد الإلكتروني', e: 'Email' },
    form: {
      name: { a: 'الاسم', e: 'Name' },
      company: { a: 'الشركة', e: 'Company' },
      country: { a: 'الدولة', e: 'Country' },
      phone: { a: 'الهاتف أو واتساب', e: 'Phone Or WhatsApp' },
      email: { a: 'البريد الإلكتروني', e: 'Email' },
      product: { a: 'المنتج', e: 'Product' },
      qty: { a: 'الكمية', e: 'Quantity' },
      message: { a: 'تفاصيل الطلب', e: 'Request Details' },
      choose: { a: 'اختر', e: 'Choose' },
      qtyOptions: [
        { a: 'عينة', e: 'Sample' },
        { a: 'حاوية 20 قدم', e: '20 ft Container' },
        { a: 'حاوية 40 قدم', e: '40 ft Container' },
        { a: 'أكثر من حاوية', e: 'Several Containers' }
      ],
      send: { a: 'أرسل الطلب عبر واتساب', e: 'Send Request On WhatsApp' },
      sendEmail: { a: 'أرسل الطلب', e: 'Send Request' },
      required: { a: 'هذا الحقل مطلوب', e: 'This field is required' },
      badPhone: { a: 'أدخل رقمًا صحيحًا', e: 'Enter a valid number' },
      sent: { a: 'تم استلام طلبك، وسنتواصل معك قريبًا.', e: 'We have your request and will contact you soon.' },
      failed: { a: 'تعذّر الإرسال. حاول عبر واتساب.', e: 'Sending failed. Please try WhatsApp.' },
      sending: { a: 'جارٍ الإرسال…', e: 'Sending…' },
      opened: { a: 'فتحنا واتساب برسالتك جاهزة، اضغط إرسال هناك.', e: 'WhatsApp opened with your message ready. Press send there.' }
    }
  },

  ui: {
    allModels: { a: 'كل النماذج', e: 'All Models' },
    model: { a: 'نموذج', e: 'Model' },
    of: { a: 'من', e: 'of' },
    fx4d: { a: 'تشغيل تجربة 4D: صوت وشرر وحرارة واهتزاز', e: 'Turn on the 4D experience: sound, sparks, heat and vibration' },
    fxOn: { a: '4D يعمل', e: '4D On' },
    menu: { a: 'القائمة', e: 'Menu' },
    close: { a: 'إغلاق', e: 'Close' },
    rights: { a: 'جميع الحقوق محفوظة', e: 'All Rights Reserved' },
    drag: { a: 'اسحب للتدوير', e: 'Drag To Rotate' },
    next: { a: 'التالي', e: 'Next' },
    prev: { a: 'السابق', e: 'Previous' }
  }
};

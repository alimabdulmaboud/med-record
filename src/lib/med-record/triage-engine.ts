import type { FamilyMember, Medication, TriageAssessment, TriageMessage, UrgencyLevel } from '@/types/med-record';

export interface TriageContext {
  member: FamilyMember;
  currentMedications?: Medication[];
}

export interface SymptomRule {
  keywords: string[];
  specialtyAr: string;
  specialtyEn: string;
  defaultCauses: string[];
  redFlagKeywords: string[];
  followUpQuestions: {
    question: string;
    quickOptions: string[];
  }[];
  comfortAdvice: string[];
  questionsForDoctor: string[];
}

const SYMPTOM_RULES: SymptomRule[] = [
  {
    keywords: ['صدر', 'قلب', 'نبض', 'خفقان', 'نهجان', 'صدرية', 'ألم في الصدر', 'وجع في الصدر'],
    specialtyAr: 'أمراض القلب والأوعية الدموية (Cardiology)',
    specialtyEn: 'Cardiology',
    defaultCauses: ['إجهاد عضلي في جدار الصدر', 'ارتجاع مريئي يسبب حرقة في الصدر', 'اضطراب في ضربات القلب أو إجهاد قلبي', 'ذبحة صدرية محتملة (تستدعي الفحص الفوري)'],
    redFlagKeywords: ['كتف', 'ذراع', 'فك', 'عرق', 'إغماء', 'شديد', 'ضغط', 'ثقل', 'ضيق تنفس'],
    followUpQuestions: [
      {
        question: 'هل يمتد الألم أو ينتشر إلى الذراع الأيسر، الرقبة، أو الفك؟ وهل يصاحبه عرق بارد أو دوار؟',
        quickOptions: ['نعم يمتد للكتف/الذراع', 'لا الألم موضعي فقط', 'يصاحبه عرق ودوار', 'غير متأكد']
      },
      {
        question: 'هل يزداد الألم مع بذل أي مجهود بدني أم يظهر حتى أثناء الراحة؟',
        quickOptions: ['مع المجهود فقط', 'أثناء الراحة', 'مستمر طوال الوقت', 'يزداد مع أخذ نفس عميق']
      }
    ],
    comfortAdvice: [
      'التوقف الفوري عن أي مجهود بدني والجلوس بوضع مريح بزاوية 45 درجة.',
      'تجنب تناول المشروبات المنبهة كالقهوة ومشروبات الطاقة تماماً.',
      'عدم أخذ أي أدوية دون وصفة طبية، والاتصال بالإسعاف (123) فوراً عند الشعور بضغط عاصر أو ثقل شديد.'
    ],
    questionsForDoctor: [
      'هل أحتاج لعمل رسم قلب (ECG) أو إنزيمات قلب؟',
      'هل يحتاج ضغط الدم لمتابعة دورية أو فحص إيكو للقلب؟'
    ]
  },
  {
    keywords: ['صداع', 'دوار', 'دوخة', 'زغللة', 'تنميل', 'رأس', 'شقيقة', 'نصف'],
    specialtyAr: 'المخ والأعصاب (Neurology) / الباطنة العامة',
    specialtyEn: 'Neurology',
    defaultCauses: ['صداع توتري ناتج عن الإجهاد وقلة النوم', 'صداع نصفي (شقيقة)', 'ارتفاع أو انخفاض في ضغط الدم', 'إجهاد بصري أو التهاب الجيوب الأنفية'],
    redFlagKeywords: ['مفاجئ', 'انفجار', 'شلل', 'كلام', 'صعوبة في الكلام', 'تشنج', 'إغماء', 'رؤية مزدوجة'],
    followUpQuestions: [
      {
        question: 'كيف تصف الصداع: هل بدأ فجأة كضربة برق شديدة جداً، أم يتصاعد تدريجياً؟',
        quickOptions: ['مفاجئ وشديد جداً', 'نابض في جهة واحدة', 'ضاغط كحزام حول الرأس', 'مستمر منذ أيام']
      },
      {
        question: 'هل تعاني من أي تنميل في الوجه أو الأطراف، أو صعوبة في نطق الكلمات أو تشوش مفاجئ بالرؤية؟',
        quickOptions: ['نعم يوجد تنميل أو ثقل', 'لا توجد هذه الأعراض', 'فقط زغللة خفيفة', 'حساسية للضوء والصوت']
      }
    ],
    comfortAdvice: [
      'الاسترخاء في غرفة مظلمة وهادئة وشرب كوبين من الماء الفاتر.',
      'قياس ضغط الدم وتسجيل القراءة في سجل القياسات.',
      'تجنب الشاشات والهواتف لمدة ساعة على الأقل.'
    ],
    questionsForDoctor: [
      'هل نوع الصداع يرتبط بضغط الدم أو بالنظر؟',
      'هل ينصح بعمل أشعة مقطعية أو رنين مغناطيسي على المخ؟'
    ]
  },
  {
    keywords: ['بطن', 'مغص', 'حموضة', 'حرقان', 'إسهال', 'إمساك', 'قيء', 'ترجيع', 'قولون', 'غازات', 'معدة'],
    specialtyAr: 'الجهاز الهضمي والكبد والباطنة (Gastroenterology)',
    specialtyEn: 'Gastroenterology',
    defaultCauses: ['نزلة معوية أو تسمم غذائي بسيط', 'متلازمة القولون العصبي', 'التهاب في جدار المعدة أو ارتجاع مريئي', 'التهاب الزائدة الدودية أو المرارة (حسب موقع الألم)'],
    redFlagKeywords: ['دم', 'أسود', 'شديد جدا', 'حرارة عالية', 'اليمين', 'زائدة', 'اصفرار'],
    followUpQuestions: [
      {
        question: 'أين يتركز المغص أو الألم تحديداً في البطن؟',
        quickOptions: ['أعلى البطن (فم المعدة)', 'أسفل يمين البطن', 'حول السرة ومنتشر', 'أسفل البطن مع الحوض']
      },
      {
        question: 'هل يصاحب الألم قيء مستمر، دم في البراز، أو ارتفاع ملحوظ في درجة الحرارة؟',
        quickOptions: ['نعم يوجد قيء أو حرارة', 'لا، فقط مغص وانتفاخ', 'يوجد إسهال فقط', 'حموضة وحرقان شديد']
      }
    ],
    comfortAdvice: [
      'شرب سوائل دافئة خالية من السكر (نعناع أو يانسون) والابتعاد عن الدهون والمقليات.',
      'في حال وجود إسهال أو قيء، تناول محلول معالجة الجفاف لتعويض الأملاح.',
      'تجنب تناول المسكنات القوية (مثل البروفين والكتافلام) لأنها تهيج جدار المعدة.'
    ],
    questionsForDoctor: [
      'هل أحتاج لتحليل براز أو جرثومة المعدة (H. Pylori)؟',
      'هل يحتاج الأمر لعمل سونار (موجات صوتية) على البطن والحوض؟'
    ]
  },
  {
    keywords: ['عظام', 'مفصل', 'ركبة', 'ظهر', 'فقرات', 'رقبة', 'كتف', 'قدم', 'كسر', 'كدمة', 'انزلاق'],
    specialtyAr: 'جراحة العظام والمفاصل (Orthopedics) / الروماتيزم',
    specialtyEn: 'Orthopedics',
    defaultCauses: ['شد عضلي ناتج عن حركة خاطئة أو جلسة غير صحية', 'خشونة في المفاصل أو الغضاريف', 'التهاب أوتار أو أربطة', 'انزلاق غضروفي قطني أو عنقي'],
    redFlagKeywords: ['عدم القدرة على المشي', 'سقوط', 'حادث', 'فقدان التحكم', 'بول', 'تبرز', 'تنميل كامل'],
    followUpQuestions: [
      {
        question: 'هل حدث الألم نتيجة سقطة أو التواء مفاجئ، أم بدأ تدريجياً؟',
        quickOptions: ['إصابة أو سقطة مباشرة', 'بدأ تدريجياً مع الوقت', 'بعد حمل وزن ثقيل', 'ألم صباحي مع تيبس']
      },
      {
        question: 'إذا كان الألم في الظهر، هل يمتد ككهرباء أو تنميل لأسفل الساقين أو يؤثر على التحكم بالبول؟',
        quickOptions: ['نعم يمتد للساق (عرق النسا)', 'لا، الألم موضعي بالظهر', 'يوجد تورم في المفصل', 'صعوبة في ثني الركبة']
      }
    ],
    comfortAdvice: [
      'إراحة العضو المصاب واستخدام كمادات دافئة للشد العضلي، أو باردة للإصابات الحديثة.',
      'تجنب حمل الأوزان الثقيلة والجلوس بظهر مستقيم وداعم.',
      'دهان موضعي مسكن خفيف إن لم توجد حساسية.'
    ],
    questionsForDoctor: [
      'هل أحتاج لعمل أشعة سينية عادية (X-Ray) أو رنين مغناطيسي؟',
      'هل ينصح بجلسات علاج طبيعي أم أدوية باسطة للعضلات؟'
    ]
  },
  {
    keywords: ['كحة', 'سعال', 'بلغم', 'تنفس', 'حساسية صدر', 'ربو', 'تزييق', 'شعب'],
    specialtyAr: 'أمراض الصدر والجهاز التنفسي (Pulmonology)',
    specialtyEn: 'Pulmonology',
    defaultCauses: ['التهاب شعبي حاد أو نزلة برد ورشح أنفي خلفي', 'حساسية صدرية أو نوبة ربو شعبي', 'التهاب رئوي (إذا صاحبه حرارة عالية وضيق تنفس)', 'تهيج ناتج عن أتربة أو تدخين'],
    redFlagKeywords: ['أزرق', 'دم مع البلغم', 'اختناق', 'صعوبة شديدة في التنفس', 'أكسجين منخفض'],
    followUpQuestions: [
      {
        question: 'هل الكحة جافة أم مصحوبة ببلغم؟ وهل يصاحبها صوت تزييق أو صفير عند التنفس؟',
        quickOptions: ['كحة جافة مع تزييق بالصدر', 'مصحوبة ببلغم ملون', 'جافة ومستمرة خاصة بالليل', 'شرقة وضيق في الصدر']
      },
      {
        question: 'هل قست نسبة تشبع الأكسجين بالدم بجهاز النبض مؤخراً؟ وما هي النسبة إن وُجدت؟',
        quickOptions: ['طبيعي (96% فأكثر)', 'منخفض (أقل من 94%)', 'لم يتم القياس', 'أشعر بنهجان عند أقل حركة']
      }
    ],
    comfortAdvice: [
      'استنشاق بخار ماء دافئ وشرب المشروبات العشبية كأوراق الجوافة والتيليو.',
      'تجنب التعرض المباشر لتيارات الهواء البارد، ودخان السجائر، والبخور والعطور النفاذة.',
      'رفع الرأس بوسائد إضافية عند النوم لتقليل السعال الليلي.'
    ],
    questionsForDoctor: [
      'هل أحتاج لعمل أشعة عادية على الصدر (Chest X-Ray)؟',
      'هل حالتي تحتاج إلى موسعات شعب هوائية أو جلسات بخار؟'
    ]
  },
  {
    keywords: ['بول', 'حرقان', 'مغص كلوي', 'كلى', 'جنب', 'دم في البول', 'حالب', 'مثانة'],
    specialtyAr: 'جراحة المسالك البولية والكلى (Urology / Nephrology)',
    specialtyEn: 'Urology',
    defaultCauses: ['التهاب في مجرى البول أو المثانة (UTI)', 'أملاح زائدة أو رمال في البول', 'حصوة في الكلى أو الحالب تسبب مغصاً كلوياً', 'احتقان أو التهاب البروستاتا (عند الرجال)'],
    redFlagKeywords: ['دم واضح', 'احتباس بول', 'حرارة مع رعشة', 'مغص لا يهدأ بأي مسكن'],
    followUpQuestions: [
      {
        question: 'هل تشعر بحرقان متكرر أثناء التبول أو تغير في لون البول إلى الداكن أو المائل للحمرة؟',
        quickOptions: ['نعم حرقان شديد مع رغبة ملحة', 'مغص شديد في أحد الجانبين', 'تغير في لون البول', 'تقطع وضعف في تيار البول']
      },
      {
        question: 'هل يصاحب الألم ارتفاع في درجة الحرارة مع قشعريرة أو ميل للغثيان والقيء؟',
        quickOptions: ['نعم يوجد سخونة ورعشة', 'يوجد غثيان ومغص بالجانب', 'فقط حرقان موضعي', 'لا توجد حرارة']
      }
    ],
    comfortAdvice: [
      'شرب كميات وافرة من الماء النقي (من 2.5 إلى 3 لترات على مدار اليوم).',
      'تجنب الإفراط في الأطعمة الغنية بالأملاح والمخللات والمشروبات الغازية.',
      'عدم حبس البول والتبول فور الشعور بالحاجة.'
    ],
    questionsForDoctor: [
      'هل يلزم عمل تحليل بول كامل مع مزرعة بول؟',
      'هل ينصح بعمل سونار على الكلى والمسالك وحوض البطن؟'
    ]
  },
  {
    keywords: ['أذن', 'طنين', 'حلق', 'لوز', 'جيوب أنفية', 'أنف', 'صعوبة بلع', 'دوخة دهليزية'],
    specialtyAr: 'الأنف والأذن والحنجرة (ENT - Otorhinolaryngology)',
    specialtyEn: 'ENT',
    defaultCauses: ['التهاب في الحلق أو اللوزتين', 'التهاب الجيوب الأنفية الحاد أو التحسسي', 'التهاب الأذن الوسطى أو شمع الأذن', 'اضطراب في الأذن الداخلية يسبب دواراً وضعف توازن'],
    redFlagKeywords: ['صعوبة تنفس', 'تورم الرقبة', 'نزيف مستمر', 'فقدان مفاجئ للسمع'],
    followUpQuestions: [
      {
        question: 'هل تشعر بانسداد أو إفرازات أنفية وصداع بين العينين، أم أن المشكلة ألم وانسداد في الأذن؟',
        quickOptions: ['جيوب أنفية وصداع بالوجه', 'ألم وطنين في الأذن', 'احتقان حلق وصعوبة بلع', 'دوار قوي عند تحريك الرأس']
      }
    ],
    comfortAdvice: [
      'استخدام بخاخ أو غسول ماء البحر (محلول ملحي) لتنظيف مجرى الأنف بلطف.',
      'الغرغرة بماء دافئ وقليل من الملح لتخفيف احتقان الحلق.',
      'تجنب إدخال أعواد القطن داخل قناة الأذن نهائياً.'
    ],
    questionsForDoctor: [
      'هل يحتاج التهاب الحلق لمضاد حيوي بناءً على فحص اللوزتين؟',
      'هل يوجد تراكم للشمع أو سائل خلف طبلة الأذن يحتاج لتنظيف؟'
    ]
  },
  {
    keywords: ['عين', 'رؤية', 'احمرار', 'حكة بالعين', 'زغللة بالعين', 'جفن', 'قرنية', 'إفرازات بالعين'],
    specialtyAr: 'طب وجراحة العيون (Ophthalmology)',
    specialtyEn: 'Ophthalmology',
    defaultCauses: ['جفاف العين الناتج عن الشاشات والطقس', 'التهاب الملتحمة (تحسسي أو بكتيري)', 'إجهاد عضلات العين وضعف إبصار', 'خدش سطحي أو جسم غريب بالعين'],
    redFlagKeywords: ['فقدان رؤية مفاجئ', 'ألم حاد جدا بالعين مع هالات', 'إصابة ميكانيكية بالعين'],
    followUpQuestions: [
      {
        question: 'هل هناك نقص أو تشوش مفاجئ في حدة الرؤية، أم مجرد احمرار وإحساس بوجود رمل أو حكة؟',
        quickOptions: ['احمرار وحكة وجفاف', 'تشوش أو رؤية هالات ملونة', 'إفرازات صديدية بالجفن', 'ألم داخل كرة العين']
      }
    ],
    comfortAdvice: [
      'استخدام قطرات ترطيب العين (الدموع الاصطناعية الخالية من المواد الحافظة).',
      'تجنب فرك العين باليدين تماماً وغسل الوجه بماء فاتر نقي.',
      'نزع العدسات اللاصقة فوراً في حال ارتدائها حتى يزول التهيج.'
    ],
    questionsForDoctor: [
      'هل أحتاج لفحص قاع عين أو قياس لضغط العين؟',
      'هل أحتاج لنظارة طبية للقراءة أو الشاشات؟'
    ]
  },
  {
    keywords: ['جلد', 'طفح', 'هرش', 'حكة', 'حبوب', 'بقع', 'إكزيما', 'حساسية جلدية', 'صدفية'],
    specialtyAr: 'الأمراض الجلدية والتناسلية (Dermatology)',
    specialtyEn: 'Dermatology',
    defaultCauses: ['حساسية تلامسية (ارتيكاريا) نتيجة مأكول أو دواء', 'إكزيما أو جفاف جلدي', 'التهاب فطري أو بكتيري سطحي', 'حب شباب أو التهاب بصيلات الشعر'],
    redFlagKeywords: ['انتفاخ الشفتين أو اللسان', 'ضيق تنفس مع الطفح', 'فقاعات مائية منتشرة'],
    followUpQuestions: [
      {
        question: 'هل ظهر الطفح فجأة بعد تناول طعام معين أو دواء جديد، وهل يصاحبه أي تورم بالوجه أو صعوبة بالتنفس؟',
        quickOptions: ['نعم ظهر بعد طعام/دواء', 'لا، بقع مزمنة تظهر تدريجياً', 'حكة شديدة تزيد بالليل', 'فقط حبوب دهنية بالوجه']
      }
    ],
    comfortAdvice: [
      'ارتداء ملابس قطنية فضفاضة واستعمال صابون طبي مرطب خالٍ من العطور.',
      'وضع كمادات ماء باردة على الأماكن المتهيجة لتسكين الحكة.',
      'في حال تورم الشفاه أو اللسان التوجه للطوارئ فوراً خشية صدمة الحساسية (Anaphylaxis).'
    ],
    questionsForDoctor: [
      'هل الطفح ناتج عن حساسية لنوع دواء معين؟',
      'ما هو الكريم الموضعي أو المرطب الطبي الأنسب لحالتي؟'
    ]
  }
];

export function analyzeInitialComplaint(
  complaintText: string,
  context: TriageContext
): {
  matchedRule: SymptomRule;
  isRedFlag: boolean;
  firstQuestion: string;
  quickOptions: string[];
} {
  const normalized = complaintText.toLowerCase();

  // Age context
  const birthYear = new Date(context.member.birthDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  const isPediatric = age <= 14;

  // Pediatric override if fever or child complaint
  if (isPediatric && (normalized.includes('سخونية') || normalized.includes('حرارة') || normalized.includes('طفل') || normalized.includes('ترجيع') || normalized.includes('تطعيم'))) {
    const pediatricRule: SymptomRule = {
      keywords: ['طفل', 'سخونية', 'حرارة', 'تسنين', 'طفح أطفال'],
      specialtyAr: 'طب الأطفال وحديثي الولادة (Pediatrics)',
      specialtyEn: 'Pediatrics',
      defaultCauses: [
        'عدوى فيروسية شائعة أو نزلة معوية/تنفسية للأطفال',
        'التهاب الأذن الوسطى أو الحلق عند الأطفال',
        'تفاعل طبيعي مؤقت بعد التطعيم أو تسنين',
        'عدوى بكتيرية محتملة تستلزم فحص الطبيب'
      ],
      redFlagKeywords: ['خمول شديد', 'رفض الرضاعة', 'تشنج', 'أقل من 3 شهور', 'بقع داكنة', 'زرقة'],
      followUpQuestions: [
        {
          question: `الطفل عمره حوالي ${age > 0 ? age + ' سنة' : 'أشهر'}. كم تبلغ درجة الحرارة تحديداً، وهل يرضع/يشرب بشكل طبيعي؟`,
          quickOptions: ['أعلى من 38.5 درجة', 'بين 37.5 و 38.5', 'يرفض الرضاعة/الطعام وخامل', 'نشاطه طبيعي وبداية تسنين']
        },
        {
          question: 'هل توجد أعراض أخرى مثل كحة، قيء، طفح جلدي، أو قلة عدد حفاضات التبول؟',
          quickOptions: ['كحة وانسداد أنف', 'قيء أو إسهال', 'طفح جلدي أحمر', 'فقط سخونة وبكاء']
        }
      ],
      comfortAdvice: [
        'إعطاء خافض حرارة آمن مخصص للأطفال بجرعة محسوبة حسب وزن الطفل (مثل الباراسيتامول).',
        'كمادات ماء فاتر عادي من الصنبور على جانبي الرقبة وتحت الإبط (تجنب الماء المثلج أو الكحول نهائياً).',
        'الحرص على استمرار الرضاعة وتقديم السوائل بانتظام لتجنب الجفاف.'
      ],
      questionsForDoctor: [
        'ما هو سبب السخونة وهل يحتاج فحص للأذن والحلق والبول؟',
        'ما هي الجرعة الدقيقة لخافض الحرارة وفقاً لوزن الطفل اليوم؟'
      ]
    };

    return {
      matchedRule: pediatricRule,
      isRedFlag: normalized.includes('تشنج') || (age === 0 && (normalized.includes('حرارة') || normalized.includes('سخونة'))),
      firstQuestion: pediatricRule.followUpQuestions[0].question,
      quickOptions: pediatricRule.followUpQuestions[0].quickOptions
    };
  }

  // Find best matching rule
  let matchedRule = SYMPTOM_RULES.find(rule =>
    rule.keywords.some(kw => normalized.includes(kw))
  );

  if (!matchedRule) {
    // Default general medicine rule
    matchedRule = {
      keywords: ['تعب', 'ألم', 'إرهاق', 'وجع'],
      specialtyAr: 'الطب الباطني العام (Internal Medicine)',
      specialtyEn: 'Internal Medicine',
      defaultCauses: ['إجهاد بدني عام أو نقص فيتامينات', 'بداية وعكة صحية فيروسية', 'اضطراب في قياسات الجسم أو التغذية'],
      redFlagKeywords: ['إغماء', 'صعوبة تنفس', 'ألم حاد لا يطاق', 'نزيف'],
      followUpQuestions: [
        {
          question: 'منذ متى بدأت هذه الأعراض، وهل تزداد في أوقات معينة من اليوم؟',
          quickOptions: ['بدأت اليوم فجأة', 'مستمرة منذ بضعة أيام', 'تزيد مع المجهود', 'أشعر بها منذ أسابيع']
        },
        {
          question: 'هل قست مؤخراً درجة الحرارة أو ضغط الدم، وهل لديك أي أمراض مزمنة كالسكر أو الضغط؟',
          quickOptions: ['قستها وطبيعية', 'توجد سخونة أو ضغط مرتفع', 'أعاني من ضغط/سكر', 'لم أقم بالقياس']
        }
      ],
      comfortAdvice: [
        'أخذ قسط وافر من الراحة والنوم لمدة لا تقل عن 8 ساعات.',
        'شرب سوائل كافية ومتابعة قياس المؤشرات الحيوية كالحرارة والضغط.',
        'استشارة طبيب الباطنة العامة لعمل الفحوصات الشاملة المبدئية.'
      ],
      questionsForDoctor: [
        'هل تنصح بعمل تحاليل صورة دم كاملة (CBC) أو وظائف كبد وكلى؟',
        'هل الأعراض مرتبطة بنمط الحياة أو نقص عناصر غذائية؟'
      ]
    };
  }

  const isRedFlag = matchedRule.redFlagKeywords.some(rf => normalized.includes(rf));

  return {
    matchedRule,
    isRedFlag,
    firstQuestion: matchedRule.followUpQuestions[0].question,
    quickOptions: matchedRule.followUpQuestions[0].quickOptions
  };
}

export function generateTriageAssessment(
  complaintText: string,
  answersText: string,
  matchedRule: SymptomRule,
  context: TriageContext
): TriageAssessment {
  const fullConversation = `${complaintText} ${answersText}`.toLowerCase();
  const redFlagsDetected: string[] = [];

  matchedRule.redFlagKeywords.forEach(rf => {
    if (fullConversation.includes(rf)) {
      redFlagsDetected.push(rf);
    }
  });

  // Chronic conditions awareness
  const memberConditions = context.member.chronicConditions || [];
  const memberAllergies = context.member.allergies || [];

  let urgency: UrgencyLevel = 'routine';
  let urgencyExplanation = 'الأعراض تشير إلى حالة روتينية مستقرة ينصح بحجز موعد للكشف الطبي المنظم.';

  if (redFlagsDetected.length > 0 || fullConversation.includes('شديد جدا') || fullConversation.includes('طوارئ') || fullConversation.includes('إغماء')) {
    urgency = 'emergency';
    urgencyExplanation = 'تنبيه طوارئ: وجود علامات تستدعي التوجه فوراً لأقرب قسم طوارئ أو الاتصال بالإسعاف (123).';
  } else if (
    fullConversation.includes('شديد') ||
    fullConversation.includes('أمس') ||
    fullConversation.includes('حرارة عالية') ||
    (memberConditions.includes('ارتفاع ضغط الدم') && matchedRule.specialtyEn === 'Cardiology')
  ) {
    urgency = 'urgent';
    urgencyExplanation = 'ينصح بالكشف الطبي العاجل خلال 24 ساعة لاطمئنان وتجنب تفاقم الأعراض.';
  }

  // Tailored causes based on patient history
  const causes = [...matchedRule.defaultCauses];
  if (memberConditions.length > 0) {
    causes.unshift(`احتمال تأثر أو تفاقم بالأمراض المزمنة المسجلة (${memberConditions.join('، ')})`);
  }

  const comfortAdvice = [...matchedRule.comfortAdvice];
  if (memberAllergies.length > 0) {
    comfortAdvice.push(`تنبيه الحساسية: المريض مسجل لديه حساسية من (${memberAllergies.join('، ')})، تجنب أي أدوية تشتق منها.`);
  }

  const summary = `شكوى مبدئية: "${complaintText}". التوجيه المقترح: عيادة ${matchedRule.specialtyAr} بمستوى إلحاح: (${urgency === 'emergency' ? 'طوارئ عاجلة' : urgency === 'urgent' ? 'كشف خلال 24 ساعة' : 'كشف روتيني'}). التاريخ المرضي المرفق: ${memberConditions.length > 0 ? memberConditions.join('، ') : 'سليم'}.`;

  return {
    primaryComplaint: complaintText,
    possibleCauses: causes,
    recommendedSpecialtyAr: matchedRule.specialtyAr,
    recommendedSpecialtyEn: matchedRule.specialtyEn,
    urgencyLevel: urgency,
    urgencyExplanationAr: urgencyExplanation,
    redFlags: redFlagsDetected,
    comfortAdvice,
    questionsForDoctor: matchedRule.questionsForDoctor,
    summaryNoteForRecord: summary
  };
}

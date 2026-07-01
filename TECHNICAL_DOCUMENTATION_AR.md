# التوثيق التقني - ربط صفحة حجز الموعد بنموذج المريض

## 📋 نظرة عامة

تم تعديل تطبيق الويب لربط صفحة نموذج المريض بصفحة حجز الموعد بشكل سلس، حيث يتم نقل معرّف المريض تلقائياً دون الحاجة لإدخال يدوي.

---

## 🔧 التعديلات التقنية

### 1. AppointmentBooking.jsx

#### قبل التعديل:
```javascript
const [patientFormId] = useState(initialPatientFormId);
const [patientName, setPatientName] = useState(initialPatientName);

// في handleSubmit
const canLinkRemoteForm = isMongoObjectId(patientFormId);
if (!canLinkRemoteForm && !patientName.trim()) {
  setMessage({ type: 'error', text: t('appointmentBooking.patientNameRequired') });
  return;
}
```

#### بعد التعديل:
```javascript
const [patientFormId] = useState(initialPatientFormId);
const [patientName] = useState(initialPatientName);
const hasPatientFormId = isMongoObjectId(patientFormId);

// في handleSubmit
if (!hasPatientFormId && !patientName.trim()) {
  setMessage({ type: 'error', text: t('appointmentBooking.patientNameRequired') });
  return;
}

// إرسال البيانات
if (hasPatientFormId) {
  appointmentPayload.patientFormId = patientFormId;
} else {
  appointmentPayload.patientName = patientName.trim();
}
```

#### التغييرات الرئيسية:
1. **جعل `patientName` ثابتاً**: لا يمكن تعديله بعد التحميل الأولي
2. **إضافة `hasPatientFormId`**: متغير للتحقق من صحة معرّف المريض
3. **تعديل الشرط**: التحقق من `hasPatientFormId` بدلاً من استدعاء الدالة كل مرة

---

### 2. واجهة المستخدم (UI)

#### عرض شرطي لحقل اسم المريض:

```javascript
{!hasPatientFormId && (
  <label>
    {t('appointmentBooking.patientName')}
    <input
      type="text"
      value={patientName}
      placeholder={t('appointmentBooking.patientNamePlaceholder')}
      readOnly
    />
  </label>
)}

{hasPatientFormId && (
  <div className="appointment-info-display">
    <label>{t('appointmentBooking.patientName')}</label>
    <div className="patient-info-value">{patientName}</div>
  </div>
)}
```

#### المنطق:
- إذا **لا يوجد** `patientFormId` صحيح: عرض حقل إدخال (readOnly)
- إذا **يوجد** `patientFormId` صحيح: عرض القيمة كمعلومات (غير قابلة للتعديل)

---

### 3. CSS الجديد

```css
.appointment-info-display {
   display: grid;
   gap: 8px;
}

.appointment-info-display label {
   font-weight: 600;
   color: #2b2f45;
}

.patient-info-value {
   padding: 12px 14px;
   border-radius: 12px;
   background: #f0f2f8;
   color: #1f2430;
   font-size: 1rem;
   border: 1px solid #e6e8f0;
}
```

#### التأثير البصري:
- خلفية فاتحة (#f0f2f8) للفصل عن حقول الإدخال
- نفس الحدود والزوايا المدورة للاتساق
- نص معتم للإشارة إلى أنها معلومات للقراءة فقط

---

## 🔄 سير العمل التفصيلي

### الخطوة 1: ملء نموذج المريض
```javascript
// في PatientForm.jsx
const payload = {
  language: currentLanguage,
  patient: {
    firstName: "أحمد",
    lastName: "محمد",
    birthDate: "1990-01-15",
    phone: "0501234567",
    email: "ahmed@example.com",
    // ... باقي البيانات
  },
  doctorId: selectedDoctorId,
  // ... باقي الحقول
};

const response = await patientFormApi.submit(payload);
const returnedId = response.data?.data?._id;
```

### الخطوة 2: حفظ المعرّف والتنقل
```javascript
// يتم تنفيذها تلقائياً في PatientForm.jsx
if (returnedId) {
  localStorage.setItem('patientFormId', returnedId);
  
  const appointmentContext = {
    patientFormId: returnedId,
    patientName: "أحمد محمد",
    language: currentLanguage,
  };
  sessionStorage.setItem('pendingAppointmentContext', JSON.stringify(appointmentContext));
  
  navigate(`/appointments/new?patientFormId=${returnedId}&lng=${currentLanguage}`, {
    state: appointmentContext
  });
}
```

### الخطوة 3: استقبال البيانات في صفحة حجز الموعد
```javascript
// في AppointmentBooking.jsx
const initialPatientFormId =
  location.state?.patientFormId ||           // من state
  searchParams.get('patientFormId') ||       // من URL
  pendingContext.patientFormId ||            // من sessionStorage
  localStorage.getItem('patientFormId') ||   // من localStorage
  '';

const initialPatientName =
  location.state?.patientName ||
  searchParams.get('patientName') ||
  pendingContext.patientName ||
  '';

const [patientFormId] = useState(initialPatientFormId);
const [patientName] = useState(initialPatientName);
const hasPatientFormId = isMongoObjectId(patientFormId);
```

### الخطوة 4: إرسال الموعد
```javascript
const appointmentPayload = {
  appointmentDate: "2026-07-15",
  appointmentTime: "10:00",
  notes: "بدون ملاحظات",
  language: "ar",
};

// التحديد التلقائي
if (hasPatientFormId) {
  appointmentPayload.patientFormId = patientFormId;
} else {
  appointmentPayload.patientName = patientName.trim();
}

await appointmentApi.create(appointmentPayload);
```

---

## 🛡️ الفحوصات والتحقق

### 1. التحقق من صحة معرّف MongoDB
```javascript
const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(value || '');

// أمثلة:
isMongoObjectId('507f1f77bcf86cd799439011');  // true ✓
isMongoObjectId('invalid-id');                  // false ✗
isMongoObjectId('');                            // false ✗
```

### 2. التحقق من المدخلات قبل الإرسال
```javascript
// يجب أن يكون أحدهما موجوداً
if (!hasPatientFormId && !patientName.trim()) {
  // خطأ: لا يوجد معرّف ولا اسم
  setMessage({ 
    type: 'error', 
    text: t('appointmentBooking.patientNameRequired') 
  });
  return;
}

// يجب اختيار وقت
if (!selectedTime) {
  setMessage({ 
    type: 'error', 
    text: t('appointmentBooking.timeRequired') 
  });
  return;
}
```

### 3. التنظيف بعد النجاح
```javascript
// بعد الإرسال الناجح
setSelectedTime('');
setNotes('');
sessionStorage.removeItem('pendingAppointmentContext');
localStorage.removeItem('patientFormId');
navigate('/appointments');
```

---

## 📊 حالات الاستخدام المدعومة

| الحالة | patientFormId | patientName | السلوك |
|--------|---------------|-------------|--------|
| من النموذج | ✓ موجود | ✓ معروض | يتم إرسال patientFormId |
| من URL | ✓ في query | ✓ في query | يتم إرسال patientFormId |
| وصول مباشر | ✗ غير موجود | ✗ فارغ | رسالة خطأ |
| وصول مباشر | ✗ غير موجود | ✓ معروض | يتم إرسال patientName |

---

## 🔍 تتبع البيانات

```
📍 نقطة البداية (PatientForm)
   └─ يتم ملء النموذج بالبيانات الكاملة
   └─ نقرة زر Submit

📍 Backend API
   └─ حفظ البيانات في MongoDB
   └─ إرجاع: { _id: "507f..." }

📍 Frontend Storage
   └─ localStorage: patientFormId = "507f..."
   └─ sessionStorage: pendingAppointmentContext = {...}

📍 URL/State
   └─ URL: /appointments/new?patientFormId=507f&lng=ar
   └─ State: { patientFormId, patientName, language }

📍 AppointmentBooking
   └─ استقبال جميع المصادر
   └─ عرض اسم المريض (غير قابل للتعديل)
   └─ تحديد تاريخ ووقت الموعد

📍 Appointment Submission
   └─ طلب: { appointmentDate, appointmentTime, patientFormId }
   └─ Backend: حفظ مع ربط patientFormId
   └─ تنظيف وإعادة توجيه

📍 الانتهاء
   └─ صفحة المواعيد: عرض الموعد المحفوظ
```

---

## ⚙️ المتغيرات البيئية

لا توجد متغيرات بيئية جديدة مطلوبة. النظام يستخدم:
- `localStorage` للتخزين المستمر
- `sessionStorage` للتخزين المؤقت
- `URL parameters` لنقل البيانات
- `React Router state` للحفاظ على السياق

---

## 📝 الملاحظات المهمة

1. **الأمان**: معرّف MongoDB يتم التحقق منه بـ regex
2. **المرونة**: يدعم عدة مصادر للبيانات
3. **التنظيف**: البيانات المؤقتة تُحذف بعد النجاح
4. **التوافق**: يدعم الوصول المباشر بدون PatientForm

---

## 🐛 استكشاف الأخطاء

### المشكلة: "patientName مطلوب"
```
السبب: لا توجد قيمة patientFormId ولا patientName
الحل: تأكد من القدوم من صفحة PatientForm أو تمرير البيانات عبر URL
```

### المشكلة: "الموعد لم يُربط بالمريض"
```
السبب: لم يتم إرسال patientFormId
الحل: تحقق من حفظ patientFormId في localStorage
```

### المشكلة: "البيانات لم تُمرر صحيحاً"
```
السبب: مشكلة في JSON.parse للـ sessionStorage
الحل: افتح DevTools وتحقق من القيم المخزنة
```

---

## 🚀 الخطوات التالية

1. اختبار التطبيق من PatientForm إلى AppointmentBooking
2. التحقق من حفظ الموعد في المواعيد
3. اختبار الوصول المباشر إلى صفحة حجز الموعد
4. التحقق من الملاحظات والدعم متعدد اللغات


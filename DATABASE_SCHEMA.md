# بنية قاعدة البيانات - معاً نَبني

## مبادئ التصميم

### ✅ المعرفات (IDs)
- جميع الجداول الفرعية تستخدم **المعرفات (IDs)** وليس الأسماء
- المعرفات من نوع UUID v4 (string)
- مثال: `family_id`, `donor_id`, `neighborhood_id`, `category_id`

### ✅ التواريخ (Timestamps)
- جميع التواريخ مخزنة كـ **datetime** بالميلادي
- المنطقة الزمنية: **UTC** (`timezone.utc`)
- الحقول الأساسية: `created_at`, `updated_at`

---

## 1. جدول المستخدمين (users)

```python
{
    "id": "uuid",                          # المعرف الفريد
    "email": "string",                     # البريد الإلكتروني
    "full_name": "string",                 # الاسم الكامل
    "password_hash": "string",             # كلمة المرور المشفرة
    "role": "string",                      # الدور (admin, user, committee_member, etc.)
    "neighborhood_id": "uuid",             # ✅ معرف الحي (ID)
    "phone": "string",
    "committee_member_id": "uuid",         # ✅ معرف عضو اللجنة (ID)
    "is_active": "boolean",
    "created_at": "datetime (UTC)",        # ✅ التاريخ بالميلادي
    "updated_at": "datetime (UTC)"         # ✅ التاريخ بالميلادي
}
```

---

## 2. جدول العائلات (families)

```python
{
    "id": "uuid",                          # المعرف الفريد
    "family_number": "string",             # رقم العائلة (تلقائي)
    "family_code": "string",               # رمز العائلة
    "fac_name": "string",                  # الاسم المستعار
    "name": "string",                      # الاسم الحقيقي
    "phone": "string",
    "provider_first_name": "string",       # اسم المعيل
    "provider_father_name": "string",
    "provider_surname": "string",
    "members_count": "integer",
    "description": "string",
    "monthly_need": "float",
    
    # العلاقات - باستخدام IDs
    "neighborhood_id": "uuid",             # ✅ معرف الحي
    "category_id": "uuid",                 # ✅ معرف التصنيف
    "income_level_id": "uuid",             # ✅ معرف مستوى الدخل
    "need_assessment_id": "uuid",          # ✅ معرف تقييم الاحتياج
    "created_by_user_id": "uuid",          # ✅ معرف المستخدم المنشئ
    "updated_by_user_id": "uuid",          # ✅ معرف آخر محدث
    
    "male_children_count": "integer",
    "female_children_count": "integer",
    "father_present": "boolean",
    "mother_present": "boolean",
    "current_sponsors": "integer",
    "images": ["string"],                  # قائمة روابط الصور
    "status": "string",
    "is_active": "boolean",
    "created_at": "datetime (UTC)",        # ✅ التاريخ بالميلادي
    "updated_at": "datetime (UTC)"         # ✅ التاريخ بالميلادي
}
```

---

## 3. جدول التبرعات (donations)

```python
{
    "id": "uuid",                          # المعرف الفريد
    
    # العلاقات - باستخدام IDs
    "family_id": "uuid",                   # ✅ معرف العائلة المستفيدة
    "donor_id": "uuid",                    # ✅ معرف المتبرع (إذا مسجل)
    "created_by_user_id": "uuid",          # ✅ معرف من سجل التبرع
    
    # معلومات المتبرع (نسخة للأرشفة)
    "donor_name": "string",                # اسم المتبرع (للأرشفة)
    "donor_phone": "string",
    "donor_email": "string",
    
    # تفاصيل التبرع
    "donation_type": "string",             # مالية، عينية، خدمية
    "amount": "string",                    # المبلغ أو الكمية
    "description": "string",
    "notes": "string",
    "status": "string",                    # معلق، قيد التنفيذ، مكتمل
    "is_active": "boolean",
    "created_at": "datetime (UTC)",        # ✅ التاريخ بالميلادي
}
```

**ملاحظة هامة:**
- `donor_id`: معرف المتبرع المسجل في النظام
- `donor_name`: نسخة من الاسم للأرشفة (حتى لو تغير اسم المستخدم)

---

## 4. جدول احتياجات العائلات (family_needs)

```python
{
    "id": "uuid",                          # المعرف الفريد
    
    # العلاقات - باستخدام IDs
    "family_id": "uuid",                   # ✅ معرف العائلة
    "need_id": "uuid",                     # ✅ معرف نوع الاحتياج
    "created_by_user_id": "uuid",          # ✅ معرف من أضاف الاحتياج
    "updated_by_user_id": "uuid",          # ✅ معرف من عدل الاحتياج
    
    # التفاصيل
    "amount": "string",                    # الكمية أو المقدار
    "notes": "string",
    "is_active": "boolean",
    "created_at": "datetime (UTC)",        # ✅ التاريخ بالميلادي
    "updated_at": "datetime (UTC)"         # ✅ التاريخ بالميلادي
}
```

---

## 5. الجداول المرجعية (Reference Tables)

### 5.1 الأحياء (neighborhoods)

```python
{
    "id": "uuid",
    "name": "string",
    "description": "string",
    "is_active": "boolean",
    "created_at": "datetime (UTC)",        # ✅ التاريخ بالميلادي
    "updated_at": "datetime (UTC)"         # ✅ التاريخ بالميلادي
}
```

### 5.2 تصنيفات العائلات (family_categories)

```python
{
    "id": "uuid",
    "name": "string",
    "description": "string",
    "color": "string",                     # لون التصنيف
    "icon": "string",
    "display_order": "integer",
    "is_active": "boolean",
    "created_at": "datetime (UTC)",        # ✅ التاريخ بالميلادي
    "updated_at": "datetime (UTC)"         # ✅ التاريخ بالميلادي
}
```

### 5.3 مستويات الدخل (income_levels)

```python
{
    "id": "uuid",
    "name": "string",
    "description": "string",
    "min_income": "float",
    "max_income": "float",
    "display_order": "integer",
    "is_active": "boolean",
    "created_at": "datetime (UTC)",        # ✅ التاريخ بالميلادي
    "updated_at": "datetime (UTC)"         # ✅ التاريخ بالميلادي
}
```

### 5.4 تقييمات الاحتياج (need_assessments)

```python
{
    "id": "uuid",
    "name": "string",
    "description": "string",
    "color": "string",
    "display_order": "integer",
    "is_active": "boolean",
    "created_at": "datetime (UTC)",        # ✅ التاريخ بالميلادي
    "updated_at": "datetime (UTC)"         # ✅ التاريخ بالميلادي
}
```

### 5.5 أنواع الاحتياجات (needs)

```python
{
    "id": "uuid",
    "name": "string",
    "description": "string",
    "category": "string",
    "is_active": "boolean",
    "created_at": "datetime (UTC)",        # ✅ التاريخ بالميلادي
}
```

---

## 6. لجان الأحياء (neighborhood_committees)

```python
{
    "id": "uuid",
    "neighborhood_id": "uuid",             # ✅ معرف الحي
    "president_user_id": "uuid",           # ✅ معرف رئيس اللجنة
    "member_ids": ["uuid"],                # ✅ قائمة معرفات الأعضاء
    "is_active": "boolean",
    "created_at": "datetime (UTC)",        # ✅ التاريخ بالميلادي
    "updated_at": "datetime (UTC)"         # ✅ التاريخ بالميلادي
}
```

---

## 7. الحالات الصحية (health_cases)

```python
{
    "id": "uuid",
    "family_id": "uuid",                   # ✅ معرف العائلة (إذا كانت مرتبطة)
    "patient_name": "string",
    "age": "integer",
    "condition": "string",
    "required_amount": "float",
    "collected_amount": "float",
    "description": "string",
    "status": "string",
    "is_active": "boolean",
    "created_at": "datetime (UTC)",        # ✅ التاريخ بالميلادي
}
```

---

## ملخص المبادئ

### ✅ استخدام المعرفات (IDs)
1. **جميع العلاقات** تستخدم معرفات UUID v4
2. **لا يتم تخزين الأسماء** في الجداول الفرعية
3. **الأسماء تُجلب** من الجداول الرئيسية عند الحاجة

### ✅ استخدام Timestamps بالميلادي
1. جميع التواريخ بصيغة **datetime**
2. المنطقة الزمنية: **UTC**
3. يتم التحويل للتوقيت المحلي في الواجهة فقط

### ✅ الأرشفة
- بعض الحقول مثل `donor_name` تُحفظ **نسخة** من البيانات للأرشفة
- هذا يضمن سلامة السجلات التاريخية حتى لو تغيرت البيانات الأصلية

---

## أمثلة على الاستعلامات

### مثال 1: جلب تبرع مع معلومات العائلة والمتبرع

```python
# جلب التبرع
donation = await db.donations.find_one({"id": donation_id})

# جلب العائلة باستخدام family_id
family = await db.families.find_one({"id": donation['family_id']})

# جلب المتبرع باستخدام donor_id (إذا كان مسجلاً)
if donation['donor_id']:
    donor = await db.users.find_one({"id": donation['donor_id']})
```

### مثال 2: جلب عائلة مع جميع العلاقات

```python
family = await db.families.find_one({"id": family_id})

# جلب الحي
neighborhood = await db.neighborhoods.find_one({"id": family['neighborhood_id']})

# جلب التصنيف
category = await db.family_categories.find_one({"id": family['category_id']})

# جلب مستوى الدخل
income_level = await db.income_levels.find_one({"id": family['income_level_id']})

# جلب تقييم الاحتياج
need_assessment = await db.need_assessments.find_one({"id": family['need_assessment_id']})
```

---

**آخر تحديث:** نوفمبر 2025
**النسخة:** 1.0

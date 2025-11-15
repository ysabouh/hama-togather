import React from 'react';
import GenericReferenceTab from './GenericReferenceTab';
import UserRolesTab from './UserRolesTab';

/**
 * مكون لإدارة جميع البيانات المرجعية في النظام
 * يشمل: أدوار المستخدمين، المناصب، الأعمال، المؤهلات، فئات العائلات، مستويات الدخل، تقييمات الاحتياج، والاحتياجات
 */
const ReferenceDataManagement = ({ 
  type, 
  data, 
  loading, 
  onDataChange,
  createdByUsers = [] // قائمة المستخدمين لعرض اسم من أنشأ/عدّل السجل
}) => {
  // تكوينات أدوار المستخدمين
  if (type === 'user-roles') {
    return (
      <UserRolesTab 
        userRoles={data} 
        loading={loading} 
        onDataChange={onDataChange} 
      />
    );
  }

  // تكوينات المناصب
  if (type === 'positions') {
    return (
      <GenericReferenceTab
        title="المناصب"
        endpoint="positions"
        data={data}
        loading={loading}
        onDataChange={onDataChange}
        fields={[
          { name: 'title', label: 'المسمى الوظيفي', required: true, placeholder: 'مثل: رئيس اللجنة، عضو لجنة' }
        ]}
        columns={[
          { key: 'title', label: 'المسمى الوظيفي', className: 'text-gray-900 font-medium' }
        ]}
        createButtonText="إضافة منصب"
      />
    );
  }

  // تكوينات الأعمال
  if (type === 'jobs') {
    return (
      <GenericReferenceTab
        title="قائمة الأعمال"
        endpoint="jobs"
        data={data}
        loading={loading}
        onDataChange={onDataChange}
        fields={[
          { name: 'title', label: 'المسمى الوظيفي', required: true, placeholder: 'مثل: مهندس، طبيب، معلم' }
        ]}
        columns={[
          { key: 'title', label: 'المسمى الوظيفي', className: 'text-gray-900 font-medium' }
        ]}
        createButtonText="إضافة عمل"
      />
    );
  }

  // تكوينات المؤهلات الدراسية
  if (type === 'education') {
    return (
      <GenericReferenceTab
        title="المؤهلات الدراسية"
        endpoint="education-levels"
        data={data}
        loading={loading}
        onDataChange={onDataChange}
        fields={[
          { name: 'title', label: 'المؤهل الدراسي', required: true, placeholder: 'مثل: ثانوية عامة، بكالوريوس، ماجستير' }
        ]}
        columns={[
          { key: 'title', label: 'المؤهل الدراسي', className: 'text-gray-900 font-medium' }
        ]}
        createButtonText="إضافة مؤهل"
      />
    );
  }

  // تكوينات فئات العائلات
  if (type === 'family-categories') {
    return (
      <GenericReferenceTab
        title="تصنيف العائلات"
        endpoint="family-categories"
        data={data}
        loading={loading}
        onDataChange={onDataChange}
        fields={[
          { name: 'name', label: 'اسم التصنيف', required: true, placeholder: 'مثل: أولوية قصوى، متوسطة، منخفضة' },
          { name: 'color', label: 'اللون', required: false, type: 'color', placeholder: '#3b82f6', defaultValue: '#3b82f6' },
          { name: 'description', label: 'الوصف', required: false, type: 'textarea', placeholder: 'وصف التصنيف...' }
        ]}
        columns={[
          { key: 'name', label: 'اسم التصنيف', className: 'text-gray-900 font-medium' },
          { 
            key: 'color', 
            label: 'اللون', 
            render: (item) => item.color ? (
              <div className="flex items-center justify-center gap-2">
                <div 
                  className="w-6 h-6 rounded border border-gray-300" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-500">{item.color}</span>
              </div>
            ) : '-'
          },
          { key: 'description', label: 'الوصف', className: 'text-gray-600' }
        ]}
        createButtonText="إضافة تصنيف"
      />
    );
  }

  // تكوينات مستويات الدخل
  if (type === 'income-levels') {
    return (
      <GenericReferenceTab
        title="مستويات الدخل الشهري"
        endpoint="income-levels"
        data={data}
        loading={loading}
        onDataChange={onDataChange}
        fields={[
          { name: 'name', label: 'اسم المستوى', required: true, placeholder: 'مثل: دخل منخفض، متوسط، مرتفع' },
          { name: 'min_amount', label: 'الحد الأدنى', required: false, type: 'number', placeholder: '0', defaultValue: 0 },
          { name: 'max_amount', label: 'الحد الأقصى', required: false, type: 'number', placeholder: '1000000', defaultValue: null },
          { name: 'description', label: 'الوصف', required: false, type: 'textarea', placeholder: 'وصف مستوى الدخل...' }
        ]}
        columns={[
          { key: 'name', label: 'اسم المستوى', className: 'text-gray-900 font-medium' },
          { 
            key: 'min_amount', 
            label: 'الحد الأدنى', 
            className: 'text-gray-600',
            render: (item) => item.min_amount ? item.min_amount.toLocaleString('ar-SA') : '-'
          },
          { 
            key: 'max_amount', 
            label: 'الحد الأقصى', 
            className: 'text-gray-600',
            render: (item) => item.max_amount ? item.max_amount.toLocaleString('ar-SA') : 'غير محدود'
          },
          { key: 'description', label: 'الوصف', className: 'text-gray-600' }
        ]}
        createButtonText="إضافة مستوى دخل"
      />
    );
  }

  // تكوينات تقييمات الاحتياج
  if (type === 'need-assessments') {
    return (
      <GenericReferenceTab
        title="تقييم الاحتياج"
        endpoint="need-assessments"
        data={data}
        loading={loading}
        onDataChange={onDataChange}
        fields={[
          { name: 'name', label: 'اسم التقييم', required: true, placeholder: 'مثل: عاجل، متوسط، منخفض' },
          { name: 'priority', label: 'الأولوية (رقم)', required: true, type: 'number', placeholder: '1', defaultValue: 1 },
          { name: 'color', label: 'اللون', required: true, type: 'color', placeholder: '#ff0000', defaultValue: '#3b82f6' },
          { name: 'description', label: 'الوصف', required: false, type: 'textarea', placeholder: 'وصف التقييم...' }
        ]}
        columns={[
          { key: 'name', label: 'اسم التقييم', className: 'text-gray-900 font-medium' },
          { key: 'priority', label: 'الأولوية', className: 'text-gray-600' },
          { 
            key: 'color', 
            label: 'اللون', 
            render: (item) => (
              <div className="flex items-center justify-center gap-2">
                <div 
                  className="w-6 h-6 rounded border border-gray-300" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-500">{item.color}</span>
              </div>
            )
          },
          { key: 'description', label: 'الوصف', className: 'text-gray-600' }
        ]}
        createButtonText="إضافة تقييم"
      />
    );
  }

  // تكوينات الاحتياجات
  if (type === 'needs') {
    return (
      <GenericReferenceTab
        title="الاحتياجات"
        endpoint="needs"
        data={data}
        loading={loading}
        onDataChange={onDataChange}
        fields={[
          { name: 'name', label: 'اسم الاحتياج', required: true, placeholder: 'مثل: مواد غذائية، أدوية، ملابس' },
          { name: 'default_amount', label: 'المبلغ الافتراضي', required: false, type: 'number', placeholder: '0', defaultValue: 0 },
          { name: 'description', label: 'الوصف', required: false, type: 'textarea', placeholder: 'وصف الاحتياج...' }
        ]}
        columns={[
          { key: 'name', label: 'اسم الاحتياج', className: 'text-gray-900 font-medium' },
          { 
            key: 'default_amount', 
            label: 'المبلغ الافتراضي', 
            className: 'text-gray-600',
            render: (item) => item.default_amount ? item.default_amount.toLocaleString('ar-SA') : '-'
          },
          { key: 'description', label: 'الوصف', className: 'text-gray-600' },
          { 
            key: 'created_by_user_id', 
            label: 'أنشأ بواسطة', 
            className: 'text-gray-500 text-xs',
            render: (item) => {
              const user = createdByUsers.find(u => u.id === item.created_by_user_id);
              return user ? user.username : '-';
            }
          }
        ]}
        createButtonText="إضافة احتياج"
      />
    );
  }

  return <div>نوع البيانات غير مدعوم</div>;
};

export default ReferenceDataManagement;

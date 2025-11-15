// تنسيق react-select بالعربية
export const customSelectStyles = {
  control: (base) => ({
    ...base,
    textAlign: 'right',
    minHeight: '42px',
  }),
  menu: (base) => ({
    ...base,
    textAlign: 'right',
  }),
  placeholder: (base) => ({
    ...base,
    textAlign: 'right',
  }),
  singleValue: (base) => ({
    ...base,
    textAlign: 'right',
  }),
};

// دالة لحساب العمر من تاريخ الميلاد
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // إذا لم يحن موعد عيد الميلاد هذا العام بعد، نطرح سنة
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// دالة لتنسيق التاريخ
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// دالة لتنسيق الوقت
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

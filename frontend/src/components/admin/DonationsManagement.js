import React from 'react';
import { Heart } from 'lucide-react';

const DonationsManagement = ({ donations = [] }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Heart className="w-7 h-7 text-red-600" />
        سجل التبرعات
      </h2>
      
      {donations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>لا توجد تبرعات مسجلة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {donations.map((donation) => (
            <div key={donation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{donation.donor_name}</h3>
                  <p className="text-sm text-gray-600">النوع: {donation.type}</p>
                  {donation.amount && (
                    <p className="text-sm text-gray-600">
                      المبلغ: {donation.amount.toLocaleString()} ل.س
                    </p>
                  )}
                  {donation.family_name && (
                    <p className="text-sm text-gray-600">
                      العائلة: {donation.family_name}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  donation.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : donation.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {donation.status === 'pending' ? 'قيد المعالجة' : 
                   donation.status === 'completed' ? 'مكتمل' : 'ملغي'}
                </span>
              </div>
              {donation.created_at && (
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(donation.created_at).toLocaleDateString('ar-SA')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonationsManagement;

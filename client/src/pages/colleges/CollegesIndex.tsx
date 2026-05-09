import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function CollegesIndex() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/colleges').then((res) => setColleges(res.data.colleges)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-7xl mx-auto py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Universities &amp; Colleges</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {colleges.map((college) => (
            <div key={college.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden">
              {/* Gradient Banner */}
              <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                <div className="absolute -bottom-8 left-6">
                  <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl font-bold text-indigo-700 border border-slate-100">
                    {college.logo ? (
                      <img src={college.logo} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      college.name?.charAt(0) || 'U'
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-10 px-6 pb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  <Link to={`/colleges/${college.slug}`} className="hover:underline">
                    {college.name}
                  </Link>
                  {college.isVerified && (
                    <i className="fa-solid fa-circle-check text-blue-500 text-sm ml-1" title="Verified Institution" />
                  )}
                </h2>
                <p className="text-sm text-gray-500 mb-4">{college.domain || 'No domain registered'}</p>
                {college.description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">{college.description}</p>
                )}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                  <span className="text-xs text-slate-500">
                    <i className="fa-solid fa-users mr-1" /> {college.studentsCount ?? 0} students
                  </span>
                  <Link to={`/colleges/${college.slug}`} className="text-indigo-600 font-medium text-sm hover:text-indigo-800">
                    Visit Campus <i className="fa-solid fa-arrow-right ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {colleges.length === 0 && (
          <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-lg">
            <i className="fa-solid fa-graduation-cap text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-700">No colleges registered yet</h3>
            <p className="text-gray-500 text-sm">Institutions will appear here once they register.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { formatDate } from '../../utils/dateFormatting';

interface TextResponse {
  question: string;
  category: string;
  answer: string;
  submittedAt: string;
}

interface AnonymizedFeedbackProps {
  responses: TextResponse[] | { message: string; minimumRequired: number; currentCount: number };
  courseId?: number;
  courseName?: string;
}

const AnonymizedFeedback: React.FC<AnonymizedFeedbackProps> = ({
  responses,
  courseId,
  courseName
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Check if responses is the "not enough evaluations" object
  const isInsufficientData = !Array.isArray(responses);

  if (isInsufficientData) {
    const data = responses as { message: string; minimumRequired: number; currentCount: number };
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Feedback text indisponibil
            </h3>
            <p className="text-sm text-yellow-800 mb-2">{data.message}</p>
            <p className="text-sm text-yellow-700">
              Pentru a proteja anonimitatea studenților, feedback-ul text este afișat doar când
              cursul are cel puțin <strong>{data.minimumRequired} evaluări</strong>.
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Evaluări actuale: <strong>{data.currentCount}</strong> / {data.minimumRequired}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const textResponses = responses as TextResponse[];

  // Get unique categories
  const categories = ['all', ...new Set(textResponses.map(r => r.category))];

  // Filter responses
  const filteredResponses = textResponses.filter(response => {
    const matchesCategory = selectedCategory === 'all' || response.category === selectedCategory;
    const matchesSearch = searchTerm === '' ||
      response.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.question.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Didactică': 'bg-info-bg text-info-fg',
      'Comunicare': 'bg-green-100 text-green-700',
      'Organizare': 'bg-purple-100 text-purple-700',
      'Evaluare': 'bg-orange-100 text-orange-700',
      'Resurse': 'bg-pink-100 text-pink-700',
      'General': 'bg-neutral-100 text-neutral-700'
    };
    return colors[category] || 'bg-neutral-100 text-neutral-700';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-info-bg border-l-4 border-blue-400 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-info-fg flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Feedback anonim</h3>
            <p className="text-sm text-info-fg mt-1">
              Toate răspunsurile sunt anonime. Nu puteți identifica studenții care au lăsat feedback-ul.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Caută în răspunsuri
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Caută după cuvinte cheie..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="sm:w-64">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Filtrează după categorie
          </label>
          <select
            className="w-full border border-neutral-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Toate categoriile</option>
            {categories.slice(1).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-neutral-500">
        Se afișează <strong>{filteredResponses.length}</strong> din <strong>{textResponses.length}</strong> răspunsuri
      </div>

      {/* Responses List */}
      {filteredResponses.length === 0 ? (
        <div className="text-center py-12 bg-neutral-25 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-800">Nu s-au găsit rezultate</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Încearcă să modifici filtrele sau termenul de căutare.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResponses.map((response, index) => (
            <div
              key={index}
              className="bg-white border border-neutral-200 rounded-lg p-5 hover:border-neutral-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-semibold text-neutral-800 flex-1">
                  {response.question}
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ml-3 ${getCategoryColor(response.category)}`}>
                  {response.category}
                </span>
              </div>
              <p className="text-neutral-700 leading-relaxed mb-3">
                {response.answer}
              </p>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(response.submittedAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnonymizedFeedback;

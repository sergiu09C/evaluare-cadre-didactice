import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';

function renderMarkdown(md: string): React.ReactNode {
  // Minimal MD renderer: headings (## / ###), bold (**), bullet lists, paragraphs, kbd.
  // Sufficient for guides edited as markdown in admin textarea.
  const lines = md.split('\n');
  const out: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  const flushList = () => {
    if (listBuffer.length === 0) return;
    out.push(
      <ul key={`ul-${out.length}`} className="list-disc list-inside space-y-1 ml-2 text-neutral-700">
        {listBuffer.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: applyInline(item) }} />
        ))}
      </ul>,
    );
    listBuffer = [];
  };
  const applyInline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code class="font-mono text-xs px-1 py-0.5 bg-neutral-100 rounded">$1</code>');

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) {
      flushList();
      return;
    }
    if (line.startsWith('## ')) {
      flushList();
      out.push(
        <h2 key={`h2-${idx}`} className="font-display text-lg font-semibold text-neutral-800 mt-6">
          {line.slice(3)}
        </h2>,
      );
      return;
    }
    if (line.startsWith('### ')) {
      flushList();
      out.push(
        <h3 key={`h3-${idx}`} className="font-display text-base font-semibold text-neutral-800 mt-4">
          {line.slice(4)}
        </h3>,
      );
      return;
    }
    if (line.startsWith('- ')) {
      listBuffer.push(line.slice(2));
      return;
    }
    flushList();
    out.push(
      <p
        key={`p-${idx}`}
        className="text-neutral-700 text-[15px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: applyInline(line) }}
      />,
    );
  });
  flushList();
  return out;
}

export default function DynamicGuide({ role }: { role: 'student' | 'professor' | 'admin' }) {
  const [guide, setGuide] = useState<{ title: string; body: string; updated_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getGuide(role)
      .then(setGuide)
      .catch((e) => setError(e.response?.data?.error || 'Ghid indisponibil'))
      .finally(() => setLoading(false));
  }, [role]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600 mx-auto mb-4" aria-hidden="true" />
        <div className="text-neutral-500 text-sm">Se încarcă ghidul...</div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="text-center py-16">
        <p className="text-danger-fg">{error}</p>
      </div>
    );
  }

  const backTo = role === 'admin' ? '/admin' : role === 'professor' ? '/professor' : '/';

  return (
    <div className="flex flex-col gap-7 max-w-[860px] mx-auto">
      <div>
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-800 mb-4 no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 rounded px-1"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Înapoi la pagina principală
        </Link>
        <h1 className="font-display text-2xl md:text-[30px] font-semibold tracking-tight text-neutral-800">{guide.title}</h1>
        <p className="text-xs text-neutral-400 mt-2">
          Actualizat: {new Date(guide.updated_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      <Card className="space-y-3">{renderMarkdown(guide.body)}</Card>
    </div>
  );
}

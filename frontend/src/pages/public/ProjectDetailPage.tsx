import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Github } from 'lucide-react';

import { apiData } from '@/lib/api';
import type { Project } from '@/lib/types';
import { Reveal, Spinner, ErrorState } from '@/components/ui';

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError('');
    apiData<Project>(`/projects/${slug}`)
      .then(setProject)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container-content">
        <Spinner />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container-content py-16">
        <ErrorState message={error || 'Proyek tidak ditemukan.'} />
        <Link
          to="/projects"
          className="mt-6 inline-flex items-center gap-2 font-mono text-sm text-mist-400 hover:text-accent"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          kembali ke proyek
        </Link>
      </div>
    );
  }

  const tech = project.tech_stack
    ? project.tech_stack.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <article className="container-content py-16">
      <Reveal>
        <Link
          to="/projects"
          className="mb-8 inline-flex items-center gap-2 font-mono text-xs text-mist-600 hover:text-accent"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          projects
        </Link>

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-mist-50 sm:text-3xl">
            {project.title}
          </h1>
          {project.year && <span className="font-mono text-sm text-mist-600">{project.year}</span>}
        </div>

        {project.summary && (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-mist-400">{project.summary}</p>
        )}

        {tech.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {tech.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        )}

        {(project.live_url || project.repo_url) && (
          <div className="mt-8 flex flex-wrap gap-3">
            {project.live_url && (
              <a href={project.live_url} target="_blank" rel="noreferrer noopener" className="btn-primary">
                Lihat Live
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            )}
            {project.repo_url && (
              <a href={project.repo_url} target="_blank" rel="noreferrer noopener" className="btn-outline">
                <Github size={15} aria-hidden="true" />
                Repository
              </a>
            )}
          </div>
        )}

        {project.cover_image && (
          <img
            src={project.cover_image}
            alt={project.title}
            loading="lazy"
            className="mt-10 w-full rounded-lg border border-ink-700"
          />
        )}

        {project.description && (
          <div className="mt-10 border-t border-ink-700 pt-10">
            <p className="whitespace-pre-line text-[15px] leading-[1.8] text-mist-200">
              {project.description}
            </p>
          </div>
        )}
      </Reveal>
    </article>
  );
}

import React, { useEffect, useState } from 'react';
import { Check, X, MapPin, Phone, Mail, BadgeCheck, ChevronDown, ChevronUp, RefreshCw, Send, Sparkles } from 'lucide-react';
import { adminService, type ProviderDocumentAIResponse } from '@/services/adminService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/Badge';
import type { ProviderApproval } from '@/types';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const DOCUMENT_AI_PROMPTS = [
  'Summarize this provider application and uploaded documents.',
  'Does the document evidence match the claimed specialization?',
  'What experience, dates, license numbers, or issuing institutions are visible?',
  'Find mismatches between the profile and uploaded documents.',
  'What documents or evidence are missing?',
  'What should I manually verify before approving?',
];

export const ProviderApprovals: React.FC = () => {
  const [providers, setProviders] = useState<ProviderApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});
  const [docQuestionById, setDocQuestionById] = useState<Record<string, string>>({});
  const [docAnswerById, setDocAnswerById] = useState<Record<string, ProviderDocumentAIResponse>>({});
  const [docAiLoadingId, setDocAiLoadingId] = useState<string | null>(null);
  const [docIndexingId, setDocIndexingId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const canUseDocumentAI = Boolean(user?.is_super_admin);

  const loadProviders = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getPendingProviders();
      setProviders(data.providers);
    } catch {
      // Error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleAction = async (providerId: string, action: 'approve' | 'reject') => {
    setProcessingId(providerId);
    try {
      await adminService.updateProviderApproval(providerId, {
        action,
        reason: reasonById[providerId]?.trim() || undefined,
      });
      toast.success(action === 'approve' ? 'Provider approved' : 'Provider rejected');
      setProviders((prev) => prev.filter((item) => item.provider.id !== providerId));
    } catch {
      toast.error('Could not update provider approval');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReindexDocuments = async (providerId: string) => {
    setDocIndexingId(providerId);
    try {
      const result = await adminService.reindexProviderDocuments(providerId);
      toast.success(`Indexed ${result.indexed_chunks} document chunks`);
    } catch {
      toast.error('Could not index provider documents');
    } finally {
      setDocIndexingId(null);
    }
  };

  const handleAskDocuments = async (providerId: string, question?: string) => {
    const finalQuestion = (question || docQuestionById[providerId] || '').trim();
    if (!finalQuestion) {
      toast.error('Ask a question about the uploaded documents');
      return;
    }

    setDocAiLoadingId(providerId);
    setDocQuestionById((prev) => ({ ...prev, [providerId]: finalQuestion }));
    try {
      const answer = await adminService.askProviderDocuments(providerId, finalQuestion);
      setDocAnswerById((prev) => ({ ...prev, [providerId]: answer }));
    } catch {
      toast.error('Document AI could not answer this question');
    } finally {
      setDocAiLoadingId(null);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Provider Approvals</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review provider onboarding submissions and approve or reject access to the provider panel.
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner size="lg" />
        ) : providers.length === 0 ? (
          <EmptyState
            icon={<BadgeCheck className="w-8 h-8 text-gray-400" />}
            title="No pending approvals"
            description="All provider applications have been reviewed."
          />
        ) : (
          <div className="grid gap-4">
            {providers.map((item) => {
              const provider = item.provider;
              const application = (item.application || {}) as Record<string, unknown>;
              return (
                <Card key={provider.id} className="dark:bg-gray-800 dark:border-gray-700 space-y-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {provider.user?.full_name || 'Provider'}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{provider.user?.email}</p>
                        </div>
                        <Badge status="pending" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedById((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {expandedById[provider.id] ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              Minimize
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              Expand
                            </>
                          )}
                        </button>
                      </div>

                      {expandedById[provider.id] && item.summary && (
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Application Summary</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{item.summary}</p>
                        </div>
                      )}

                      {expandedById[provider.id] && (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Submitted Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Service Category</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{provider.category?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Specialization</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {(application['specialization'] as string) || provider.specialization}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Location</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {(application['location'] as string) || provider.location}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Area</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {(application['area'] as string) || provider.area || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Pincode</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {(application['pincode'] as string) || provider.pincode || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Experience</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {(application['experience_years'] as number | undefined) ?? provider.experience_years} years
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Hourly Rate</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              ₹{(application['hourly_rate'] as number | undefined) ?? provider.hourly_rate ?? 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Uploaded Documents</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.documents.length}</p>
                          </div>
                        </div>
                        {(application['profile_description'] as string) && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Description</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {application['profile_description'] as string}
                            </p>
                          </div>
                        )}
                      </div>
                      )}

                      {expandedById[provider.id] && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                          <p className="text-gray-500 dark:text-gray-400">Specialization</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{provider.specialization}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                          <p className="text-gray-500 dark:text-gray-400">Category</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{provider.category?.name || 'N/A'}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                          <p className="text-gray-500 dark:text-gray-400">Experience</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{provider.experience_years} years</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                          <p className="text-gray-500 dark:text-gray-400">Hourly Rate</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">₹{provider.hourly_rate || 0}</p>
                        </div>
                      </div>
                      )}

                      {expandedById[provider.id] && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <MapPin className="w-4 h-4" />
                          <span>{provider.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Phone className="w-4 h-4" />
                          <span>{provider.user?.phone_number || 'No phone provided'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Mail className="w-4 h-4" />
                          <span>{provider.user?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <BadgeCheck className="w-4 h-4" />
                          <span>{provider.pincode ? `Pincode ${provider.pincode}` : 'No pincode provided'}</span>
                        </div>
                      </div>
                      )}

                      {expandedById[provider.id] && provider.profile_description && (
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Profile Description</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{provider.profile_description}</p>
                        </div>
                      )}

                      {expandedById[provider.id] && item.avatar && (
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Profile Photo</p>
                          <div className="flex items-center gap-3">
                            <img
                              src={item.avatar.path}
                              alt={`${provider.user?.full_name || 'Provider'} avatar`}
                              className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                            />
                            <div className="space-y-1">
                              <a
                                href={item.avatar.path}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-sm text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                Open avatar
                              </a>
                              <a
                                href={item.avatar.path}
                                download
                                className="block text-sm text-gray-600 dark:text-gray-300 hover:underline"
                              >
                                Download avatar
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {expandedById[provider.id] && item.documents.length > 0 && (
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Submitted Documents</p>
                          <div className="space-y-2">
                            {item.documents.map((doc) => (
                              <div key={doc.path} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2">
                                <a
                                  href={doc.path}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block text-sm text-primary-600 dark:text-primary-400 hover:underline truncate"
                                >
                                  {doc.name}
                                </a>
                                <a
                                  href={doc.path}
                                  download
                                  className="text-xs text-gray-500 dark:text-gray-400 hover:underline shrink-0"
                                >
                                  Download
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {expandedById[provider.id] && canUseDocumentAI && (
                        <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-800 overflow-hidden">
                          {/* RAG Header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 dark:bg-indigo-700">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-white" />
                              <span className="text-sm font-bold text-white">Document AI — RAG Assistant</span>
                              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wider">Super Admin</span>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                              isLoading={docIndexingId === provider.id}
                              onClick={() => handleReindexDocuments(provider.id)}
                            >
                              Re-index docs
                            </Button>
                          </div>

                          <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Ask anything about this provider's uploaded documents. Answers are grounded in indexed chunks only — no hallucination.
                            </p>

                            {/* Quick prompts */}
                            <div className="flex flex-wrap gap-2">
                              {DOCUMENT_AI_PROMPTS.map((prompt) => (
                                <button
                                  key={prompt}
                                  type="button"
                                  disabled={docAiLoadingId === provider.id}
                                  onClick={() => handleAskDocuments(provider.id, prompt)}
                                  className="rounded-full border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/60 disabled:opacity-50 transition-colors"
                                >
                                  {prompt}
                                </button>
                              ))}
                            </div>

                            {/* Question input */}
                            <div className="space-y-2">
                              <label
                                htmlFor={`doc-question-${provider.id}`}
                                className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                              >
                                Your question
                              </label>
                              <textarea
                                id={`doc-question-${provider.id}`}
                                rows={3}
                                value={docQuestionById[provider.id] || ''}
                                onChange={(e) =>
                                  setDocQuestionById((prev) => ({ ...prev, [provider.id]: e.target.value }))
                                }
                                placeholder="e.g. Does the certificate match the claimed specialization?"
                                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-colors"
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                  {(docQuestionById[provider.id] || '').length > 0
                                    ? `${(docQuestionById[provider.id] || '').length} chars`
                                    : 'Type a question or click a prompt above'}
                                </span>
                                <Button
                                  size="sm"
                                  leftIcon={<Send className="w-3.5 h-3.5" />}
                                  isLoading={docAiLoadingId === provider.id}
                                  disabled={!(docQuestionById[provider.id] || '').trim()}
                                  onClick={() => handleAskDocuments(provider.id)}
                                >
                                  Ask AI
                                </Button>
                              </div>
                            </div>

                            {/* Loading */}
                            {docAiLoadingId === provider.id && (
                              <div className="flex items-center gap-3 rounded-lg border border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-3">
                                <div className="flex gap-1">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-sm text-indigo-700 dark:text-indigo-300">Searching document chunks and generating answer...</span>
                              </div>
                            )}

                            {/* Answer block */}
                            {docAnswerById[provider.id] && (
                              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                {/* Answer header */}
                                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Answer</span>
                                  </div>
                                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                    docAnswerById[provider.id].confidence === 'high'
                                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                                      : docAnswerById[provider.id].confidence === 'medium'
                                      ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                                      : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                                  }`}>
                                    {docAnswerById[provider.id].confidence} confidence
                                  </span>
                                </div>

                                {/* Answer text */}
                                <div className="px-4 py-3 bg-white dark:bg-gray-900">
                                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                                    {docAnswerById[provider.id].answer}
                                  </p>
                                </div>

                                {/* Risk flags */}
                                {docAnswerById[provider.id].risk_flags.length > 0 && (
                                  <div className="mx-4 mb-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">⚠️ Risk flags</p>
                                    <ul className="list-disc pl-4 text-xs text-amber-700 dark:text-amber-400 space-y-0.5">
                                      {docAnswerById[provider.id].risk_flags.map((flag) => (
                                        <li key={flag}>{flag}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Citations */}
                                {docAnswerById[provider.id].citations.length > 0 && (
                                  <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 bg-white dark:bg-gray-900 space-y-2">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Source citations</p>
                                    {docAnswerById[provider.id].citations.map((citation) => (
                                      <div
                                        key={`${citation.document}-${citation.chunk_index}`}
                                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2"
                                      >
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                          <a
                                            href={citation.path}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                                          >
                                            📄 {citation.document} · chunk {citation.chunk_index}
                                          </a>
                                          <span className="shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                                            {Math.round(citation.similarity * 100)}% match
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">{citation.excerpt}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full lg:w-96 space-y-3">
                      <TextArea
                        id={`rejection-reason-${provider.id}`}
                        label="Rejection reason"
                        placeholder="Optional reason to share with the provider"
                        value={reasonById[provider.id] || ''}
                        onChange={(e) =>
                          setReasonById((prev) => ({ ...prev, [provider.id]: e.target.value }))
                        }
                        rows={4}
                      />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          className="flex-1"
                          leftIcon={<Check className="w-4 h-4" />}
                          isLoading={processingId === provider.id}
                          onClick={() => handleAction(provider.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          className="flex-1"
                          variant="danger"
                          leftIcon={<X className="w-4 h-4" />}
                          isLoading={processingId === provider.id}
                          onClick={() => handleAction(provider.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

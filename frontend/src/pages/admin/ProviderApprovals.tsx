import React, { useEffect, useState } from 'react';
import { Check, X, MapPin, Phone, Mail, BadgeCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/Badge';
import type { ProviderApproval } from '@/types';
import toast from 'react-hot-toast';

export const ProviderApprovals: React.FC = () => {
  const [providers, setProviders] = useState<ProviderApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});

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
                    </div>

                    <div className="w-full lg:w-96 space-y-3">
                      <TextArea
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

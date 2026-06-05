import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle,
  DollarSign,
  MapPin,
  Sparkles,
  User,
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { providerService } from '@/services/providerService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TextArea } from '@/components/ui/TextArea';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

interface OnboardingData {
  specialization: string;
  category_id: string;
  experience_years: number;
  location: string;
  area: string;
  pincode: string;
  profile_description: string;
  hourly_rate: number;
}

const STEPS = [
  { label: 'Profile', icon: User },
  { label: 'Services', icon: Briefcase },
  { label: 'Documents', icon: DollarSign },
  { label: 'Preview', icon: Sparkles },
];

/** Multi-step onboarding wizard for new providers */
export const ProviderOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [supportFiles, setSupportFiles] = useState<File[]>([]);

  const [data, setData] = useState<OnboardingData>({
    specialization: '',
    category_id: '',
    experience_years: 1,
    location: '',
    area: '',
    pincode: '',
    profile_description: '',
    hourly_rate: 500,
  });

  const updateData = (field: keyof OnboardingData, value: string | number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return Boolean(data.category_id && data.location && data.pincode);
      case 1:
        return Boolean(data.specialization && data.experience_years > 0);
      case 2:
        return data.hourly_rate > 0 && supportFiles.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(file ? URL.createObjectURL(file) : '');
  };

  const handleDocumentsChange = (files: FileList | null) => {
    setSupportFiles(files ? Array.from(files) : []);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('specialization', data.specialization);
      formData.append('category_id', data.category_id);
      formData.append('experience_years', String(data.experience_years));
      formData.append('location', data.location);
      formData.append('area', data.area);
      formData.append('pincode', data.pincode);
      formData.append('profile_description', data.profile_description);
      formData.append('hourly_rate', String(data.hourly_rate));

      if (avatarFile) {
        formData.append('avatar_file', avatarFile);
      }
      if (supportFiles.length === 0) {
        toast.error('Please upload at least one certificate, license, or supporting document.');
        setIsSubmitting(false);
        return;
      }
      supportFiles.forEach((file) => {
        formData.append('documents', file);
      });

      await providerService.registerApplication(formData);
      setIsComplete(true);
      toast.success('Your provider application has been submitted!');
      setTimeout(() => navigate('/provider/pending'), 1800);
    } catch {
      toast.error('Failed to submit your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Completion animation
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
        >
          You&apos;re all set!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-gray-500 dark:text-gray-400"
        >
          Your provider profile has been submitted and is waiting for admin approval.
        </motion.p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Set Up Your Provider Profile
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Complete these steps to start receiving bookings
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.label} className="flex flex-col items-center relative z-10">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    isCompleted && 'bg-primary-600 text-white',
                    isActive && 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-2 ring-primary-600 dark:ring-primary-400',
                    !isActive && !isCompleted && 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress line */}
        <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200 dark:bg-gray-700 -z-0">
          <motion.div
            className="h-full bg-primary-600"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            {currentStep === 0 && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Tell us about yourself
                </h3>
                <Select
                  label="Service Category"
                  value={data.category_id}
                  onChange={(e) => updateData('category_id', e.target.value)}
                  options={[
                    { value: '', label: 'Select a category...' },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
                <Input
                  label="Location"
                  placeholder="e.g., Mumbai, Delhi, Bangalore"
                  value={data.location}
                  onChange={(e) => updateData('location', e.target.value)}
                  leftIcon={<MapPin className="w-4 h-4" />}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Area"
                    placeholder="e.g., Bandra West"
                    value={data.area}
                    onChange={(e) => updateData('area', e.target.value)}
                  />
                  <Input
                    label="Pincode"
                    placeholder="e.g., 400050"
                    value={data.pincode}
                    onChange={(e) => updateData('pincode', e.target.value)}
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarChange(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-black file:text-white dark:file:bg-white dark:file:text-black hover:file:opacity-90"
                    />
                  </div>
                </div>
                <TextArea
                  label="About You (optional)"
                  placeholder="Tell potential clients about your experience and approach..."
                  value={data.profile_description}
                  onChange={(e) => updateData('profile_description', e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Your services
                </h3>
                <Input
                  label="Specialization"
                  placeholder="e.g., Dermatologist, Hair Stylist, Yoga Instructor"
                  value={data.specialization}
                  onChange={(e) => updateData('specialization', e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Years of Experience
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={data.experience_years}
                      onChange={(e) => updateData('experience_years', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[3ch] text-right">
                      {data.experience_years}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {data.experience_years} year{data.experience_years > 1 ? 's' : ''} of professional experience
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Upload your supporting documents
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hourly Rate (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={data.hourly_rate}
                      onChange={(e) => updateData('hourly_rate', parseInt(e.target.value) || 0)}
                      className="w-full pl-8 pr-16 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-lg font-semibold bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">
                      /hour
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Tip: Similar providers in your area charge ₹500–₹2,000/hr
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Certificates / Licenses / Documents
                  </label>
                  <input
                    type="file"
                    multiple
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                    onChange={(e) => handleDocumentsChange(e.target.files)}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-black file:text-white dark:file:bg-white dark:file:text-black hover:file:opacity-90"
                  />
                  {supportFiles.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                      {supportFiles.map((file) => (
                        <li key={file.name} className="truncate">
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Review your profile
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Specialization</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{data.specialization}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Category</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {categories.find((c) => c.id === data.category_id)?.name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Location</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{data.location}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Area</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{data.area || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Pincode</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{data.pincode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Experience</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{data.experience_years} years</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Hourly Rate</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">₹{data.hourly_rate}/hr</span>
                  </div>
                  <div className="flex justify-between text-sm pt-3 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-gray-500 dark:text-gray-400">Application status</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Pending admin approval</span>
                  </div>
                  {supportFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded documents</p>
                      <ul className="space-y-1 text-sm text-gray-900 dark:text-gray-100">
                        {supportFiles.map((file) => (
                          <li key={file.name} className="truncate">{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.profile_description && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">About</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{data.profile_description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={currentStep === 0}
          className={cn(currentStep === 0 && 'invisible')}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            variant="gradient"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!canProceed()}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Create Profile
          </Button>
        )}
      </div>

      {/* Skip option */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        You can always update these details later from your profile settings.
      </p>
    </div>
  );
};

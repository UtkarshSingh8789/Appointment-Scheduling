import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, XCircle, Star } from 'lucide-react';
import { providerService } from '@/services/providerService';
import { appointmentService } from '@/services/appointmentService';
import { useAuthStore } from '@/store/authStore';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTransition } from '@/components/layout/PageTransition';
import { McpInsightsPanel } from '@/components/mcp/McpInsightsPanel';
import { formatDate, formatTime, getRelativeDateLabel } from '@/utils';
import type { ProviderStats, Appointment } from '@/types';

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, appointmentsData] = await Promise.all([
          providerService.getStats(),
          appointmentService.getUpcoming(),
        ]);
        setStats(statsData);
        setTodayAppointments(appointmentsData.slice(0, 5));
      } catch {
        // Error handled by interceptor
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading dashboard..." />;
  }

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {user?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Here&apos;s your practice overview</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<Calendar className="w-5 h-5" />}
            label="Total Appointments"
            value={stats.total_appointments}
            href="/provider/appointments"
          />
          <StatsCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending"
            value={stats.pending_appointments}
            href="/provider/appointments"
          />
          <StatsCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Completed"
            value={stats.completed_appointments}
            href="/provider/appointments"
          />
          <StatsCard
            icon={<Star className="w-5 h-5" />}
            label="Rating"
            value={`${stats.rating.toFixed(1)} ★`}
          />
        </div>
      )}

      <McpInsightsPanel />

      {/* Today's appointments */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
          <button
            type="button"
            onClick={() => navigate('/provider/appointments')}
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700"
          >
            View all
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-8 h-8 text-gray-400" />}
            title="No upcoming appointments"
            description="Your upcoming appointments will appear here"
          />
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                onClick={() => setSelectedAppointment(appointment)}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-gray-900">
                      {appointment.customer?.full_name || 'Customer'}
                    </p>
                    <Badge status={appointment.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {getRelativeDateLabel(appointment.appointment_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 hidden sm:block">
                  {formatDate(appointment.appointment_date)}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Quick stats summary */}
      {stats && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{stats.completed_appointments}</p>
              <p className="text-sm text-green-600">Completed</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-700">{stats.cancelled_appointments}</p>
              <p className="text-sm text-red-600">Cancelled</p>
            </div>
          </div>
        </Card>
      )}

      <Modal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Details"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedAppointment.customer?.full_name || 'Customer'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedAppointment.customer?.email}
                </p>
              </div>
              <Badge status={selectedAppointment.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-gray-500 dark:text-gray-400">Date</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(selectedAppointment.appointment_date, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-gray-500 dark:text-gray-400">Time</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatTime(selectedAppointment.start_time)} - {formatTime(selectedAppointment.end_time)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:col-span-2">
                <p className="text-gray-500 dark:text-gray-400">Notes</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedAppointment.notes || 'No notes provided'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:col-span-2">
                <p className="text-gray-500 dark:text-gray-400">Google Calendar</p>
                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                    `Appointment with ${selectedAppointment.customer?.full_name || 'Customer'}`
                  )}&details=${encodeURIComponent(
                    selectedAppointment.notes || 'Appointment details'
                  )}&dates=${selectedAppointment.appointment_date.replace(/-/g, '')}T${selectedAppointment.start_time.replace(/:/g, '').padEnd(6, '0')}/${selectedAppointment.appointment_date.replace(/-/g, '')}T${selectedAppointment.end_time.replace(/:/g, '').padEnd(6, '0')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                >
                  Add this slot to Google Calendar
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </PageTransition>
  );
};

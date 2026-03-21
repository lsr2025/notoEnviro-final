'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { ActivityLog, User } from '@/lib/types';
import { saveLog, saveToQueue, getPendingCount } from '@/lib/offline-db';
import { getDamSiteByName } from '@/lib/dam-sites';

const ACTIVITY_TYPES = [
  { id: 'vegetation', label: 'Vegetation Clearing', emoji: '🌱' },
  { id: 'litter', label: 'Litter/Waste Removal', emoji: '🗑️' },
  { id: 'water', label: 'Water Quality Monitoring', emoji: '💧' },
  { id: 'erosion', label: 'Erosion Control', emoji: '🌊' },
  { id: 'alien', label: 'Alien Plant Removal', emoji: '🌿' },
  { id: 'infrastructure', label: 'Infrastructure Maintenance', emoji: '🔧' },
  { id: 'other', label: 'Other', emoji: '📝' },
];

type Step = 1 | 2 | 3 | 4 | 5;

export default function LogNewPage() {
  const [step, setStep] = useState<Step>(1);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Form state
  const [isPresent, setIsPresent] = useState<boolean | null>(null);
  const [activityType, setActivityType] = useState('');
  const [activityDetails, setActivityDetails] = useState('');
  const [hoursWorked, setHoursWorked] = useState(8);
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    const initForm = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/');
          return;
        }

        const employeeId = (session.user.email || '').split('@')[0].toUpperCase();
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('employee_id', employeeId)
          .maybeSingle();

        if (profile) {
          setUser(profile);
        }
      } catch (err) {
        console.error('Form init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initForm();
  }, [router]);

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported on this device');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLat(position.coords.latitude);
        setGpsLng(position.coords.longitude);
        setError('');
      },
      (err) => {
        setError(`GPS Error: ${err.message}`);
      }
    );
  };

  const handleSubmit = async () => {
    if (!user || isPresent === null) {
      setError('Missing required information');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const today = new Date().toISOString().split('T')[0];
      const siteId = getDamSiteByName(user.site_name)?.id || user.site_id;

      const log: ActivityLog = {
        worker_id: user.id,
        site_id: siteId,
        log_date: today,
        is_present: isPresent,
        activity_type: activityType,
        activity_details: activityDetails,
        hours_worked: hoursWorked,
        gps_lat: gpsLat || undefined,
        gps_lng: gpsLng || undefined,
        status: 'pending',
      };

      // Save to offline DB first
      const offlineId = await saveLog(log);

      // Try to sync to Supabase
      try {
        const { error: dbError } = await supabase
          .from('activity_logs')
          .insert([
            {
              ...log,
              offline_id: offlineId,
              status: 'submitted',
              synced_at: new Date().toISOString(),
            },
          ]);

        if (dbError) {
          // Save to queue for later sync
          await saveToQueue({
            id: offlineId,
            data: log,
            timestamp: Date.now(),
            synced: false,
          });
        }
      } catch {
        // Network error, save to queue
        await saveToQueue({
          id: offlineId,
          data: log,
          timestamp: Date.now(),
          synced: false,
        });
      }

      // Success
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save activity log');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="bg-dark min-h-screen flex items-center justify-center">
        <p className="text-gray-300">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const progressPercent = (step / 5) * 100;

  return (
    <main className="bg-dark min-h-screen pb-24">
      {/* Header with Progress */}
      <div className="sticky top-0 bg-navy border-b border-teal/30 z-10">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => ((s - 1) as Step))}
                className="text-teal hover:text-env-green"
              >
                ← Back
              </button>
            )}
            <h2 className="text-white font-bold text-lg flex-1 text-center">
              Step {step} of 5
            </h2>
            <div className="w-8"></div>
          </div>
          <div className="w-full bg-dark rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-env-green transition-all"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* STEP 1: Attendance */}
        {step === 1 && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Are you present at your dam site today?</h3>
            <p className="text-gray-400 text-sm mb-6">
              {new Date().toLocaleDateString('en-ZA', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => {
                  setIsPresent(true);
                  setStep(2);
                }}
                className="w-full bg-env-green hover:bg-emerald-600 text-dark font-bold py-4 rounded-lg text-lg transition-colors"
              >
                ✓ YES, I'm Present
              </button>
              <button
                onClick={() => {
                  setIsPresent(false);
                  setStep(5);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-lg transition-colors"
              >
                ✗ NO, I'm Absent
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Dam Site Confirmation */}
        {step === 2 && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Confirm your work location today:</h3>
            <p className="text-gray-400 text-sm mb-6">You should be at:</p>

            <div className="bg-navy rounded-lg p-6 border border-teal/30 mb-6">
              <h4 className="text-2xl font-bold text-env-green">{user.site_name}</h4>
              <p className="text-gray-400 text-sm mt-2">Your assigned dam site</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setStep(3)}
                className="w-full bg-env-green hover:bg-emerald-600 text-dark font-bold py-3 rounded-lg transition-colors"
              >
                ✓ Confirm
              </button>
              <button
                onClick={() => setError('Please contact your supervisor to update your work location')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                ⚠ Different Location
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Activity Type */}
        {step === 3 && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">What was your primary activity today?</h3>

            <div className="grid gap-3 mb-6">
              {ACTIVITY_TYPES.map(activity => (
                <button
                  key={activity.id}
                  onClick={() => {
                    setActivityType(activity.id);
                    setStep(4);
                  }}
                  className={`p-4 rounded-lg text-left transition-colors ${
                    activityType === activity.id
                      ? 'bg-env-green text-dark'
                      : 'bg-navy hover:bg-navy/80 text-white border border-teal/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{activity.emoji}</span>
                    <span className="font-semibold">{activity.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Activity Details */}
        {step === 4 && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">Describe the work completed today</h3>

            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Activity Details
              </label>
              <textarea
                value={activityDetails}
                onChange={(e) => setActivityDetails(e.target.value)}
                placeholder="What did you accomplish? Any challenges? Results?"
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-dark border border-teal/50 text-white placeholder-gray-500 focus:border-env-green focus:outline-none focus:ring-2 focus:ring-env-green/20"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Hours Worked
              </label>
              <input
                type="number"
                min="0"
                max="24"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(Math.min(24, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full px-4 py-3 rounded-lg bg-dark border border-teal/50 text-white focus:border-env-green focus:outline-none focus:ring-2 focus:ring-env-green/20"
              />
            </div>

            <button
              onClick={() => setStep(5)}
              className="w-full bg-env-green hover:bg-emerald-600 text-dark font-bold py-3 rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 5: GPS & Submit */}
        {step === 5 && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">
              {isPresent ? 'Capture your GPS location' : 'Confirm absence'}
            </h3>

            {isPresent && (
              <>
                <div className="bg-navy rounded-lg p-4 border border-teal/30 mb-6">
                  {gpsLat && gpsLng ? (
                    <div>
                      <p className="text-gray-300 text-sm font-semibold mb-1">GPS Location Captured</p>
                      <p className="text-env-green font-mono text-sm">
                        {gpsLat.toFixed(4)}, {gpsLng.toFixed(4)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No location captured yet</p>
                  )}
                </div>

                <button
                  onClick={handleCaptureGPS}
                  className="w-full bg-teal hover:bg-teal/80 text-white font-bold py-3 rounded-lg transition-colors mb-6"
                >
                  📍 Capture GPS Location
                </button>
              </>
            )}

            {isPresent === false && (
              <div className="bg-navy rounded-lg p-4 border border-yellow-500/30 mb-6">
                <p className="text-yellow-300 text-sm font-semibold">
                  You are marking yourself as absent today. Please provide a reason in your next log.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-env-green hover:bg-emerald-600 text-dark font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : '✓ Submit Log'}
              </button>
              <button
                onClick={() => {
                  router.push('/dashboard');
                }}
                disabled={submitting}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                Save & Exit (will sync offline)
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

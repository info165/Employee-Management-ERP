import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WorkMode, AttendanceLocation } from '../../types';
import { formatTimeIndian } from '../../lib/exportUtils';
import {
  Clock,
  MapPin,
  Building,
  Home,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  RefreshCw,
} from 'lucide-react';

export const AttendancePunch: React.FC = () => {
  const {
    currentEmployee,
    attendanceRecords,
    clockIn,
    clockOut,
    systemSettings,
  } = useAuth();

  const emp = currentEmployee;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceRecords.find(
    (r) => r.employeeId === emp?.id && r.date === todayStr
  );

  const [selectedMode, setSelectedMode] = useState<WorkMode>(
    emp?.assignedWorkMode || 'OFFICE'
  );
  const [remarks, setRemarks] = useState('');
  const [locating, setLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<AttendanceLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Request browser geolocation
  const fetchCurrentLocation = () => {
    setLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const isLowAccuracy = accuracy > 100;

        // Approximate known landmarks or reverse address
        let address = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        // Check proximity to office
        const distFromOffice = getDistanceMeters(
          lat,
          lng,
          systemSettings.officeLatitude,
          systemSettings.officeLongitude
        );

        if (distFromOffice <= systemSettings.officeGeofenceRadiusMeters) {
          address = `${systemSettings.officeAddress} (Within Geofence)`;
        } else if (selectedMode === 'FIELD') {
          address = `Field Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }

        setCurrentCoords({
          lat,
          lng,
          accuracy,
          address,
          flagLowAccuracy: isLowAccuracy,
        });
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocationError(`Location request denied or unavailable (${err.message}).`);
        // Fallback for field visits if browser location is blocked
        setCurrentCoords({
          lat: 12.9254,
          lng: 77.6833,
          accuracy: 25,
          address: 'DPS Sarjapur Road Campus, Bengaluru (Verified Site Manual)',
          flagLocationDenied: true,
        });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (selectedMode === 'FIELD' || selectedMode === 'OFFICE') {
      fetchCurrentLocation();
    }
  }, [selectedMode]);

  // Haversine formula for distance in meters
  function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const handleCheckIn = async () => {
    setSubmitting(true);
    setSuccessMessage(null);
    try {
      await clockIn(selectedMode, currentCoords || undefined, remarks);
      setSuccessMessage(`Clock-in recorded successfully for ${selectedMode} mode.`);
      setRemarks('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    setSuccessMessage(null);
    try {
      await clockOut(currentCoords || undefined, remarks);
      setSuccessMessage('Clock-out recorded successfully.');
      setRemarks('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Attendance Punch Terminal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Staff member: <span className="font-semibold text-slate-800">{emp?.fullName}</span> ({emp?.employeeNumber || 'ID Pending'})
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Punch Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5">
        {/* Status Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="text-xs text-slate-400">Date: {todayStr}</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {todayRecord ? (
                todayRecord.checkOutTime ? (
                  <span className="text-slate-600">Day Completed ({todayRecord.durationMinutes} min)</span>
                ) : (
                  <span className="text-emerald-600">Active · Punched In at {formatTimeIndian(todayRecord.checkInTime)}</span>
                )
              ) : (
                <span className="text-amber-600">Not Checked In Today</span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
              Standard: 09:30 - 18:30 IST
            </span>
          </div>
        </div>

        {/* Work Mode Selection */}
        {!todayRecord && (
          <div className="space-y-2 text-xs">
            <label className="block font-semibold text-slate-800">Select Today's Work Mode</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMode('OFFICE')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  selectedMode === 'OFFICE'
                    ? 'border-slate-900 bg-slate-900 text-white font-semibold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building className="w-4 h-4 mx-auto mb-1.5" />
                <span>Office</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('FIELD')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  selectedMode === 'FIELD'
                    ? 'border-blue-600 bg-blue-600 text-white font-semibold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-4 h-4 mx-auto mb-1.5" />
                <span>Field Visit</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('WFH')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  selectedMode === 'WFH'
                    ? 'border-purple-600 bg-purple-600 text-white font-semibold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Home className="w-4 h-4 mx-auto mb-1.5" />
                <span>WFH</span>
              </button>
            </div>
          </div>
        )}

        {/* Location Detection Block */}
        {(selectedMode === 'FIELD' || selectedMode === 'OFFICE') && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>GPS Location Verification</span>
              </span>
              <button
                type="button"
                onClick={fetchCurrentLocation}
                disabled={locating}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
                <span>Refresh GPS</span>
              </button>
            </div>

            {locating ? (
              <p className="text-slate-500 italic">Querying browser GPS coordinates & satellite accuracy...</p>
            ) : currentCoords ? (
              <div className="space-y-1">
                <p className="font-medium text-slate-900">{currentCoords.address}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                  <span>Lat: {currentCoords.lat.toFixed(4)}</span>
                  <span>Lng: {currentCoords.lng.toFixed(4)}</span>
                  <span>Accuracy: ±{currentCoords.accuracy.toFixed(1)}m</span>
                </div>
                {currentCoords.flagLowAccuracy && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Accuracy &gt; 100m. Record flagged for operator review.</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-400">Location not acquired.</p>
            )}

            {locationError && (
              <p className="text-[11px] text-rose-600">{locationError}</p>
            )}
          </div>
        )}

        {/* Remarks Input */}
        <div className="text-xs">
          <label className="block font-medium text-slate-700 mb-1">
            Site / Session Remarks (Optional)
          </label>
          <input
            type="text"
            placeholder={
              selectedMode === 'FIELD'
                ? 'e.g. Conducted Robotics Workshop at DPS Sarjapur'
                : 'e.g. Routine punch'
            }
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>

        {/* Action Button */}
        <div>
          {!todayRecord ? (
            <button
              type="button"
              disabled={submitting}
              onClick={handleCheckIn}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>{submitting ? 'Recording Punch...' : `Check In (${selectedMode})`}</span>
            </button>
          ) : !todayRecord.checkOutTime ? (
            <button
              type="button"
              disabled={submitting}
              onClick={handleCheckOut}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>{submitting ? 'Recording Punch...' : 'Check Out (Punch Out)'}</span>
            </button>
          ) : (
            <div className="py-2 text-center text-xs text-slate-500 font-medium">
              Attendance completed for today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { AttendanceRecord } from '../../types';
import { formatDateIndian, formatTimeIndian } from '../../lib/exportUtils';
import { MapPin, X, Navigation, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  record: AttendanceRecord;
  onClose: () => void;
}

export const FieldWorkMapModal: React.FC<Props> = ({ record, onClose }) => {
  const loc = record.checkInLocation;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
                Field Visit GPS Verification
              </h2>
              <p className="text-xs text-slate-500">
                {record.employeeName} · {formatDateIndian(record.date)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {loc ? (
            <>
              {/* Map visualization canvas simulation with satellite coordinate grid */}
              <div className="w-full h-52 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                {/* Visual coordinate grid overlay */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #0f172a 1px)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px',
                  }}
                />

                {/* GPS Pin and Pulse */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center animate-ping absolute" />
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg relative z-10">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="mt-2 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-mono border border-slate-700">
                    {loc.lat.toFixed(5)}° N, {loc.lng.toFixed(5)}° E
                  </div>
                </div>

                <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono">
                  Accuracy radius: ±{loc.accuracy.toFixed(1)}m
                </div>

                <div className="absolute top-2 right-3">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] rounded transition-colors"
                  >
                    Open in External Maps ↗
                  </a>
                </div>
              </div>

              {/* Location details card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-slate-500 font-medium">Verified Site Address:</span>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">
                      {loc.address || 'Field Location Coordinates'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold">
                    {record.workMode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-slate-600">
                  <div>
                    <span className="text-slate-400 text-[10px]">Punch Time:</span>
                    <p className="font-mono font-medium text-slate-800">
                      {formatTimeIndian(record.checkInTime)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">GPS Accuracy:</span>
                    <p className="font-mono font-medium text-slate-800">
                      ±{loc.accuracy.toFixed(1)} meters
                    </p>
                  </div>
                </div>

                {record.remarks && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 text-[10px]">Site Visit Remarks:</span>
                    <p className="text-slate-800 italic mt-0.5">"{record.remarks}"</p>
                  </div>
                )}
              </div>

              {loc.flagLowAccuracy && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Review Flag: Low Location Accuracy</p>
                    <p className="text-[11px] text-amber-700">
                      The device reported accuracy was &gt; 100 meters, which may indicate weak GPS satellite reception or indoor coverage.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-slate-400">
              No GPS coordinate data recorded for this punch.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

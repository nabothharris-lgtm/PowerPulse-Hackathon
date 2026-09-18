import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Category, LocationArea, HazardLevel, AffectedAreaType } from '../../types';
import { InteractiveMap } from '../common/InteractiveMap';
import { SafetyBanner } from '../common/SafetyBanner';
import { 
  AlertTriangle, 
  MapPin, 
  Camera, 
  Send, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles,
  Info,
  ArrowLeft
} from 'lucide-react';

interface ResidentReportFormProps {
  onSuccess: (reportId: string) => void;
  onCancel: () => void;
}

export const ResidentReportForm: React.FC<ResidentReportFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { currentUser } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<LocationArea[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Form inputs
  const [categoryId, setCategoryId] = useState('');
  const [locationName, setLocationName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [district, setDistrict] = useState(currentUser?.district || 'Kabale');
  const [subArea, setSubArea] = useState('Central Division');
  const [coordinates, setCoordinates] = useState<[number, number]>([-1.2508, 29.9892]); // Kabale default
  const [description, setDescription] = useState('');
  const [affectedAreaType, setAffectedAreaType] = useState<AffectedAreaType>('SINGLE_HOUSE');
  const [photoUrl, setPhotoUrl] = useState('');
  const [reporterName, setReporterName] = useState(currentUser?.name || '');
  const [reporterPhone, setReporterPhone] = useState(currentUser?.phone || '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    async function loadReferences() {
      try {
        const [catsRes, locsRes] = await Promise.all([
          api.references.getCategories(),
          api.references.getLocations(),
        ]);
        setCategories(catsRes.categories);
        setLocations(locsRes.locations);
        if (catsRes.categories.length > 0) {
          setCategoryId(catsRes.categories[0].id);
        }
      } catch (err) {
        console.error('Failed to load form references:', err);
      } finally {
        setLoadingRefs(false);
      }
    }
    loadReferences();
  }, []);

  const selectedCategory = categories.find(c => c.id === categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError('Please select a problem category.');
      return;
    }
    if (!locationName.trim()) {
      setError('Please enter the street name or specific neighborhood location.');
      return;
    }
    if (!reporterPhone.trim()) {
      setError('A contact phone number is required so our dispatch team can reach you.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setDuplicateWarning(null);

    try {
      const res = await api.reports.create({
        categoryId,
        categoryName: selectedCategory?.name || 'Electrical Outage',
        locationName: locationName.trim(),
        landmark: landmark.trim() || undefined,
        district,
        subArea,
        latitude: coordinates[0],
        longitude: coordinates[1],
        description: description.trim(),
        affectedAreaType,
        photoUrl: photoUrl.trim() || undefined,
        reporterName: reporterName.trim(),
        reporterPhone: reporterPhone.trim(),
        reporterId: currentUser?.id,
      });

      if (res.duplicateSuppressed) {
        setDuplicateWarning(
          'Note: Nearby incident reports already exist for this area. Your report has been tagged and grouped for the technician crew.'
        );
      }

      onSuccess(res.report.id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Sample photo helpers for quick testing
  const samplePhotos = [
    { label: 'Downed Wire', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80' },
    { label: 'Damaged Pole', url: 'https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?w=600&auto=format&fit=crop&q=80' },
    { label: 'Sparking Unit', url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-xs font-semibold text-slate-400">Step 1 of 1: Incident Filing</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Report an Electricity Problem
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provide details of the outage or electrical hazard. Information is dispatched directly to the regional engineering operations room.
          </p>
        </div>

        {/* Safety Warning Banner if High Hazard */}
        {selectedCategory && (selectedCategory.hazardLevel === 'LIFE_THREATENING' || selectedCategory.hazardLevel === 'HIGH') && (
          <SafetyBanner
            categoryName={selectedCategory.name}
            warning={selectedCategory.safetyAdvisory}
          />
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              1. What type of problem are you seeing? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map(cat => {
                const isSelected = cat.id === categoryId;
                const isDanger = cat.hazardLevel === 'LIFE_THREATENING' || cat.hazardLevel === 'HIGH';
                return (
                  <div
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? isDanger
                          ? 'border-red-500 bg-red-50/70 shadow-xs'
                          : 'border-amber-500 bg-amber-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900">{cat.name}</span>
                      {isDanger && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase">
                          Hazard
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location Details & Map Pin */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Pin Exact Location *
            </label>
            <p className="text-xs text-slate-500">
              Click anywhere on the map or drag the pin to indicate where the issue is situated.
            </p>

            <InteractiveMap
              interactivePicker={true}
              selectedCoordinates={coordinates}
              onCoordinatesChange={setCoordinates}
              heightClass="h-72"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street / Village / Neighborhood Name *
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="e.g. Makanga Hill Road near District HQ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prominent Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite Kabale Regional Referral Hospital"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Kabale">Kabale</option>
                  <option value="Kisoro">Kisoro</option>
                  <option value="Rukungiri">Rukungiri</option>
                  <option value="Kanungu">Kanungu</option>
                  <option value="Rubanda">Rubanda</option>
                  <option value="Rukiga">Rukiga</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sub-Area</label>
                <input
                  type="text"
                  value={subArea}
                  onChange={e => setSubArea(e.target.value)}
                  placeholder="e.g. Central Division"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scope of Outage</label>
                <select
                  value={affectedAreaType}
                  onChange={e => setAffectedAreaType(e.target.value as AffectedAreaType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="SINGLE_HOUSE">Single Building / House</option>
                  <option value="STREET">Entire Street / Lane</option>
                  <option value="ENTIRE_VILLAGE">Entire Village / Sub-County</option>
                  <option value="UNKNOWN">Uncertain / Unknown</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description & Photo */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Description &amp; Photo Evidence (Optional)
            </label>
            <div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Please describe what happened (e.g., loud bang heard around 3pm, wire snapped across pedestrian footway, lights went dim)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Photo URL (Evidence)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400">Attach sample test photo:</span>
                {samplePhotos.map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setPhotoUrl(item.url)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reporter Contact Info */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              4. Reporter Contact Information
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={e => setReporterName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={reporterPhone}
                  onChange={e => setReporterPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Transmitting to Operations...' : 'Submit Official Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

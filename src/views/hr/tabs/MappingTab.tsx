import { useState } from "react";
import {
  Save,
  AlertTriangle,
  Users,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react";
import HrDateInput from "../../../components/Hr/HrDateInput";

export default function CompanyMappingTab() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState("Executive Level");
  const [selectedLeave, setSelectedLeave] = useState("Standard Leave 2025");
  const [selectedSchedule, setSelectedSchedule] =
    useState("Standard Work Week");
  const [effectiveDate, setEffectiveDate] = useState("2025-02-01");
  const [sendNotification, setSendNotification] = useState(true);
  const [confirmUnderstand, setConfirmUnderstand] = useState(false);

  const handleSaveMapping = () => {
    setShowConfirmModal(true);
  };

  const confirmMapping = () => {
    if (!confirmUnderstand) {
      alert("Please confirm you understand this action");
      return;
    }

    setShowConfirmModal(false);

    // Here you would make API call
    alert(
      "Company Mapping saved successfully!\nAll new employees will use these settings.",
    );
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Company Mapping
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Link organizational settings to company
        </p>
      </div>

      {/* Active Mapping Alert */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              ACTIVE MAPPING FOR: Tech Solutions Ltd
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Last updated: 15 Dec 2024 by HR Admin
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Salary Structure Mapping */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-purple-300 transition-colors">
          <div className="flex items-start">
            <div className="p-3 bg-green-100 rounded-lg mr-4 flex-shrink-0">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                SALARY STRUCTURE
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Currently Linked:{" "}
                <span className="font-medium text-purple-600">
                  {selectedSalary}
                </span>
              </p>

              <select
                value={selectedSalary}
                onChange={(e) => setSelectedSalary(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm mb-3"
              >
                <option>Executive Level</option>
                <option>Mid-Level Staff</option>
                <option>Entry Level</option>
              </select>

              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Users className="w-4 h-4 mr-2" />
                <span>
                  Used by: <strong>12 employees</strong>
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-700">
                  <strong>Preview:</strong> 8 components, ZMW range 5K-25K
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Policy Mapping */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-purple-300 transition-colors">
          <div className="flex items-start">
            <div className="p-3 bg-orange-100 rounded-lg mr-4 flex-shrink-0">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                LEAVE POLICY
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Currently Linked:{" "}
                <span className="font-medium text-purple-600">
                  {selectedLeave}
                </span>
              </p>

              <select
                value={selectedLeave}
                onChange={(e) => setSelectedLeave(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm mb-3"
              >
                <option>Standard Leave 2025</option>
                <option>Probation Leave Policy</option>
              </select>

              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Users className="w-4 h-4 mr-2" />
                <span>
                  Used by: <strong>156 employees</strong>
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-700">
                  <strong>Preview:</strong> Annual 24d, Sick 14d, Maternity 90d
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Work Schedule Mapping */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-purple-300 transition-colors">
          <div className="flex items-start">
            <div className="p-3 bg-indigo-100 rounded-lg mr-4 flex-shrink-0">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                WORK SCHEDULE
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Currently Linked:{" "}
                <span className="font-medium text-purple-600">
                  {selectedSchedule}
                </span>
              </p>

              <select
                value={selectedSchedule}
                onChange={(e) => setSelectedSchedule(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm mb-3"
              >
                <option>Standard Work Week</option>
                <option>Hybrid Schedule</option>
                <option>Shift Pattern A</option>
              </select>

              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Users className="w-4 h-4 mr-2" />
                <span>
                  Used by: <strong>134 employees</strong>
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-700">
                  <strong>Preview:</strong> Mon-Fri 08:00-17:00, 40 hrs/week
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Effective Date */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <div className="flex items-start">
            <div className="p-3 bg-blue-100 rounded-lg mr-4 flex-shrink-0">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                EFFECTIVE DATE
              </h3>
              <p className="text-sm text-gray-600 mb-4">Apply changes from:</p>

              <HrDateInput
                value={effectiveDate}
                onChange={(v) => setEffectiveDate(v)}
                placeholder="DD/MM/YYYY"
                inputClassName="px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              />

              <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200 flex items-start">
                <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Changing date affects payroll calculations and leave
                  entitlements for existing employees
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveMapping}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <Save className="w-5 h-5" />
          Save Mapping & Apply
        </button>
      </div>

      {/* Mapping History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          MAPPING HISTORY
        </h3>
        <div className="space-y-3">
          <HistoryItem
            date="01 Jan 2025"
            action="Salary Structure changed to Executive Level"
            type="salary"
          />
          <HistoryItem
            date="15 Dec 2024"
            action="Leave Policy updated to Standard 2025"
            type="leave"
          />
          <HistoryItem
            date="01 Dec 2024"
            action="Initial mapping created"
            type="system"
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl animate-slideUp">
            <div className="flex items-start mb-4">
              <div className="p-2 bg-amber-100 rounded-lg mr-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Mapping Change
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Review impact before proceeding
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  IMPACT ANALYSIS:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      New employees will use these settings automatically
                    </span>
                  </li>
                  <li className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Existing 211 employees remain on current settings
                    </span>
                  </li>
                  <li className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Effective from: {effectiveDate}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="border-t pt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applied to new employees starting from:
                </label>
                <HrDateInput
                  value={effectiveDate}
                  onChange={(v) => setEffectiveDate(v)}
                  placeholder="DD/MM/YYYY"
                  inputClassName="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className="flex items-start text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <span className="text-gray-700">
                  Send notification to HR team about this change
                </span>
              </label>
              <label className="flex items-start text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmUnderstand}
                  onChange={(e) => setConfirmUnderstand(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <span className="text-gray-700 font-medium">
                  I understand this will affect all new employee onboarding
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmMapping}
                disabled={!confirmUnderstand}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryItem({
  date,
  action,
  type,
}: {
  date: string;
  action: string;
  type: string;
}) {
  const getIcon = () => {
    switch (type) {
      case "salary":
        return <DollarSign className="w-3 h-3" />;
      case "leave":
        return <Calendar className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex items-start py-3 border-b last:border-0">
      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-3 flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{action}</p>
        <p className="text-xs text-gray-500 mt-0.5">{date} • HR Admin</p>
      </div>
    </div>
  );
}

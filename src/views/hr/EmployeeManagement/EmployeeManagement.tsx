import React, { useState } from "react";
import { Users } from "lucide-react";

import EmployeeDirectory from "./EmployeeDirectory";

const EmployeeManagement: React.FC = () => {
  const [mainTab, setMainTab] = useState<"directory">("directory");

  return (
    <div className="bg-app">
      <div className="space-y-6">
        <div className="flex gap-8 border-b border-gray-300 pb-4 overflow-x-auto">
          <button
            onClick={() => setMainTab("directory")}
            className={`flex items-center gap-2 text-sm font-semibold pb-2 border-b-2 transition ${
              mainTab === "directory"
                ? "text-primary border-primary"
                : "text-muted border-transparent hover:text-main"
            }`}
          >
            <Users size={15} /> Employee Directory
          </button>
        </div>

        <div>{mainTab === "directory" && <EmployeeDirectory />}</div>
      </div>
    </div>
  );
};

export default EmployeeManagement;

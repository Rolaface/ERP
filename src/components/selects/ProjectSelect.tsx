import React from "react";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { fetchProjects } from "../../api/getAllApi";
import type { SearchOption } from "../../api/getAllApi";

interface ProjectSelectProps {
  value?: string;
  onChange: (value: string, option: SearchOption) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const ProjectSelect: React.FC<ProjectSelectProps> = ({
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  return (
    <SearchSelect2
      label="Project"
      value={value}
      onChange={onChange}
      fetchOptions={fetchProjects}
      placeholder="Search project..."
      error={error}
      required={required}
      disabled={disabled}
    />
  );
};

export default ProjectSelect;
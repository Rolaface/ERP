import { useEffect, useMemo, useState } from "react";

import { getSalaryStructureAssignments } from "../api/salaryStructureAssignmentApi";
import { getSalaryStructureById } from "../api/salaryStructureApi";

type AssignedSalaryStructureResult = {
  assignedSalaryStructureName: string;
  assignedSalaryStructureFromDate: string;
  salaryStructureDetail: any | null;
  loading: boolean;
  error: string | null;
};

export function useAssignedSalaryStructure(
  employeeCode: string,
): AssignedSalaryStructureResult {
  const code = useMemo(() => String(employeeCode ?? "").trim(), [employeeCode]);

  const [assignedSalaryStructureName, setAssignedSalaryStructureName] =
    useState<string>("");
  const [assignedSalaryStructureFromDate, setAssignedSalaryStructureFromDate] =
    useState<string>("");
  const [salaryStructureDetail, setSalaryStructureDetail] = useState<
    any | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!code) {
        setAssignedSalaryStructureName("");
        setAssignedSalaryStructureFromDate("");
        setSalaryStructureDetail(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const list = await getSalaryStructureAssignments({ employee: code });
        let rows = Array.isArray(list) ? list : [];

        if (rows.length === 0) {
          const all = await getSalaryStructureAssignments();
          const allRows = Array.isArray(all) ? all : [];
          rows = allRows.filter(
            (r: any) => String(r?.employee ?? "").trim() === code,
          );
        }

        const best = rows
          .filter((r: any) => String(r?.salary_structure ?? "").trim())
          .sort((a: any, b: any) => {
            const ad = String(a?.from_date ?? "");
            const bd = String(b?.from_date ?? "");
            return bd.localeCompare(ad);
          })[0];

        const name = String(best?.salary_structure ?? "").trim();
        const fromDate = String(best?.from_date ?? "").trim();

        if (!mounted) return;
        setAssignedSalaryStructureName(name);
        setAssignedSalaryStructureFromDate(fromDate);

        if (!name) {
          setSalaryStructureDetail(null);
          return;
        }

        const detail = await getSalaryStructureById(name);
        if (!mounted) return;
        setSalaryStructureDetail(detail);
      } catch (e: any) {
        if (!mounted) return;
        setAssignedSalaryStructureName("");
        setAssignedSalaryStructureFromDate("");
        setSalaryStructureDetail(null);
        setError(e?.message ?? "Failed to load salary structure");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [code]);

  return {
    assignedSalaryStructureName,
    assignedSalaryStructureFromDate,
    salaryStructureDetail,
    loading,
    error,
  };
}

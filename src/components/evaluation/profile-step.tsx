"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEvaluation } from "@/components/evaluation/evaluation-context";
import {
  COMMON_POSITIONS,
  OFFICES,
  PERSONNEL_CATEGORIES,
  RATING_PERIODS,
} from "@/data/reference";
import { updateOfficeSelection } from "@/lib/evaluation-client";
import { APPOINTMENT_LABELS, PERSONNEL_CATEGORY_LABELS } from "@/lib/utils";
import type { AppointmentType, PersonnelCategory } from "@/lib/types";

export function ProfileStep() {
  const { state, updateProfile } = useEvaluation();
  if (!state) return null;
  const p = state.profile;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-primary/5 p-4">
        <h3 className="font-semibold text-parsu-dark">Personnel and Evaluation Information</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Required before rating computation: Name, Position, Office, Personnel Category,
          Appointment, Year, and Rating Period.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="employeeName">Name of Employee *</Label>
          <Input
            id="employeeName"
            value={p.employeeName}
            onChange={(e) => updateProfile({ employeeName: e.target.value })}
            placeholder="Full name"
          />
        </div>

        <div>
          <Label>Personnel Category *</Label>
          <Select
            value={p.personnelCategory}
            onValueChange={(v) => {
              const category = v as PersonnelCategory;
              updateProfile({
                personnelCategory: category,
                positionTitle:
                  category === "UNIVERSITY_DRIVER" ? "University Driver" : p.positionTitle,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERSONNEL_CATEGORIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {PERSONNEL_CATEGORIES.find((c) => c.code === p.personnelCategory)?.description}
          </p>
        </div>

        <div>
          <Label>Position Title *</Label>
          <Select
            value={COMMON_POSITIONS.includes(p.positionTitle) ? p.positionTitle : "Other"}
            onValueChange={(title) => {
              if (title !== "Other") updateProfile({ positionTitle: title });
              else updateProfile({ positionTitle: "" });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_POSITIONS.map((title) => (
                <SelectItem key={title} value={title}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(!COMMON_POSITIONS.includes(p.positionTitle) || p.positionTitle === "") && (
            <Input
              className="mt-2"
              value={p.positionTitle}
              onChange={(e) => updateProfile({ positionTitle: e.target.value })}
              placeholder="Specify position title"
            />
          )}
        </div>

        <div className="sm:col-span-2">
          <Label>Office / Unit / College *</Label>
          <Select
            value={p.officeCode}
            onValueChange={(code) => updateProfile(updateOfficeSelection(p, code))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {OFFICES.map((o) => (
                <SelectItem key={o.code} value={o.code}>
                  {o.name}
                  {o.campus ? ` — ${o.campus}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Functional Department</Label>
          <Input value={p.functionalDepartment} readOnly disabled className="bg-muted" />
        </div>

        <div>
          <Label>Supervising Office</Label>
          <Input value={p.supervisingOffice} readOnly disabled className="bg-muted" />
        </div>

        <div>
          <Label>Appointment Status *</Label>
          <Select
            value={p.appointmentType}
            onValueChange={(v) => updateProfile({ appointmentType: v as AppointmentType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(APPOINTMENT_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Evaluation Year *</Label>
          <Input
            type="number"
            value={p.evaluationYear}
            onChange={(e) =>
              updateProfile({ evaluationYear: parseInt(e.target.value, 10) || 2026 })
            }
          />
        </div>

        <div>
          <Label>Rating Period *</Label>
          <Select value={p.ratingPeriod} onValueChange={(v) => updateProfile({ ratingPeriod: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RATING_PERIODS.map((period) => (
                <SelectItem key={period} value={period}>
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label>Immediate Supervisor</Label>
          <Input
            value={p.supervisorName ?? ""}
            onChange={(e) => updateProfile({ supervisorName: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2 flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={p.hasDesignation}
              onChange={(e) => updateProfile({ hasDesignation: e.target.checked })}
            />
            Has official designation (Office Order)
          </label>
        </div>

        {p.hasDesignation && (
          <div className="sm:col-span-2">
            <Label>Official Designation Title</Label>
            <Input
              value={p.designationTitle ?? ""}
              onChange={(e) => updateProfile({ designationTitle: e.target.value })}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Evaluation category: {PERSONNEL_CATEGORY_LABELS[p.personnelCategory]}
      </p>
    </div>
  );
}

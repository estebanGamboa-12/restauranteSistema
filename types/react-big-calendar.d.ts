declare module "react-big-calendar" {
  import type { ComponentType } from "react";

  export interface Event {
    title?: string;
    start?: Date;
    end?: Date;
    resource?: unknown;
    allDay?: boolean;
  }

  export interface SlotInfo {
    start: Date;
    end: Date;
    slots: Date[];
    action: "select" | "click" | "doubleClick";
  }

  export const Calendar: ComponentType<Record<string, unknown>>;
  export const Views: Record<string, string>;
  export function dateFnsLocalizer(config: Record<string, unknown>): unknown;
}

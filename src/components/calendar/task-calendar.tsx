"use client";

import { useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { vi } from "date-fns/locale";
import type { Task } from "@/types/database";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { vi };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: vi }),
  getDay,
  locales,
});

const statusColors = {
  todo: "#94a3b8",
  in_progress: "#facc15",
  done: "#22c55e",
};

interface TaskCalendarProps {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

export function TaskCalendar({ tasks, onSelectTask }: TaskCalendarProps) {
  const events = useMemo(() => {
    return tasks
      .filter((task) => task.due_date || task.start_date)
      .map((task) => ({
        id: task.id,
        title: task.title,
        start: task.start_date
          ? new Date(task.start_date)
          : new Date(task.due_date!),
        end: task.due_date
          ? new Date(task.due_date)
          : new Date(task.start_date!),
        allDay: true,
        resource: task,
      }));
  }, [tasks]);

  const eventStyleGetter = (event: (typeof events)[0]) => {
    const task = event.resource as Task;
    return {
      style: {
        backgroundColor: statusColors[task.status],
        borderRadius: "4px",
        border: "none",
        color: task.status === "in_progress" ? "#000" : "#fff",
        padding: "2px 4px",
      },
    };
  };

  const messages = {
    allDay: "Cả ngày",
    previous: "Trước",
    next: "Sau",
    today: "Hôm nay",
    month: "Tháng",
    week: "Tuần",
    day: "Ngày",
    agenda: "Lịch trình",
    date: "Ngày",
    time: "Giờ",
    event: "Sự kiện",
    noEventsInRange: "Không có task nào trong khoảng thời gian này.",
  };

  return (
    <div className="h-[600px] bg-background rounded-lg border p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
        defaultView={Views.MONTH}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => onSelectTask?.(event.resource as Task)}
        messages={messages}
        culture="vi"
        popup
        className="task-calendar"
      />
      <style jsx global>{`
        .task-calendar .rbc-toolbar {
          margin-bottom: 1rem;
        }
        .task-calendar .rbc-toolbar button {
          color: hsl(var(--foreground));
          border-color: hsl(var(--border));
        }
        .task-calendar .rbc-toolbar button:hover {
          background-color: hsl(var(--accent));
        }
        .task-calendar .rbc-toolbar button.rbc-active {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .task-calendar .rbc-header {
          padding: 0.5rem;
          font-weight: 500;
        }
        .task-calendar .rbc-today {
          background-color: hsl(var(--accent));
        }
        .task-calendar .rbc-off-range-bg {
          background-color: hsl(var(--muted));
        }
        .task-calendar .rbc-event {
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}

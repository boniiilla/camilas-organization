import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

type Reminder = {
  id: string;
  reference_id: string;
  type: string;
  mode: string;
  remind_from: string | null;
  remind_until: string | null;
  remind_time: string | null;
};

const api = (path: string, opts?: RequestInit) =>
  fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...opts?.headers,
    },
  });

interface Props {
  referenceId: string;
  type: "examen" | "tarea";
  title: string;
  dueDate: string;
  reminder?: Reminder;
}

export default function ReminderButton({ referenceId, type, title, dueDate, reminder }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(!!reminder);
  const [fromDate, setFromDate] = useState(reminder?.remind_from ?? "");
  const [untilDate, setUntilDate] = useState(reminder?.remind_until ?? "");
  const [remindTime, setRemindTime] = useState(reminder?.remind_time ?? "09:00");

  const save = useMutation({
    mutationFn: () =>
      api("/api/reminders", {
        method: "POST",
        body: JSON.stringify({
          reference_id: referenceId,
          type,
          title,
          due_date: dueDate,
          mode: "personalizado",
          remind_from: fromDate,
          remind_until: untilDate,
          remind_time: remindTime,
        }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const remove = useMutation({
    mutationFn: () => api(`/api/reminders/${reminder!.id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const handleToggle = (checked: boolean) => {
    setActive(checked);
    if (!checked && reminder) remove.mutate();
  };

  const handleSave = () => {
    save.mutate(undefined, { onSuccess: () => setOpen(false) });
  };

  const isActive = !!reminder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={isActive ? "Recordatorio activo" : "Agregar recordatorio"}
          className={isActive ? "text-primary" : ""}
        >
          {isActive ? <Bell className="h-4 w-4 fill-primary" /> : <Bell className="h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 space-y-4" align="end">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Recordatorio</Label>
          <Switch
            checked={active}
            onCheckedChange={handleToggle}
            disabled={remove.isPending}
          />
        </div>

        {active && (
          <>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  max={dueDate}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={untilDate}
                  onChange={(e) => setUntilDate(e.target.value)}
                  min={fromDate}
                  max={dueDate}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hora de notificación</Label>
                <Input
                  type="time"
                  value={remindTime}
                  onChange={(e) => setRemindTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={handleSave}
              disabled={save.isPending || !fromDate || !untilDate || !remindTime}
            >
              {save.isPending ? "Guardando..." : "Guardar recordatorio"}
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

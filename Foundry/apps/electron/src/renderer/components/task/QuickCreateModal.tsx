import { useState } from "react";

import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, PRIORITY_COLORS } from "../../lib/constants";
import { useTaskStore } from "../../stores/taskStore";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function QuickCreateModal({ open, onClose, projectId }: Props) {
  const createTask = useTaskStore((s) => s.createTask);
  const addToast = useUIStore((s) => s.addToast);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignee, setAssignee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [estimateHours, setEstimateHours] = useState("");

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssignee("");
    setStartDate("");
    setEndDate("");
    setEstimateHours("");
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    try {
      await createTask({
        projectId,
        title: title.trim(),
        description: description.trim(),
        priority,
        assignee: assignee.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        estimateHours: estimateHours ? Number(estimateHours) : 0,
      });
      addToast(`Task "${title}" created`, "success");
      resetForm();
      onClose();
    } catch (e) {
      addToast(`Failed: ${(e as Error).message}`, "error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Task">
      <div className="space-y-3">
        <Input
          label="Title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
            Description
          </label>
          <textarea
            className="h-20 resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:text-zinc-600"
            placeholder="Optional description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Priority</label>
          <div className="flex gap-1.5">
            {TASK_PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  priority === p
                    ? `${PRIORITY_COLORS[p].bg} ${PRIORITY_COLORS[p].text} ring-2 ring-offset-1 ring-current`
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {TASK_PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Estimate (hours)"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 8"
            value={estimateHours}
            onChange={(e) => setEstimateHours(e.target.value)}
          />
          <Input
            label="Assignee"
            placeholder="e.g. @alice"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
}

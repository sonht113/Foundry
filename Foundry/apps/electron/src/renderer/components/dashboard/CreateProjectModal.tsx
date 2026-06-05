import { useState } from "react";

import { useProjectStore } from "../../stores/projectStore";
import { useUIStore } from "../../stores/uiStore";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ open, onClose }: Props) {
  const createProject = useProjectStore((s) => s.createProject);
  const addToast = useUIStore((s) => s.addToast);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit() {
    if (!name.trim()) return;
    try {
      await createProject(name.trim(), description.trim());
      addToast(`Project "${name}" created`, "success");
      setName("");
      setDescription("");
      onClose();
    } catch (e) {
      addToast(`Failed: ${(e as Error).message}`, "error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Project">
      <div className="space-y-3">
        <Input
          label="Name"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Input
          label="Description"
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
}

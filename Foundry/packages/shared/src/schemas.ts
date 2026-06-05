import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(2000).default(""),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).default(""),
  status: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  assignee: z.string().max(100).default(""),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  estimateHours: z.number().min(0).default(0),
  tags: z.array(z.string()).default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  assignee: z.string().max(100).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  estimateHours: z.number().min(0).optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
});

export const createNoteSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().min(1, "Note content is required"),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1),
});

export const searchTasksSchema = z.object({
  query: z.string().min(1),
  projectId: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  limit: z.number().min(1).max(100).default(50),
});

import { z } from "zod";

export function registerProjectTools(server: any, projectService: any) {
  server.registerTool(
    "list_projects",
    {
      description: "List all projects. Optionally include archived projects.",
      inputSchema: {
        includeArchived: z.boolean().optional().default(false),
      },
    },
    async ({ includeArchived }: { includeArchived: boolean }) => {
      const projects = await projectService.list(includeArchived);
      if (projects.length === 0) {
        return { content: [{ type: "text" as const, text: "No projects found." }] };
      }
      const formatted = projects
        .map(
          (p: any) =>
            `[${p.id}] ${p.name}${p.archived_at ? " (archived)" : ""} - ${p.description || "No description"}`
        )
        .join("\n");
      return { content: [{ type: "text" as const, text: `Projects:\n${formatted}` }] };
    }
  );

  server.registerTool(
    "get_project",
    {
      description: "Get a project by ID.",
      inputSchema: { id: z.string().describe("Project ID (e.g. proj_xxx)") },
    },
    async ({ id }: { id: string }) => {
      const project = await projectService.getById(id);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(project, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_project",
    {
      description: "Create a new project.",
      inputSchema: {
        name: z.string().min(1).describe("Project name"),
        description: z.string().optional().describe("Project description"),
      },
    },
    async ({ name, description }: { name: string; description?: string }) => {
      const project = await projectService.create({ name, description });
      return {
        content: [
          {
            type: "text" as const,
            text: `Project created: ${project.name} (ID: ${project.id})`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "update_project",
    {
      description: "Update a project name or description.",
      inputSchema: {
        id: z.string().describe("Project ID"),
        name: z.string().optional().describe("New project name"),
        description: z.string().optional().describe("New project description"),
      },
    },
    async ({ id, name, description }: { id: string; name?: string; description?: string }) => {
      const project = await projectService.update(id, { name, description });
      return {
        content: [
          {
            type: "text" as const,
            text: `Project updated: ${project.name} (ID: ${project.id})`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "delete_project",
    {
      description: "Delete a project. Warning: This cascades to all tasks.",
      inputSchema: { id: z.string().describe("Project ID to delete") },
    },
    async ({ id }: { id: string }) => {
      const project = await projectService.getById(id);
      await projectService.remove(id);
      return {
        content: [
          {
            type: "text" as const,
            text: `Project deleted: ${project.name} (ID: ${id})`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "archive_project",
    {
      description: "Archive a project (soft delete).",
      inputSchema: { id: z.string().describe("Project ID to archive") },
    },
    async ({ id }: { id: string }) => {
      const project = await projectService.archive(id);
      return {
        content: [
          {
            type: "text" as const,
            text: `Project archived: ${project.name} (ID: ${project.id})`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "unarchive_project",
    {
      description: "Restore an archived project.",
      inputSchema: { id: z.string().describe("Project ID to restore") },
    },
    async ({ id }: { id: string }) => {
      const project = await projectService.unarchive(id);
      return {
        content: [
          {
            type: "text" as const,
            text: `Project restored: ${project.name} (ID: ${project.id})`,
          },
        ],
      };
    }
  );
}

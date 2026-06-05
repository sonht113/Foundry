import { z } from "zod";

export function registerAITools(server: any, projectService: any, taskService: any) {
  server.registerTool(
    "analyze_project",
    {
      description: "Analyze project health: task distribution, blockages, progress.",
      inputSchema: { projectId: z.string().describe("Project ID to analyze") },
    },
    async ({ projectId }: { projectId: string }) => {
      const project = await projectService.getById(projectId);
      const tasks = await taskService.list(projectId);

      if (tasks.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Project "${project.name}" has no tasks yet.`,
            },
          ],
        };
      }

      const byStatus: Record<string, number> = { todo: 0, doing: 0, review: 0, done: 0 };
      const byPriority: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };

      for (const t of tasks) {
        byStatus[t.status] = (byStatus[t.status] || 0) + 1;
        byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      }

      const total = tasks.length;
      const donePercent = total > 0 ? Math.round((byStatus.done / total) * 100) : 0;

      const analysis = [
        `## Project: ${project.name}`,
        `Total tasks: ${total}`,
        `Progress: ${donePercent}% done (${byStatus.done} completed)`,
        ``,
        `### Status Distribution`,
        `  Todo:    ${byStatus.todo}`,
        `  Doing:   ${byStatus.doing}`,
        `  Review:  ${byStatus.review}`,
        `  Done:    ${byStatus.done}`,
        ``,
        `### Priority Distribution`,
        `  Critical: ${byPriority.critical}`,
        `  High:     ${byPriority.high}`,
        `  Medium:   ${byPriority.medium}`,
        `  Low:      ${byPriority.low}`,
        ``,
      ];

      const now = new Date();
      const stalled = tasks.filter((t: any) => {
        if (t.status === "done") return false;
        const updated = new Date(t.updated_at);
        return now.getTime() - updated.getTime() > 7 * 24 * 60 * 60 * 1000;
      });

      if (stalled.length > 0) {
        analysis.push("### Stalled Tasks (>7 days without update)");
        stalled.forEach((t: any) => {
          analysis.push(`  [${t.id}] ${t.title}`);
        });
      }

      return {
        content: [{ type: "text" as const, text: analysis.join("\n") }],
      };
    }
  );

  server.registerTool(
    "generate_tasks_from_prompt",
    {
      description:
        "Generate tasks from a natural language prompt. AI-powered generation coming in Phase 3.",
      inputSchema: {
        projectId: z.string().describe("Target project ID"),
        prompt: z.string().min(1).describe("Describe what needs to be built"),
      },
    },
    async ({ projectId, prompt }: { projectId: string; prompt: string }) => {
      const project = await projectService.getById(projectId);
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `## Task Breakdown Suggestion for: ${project.name}`,
              `Prompt: "${prompt}"`,
              ``,
              `AI-powered task generation is coming in Phase 3.`,
              `For now, use \`create_task\` with projectId "${projectId}" to manually create tasks.`,
              ``,
              `Suggested approach:`,
              `1. Break down "${prompt}" into logical sub-tasks`,
              `2. Use \`create_task\` for each sub-task with appropriate priority`,
              `3. Use \`list_tasks\` to verify the result`,
            ].join("\n"),
          },
        ],
      };
    }
  );

  server.registerTool(
    "breakdown_task",
    {
      description: "Suggest breaking down a task into sub-tasks. AI generation coming in Phase 3.",
      inputSchema: { taskId: z.string().describe("Task ID to break down") },
    },
    async ({ taskId }: { taskId: string }) => {
      const task = await taskService.getById(taskId);
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `## Task Breakdown for: ${task.title}`,
              `ID: ${task.id}`,
              ``,
              `AI-powered task breakdown coming in Phase 3.`,
              ``,
              `Current state: Status=${task.status} Priority=${task.priority}`,
              `Description: ${task.description || "None"}`,
            ].join("\n"),
          },
        ],
      };
    }
  );
}

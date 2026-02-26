export const aiTools = [
  {
    type: "function",
    function: {
      name: "search_agents",
      description: "Search for real estate agents (users with 'agent' role) by name.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name or part of the name of the agent to search for.",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_reminder",
      description: "Create a reminder or schedule a visit for an agent.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title of the reminder/visit." },
          note: { type: "string", description: "Optional descriptive note." },
          responsibleId: { type: "number", description: "ID of the agent responsible for this reminder." },
          scheduledAt: { type: "string", description: "ISO date string for the reminder/visit (e.g. 2026-12-31T10:00:00Z)." },
          buildingId: { type: "number", description: "Optional ID of the building." },
          propertyId: { type: "number", description: "Optional ID of the property." },
        },
        required: ["title", "responsibleId", "scheduledAt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_agent_to_building",
      description: "Assign an agent to a building for a specific period (following).",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "number", description: "ID of the agent." },
          buildingId: { type: "number", description: "ID of the building." },
          startDate: { type: "string", description: "ISO date string for start." },
          endDate: { type: "string", description: "ISO date string for end." },
        },
        required: ["userId", "buildingId", "startDate", "endDate"],
      },
    },
  },
];

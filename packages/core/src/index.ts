// @classync/core — public API
// All DB access must go through these exports. Never import @prisma/client directly from apps/.

export { prisma } from "./db";

// Services
export * from "./services/guilds";
export * from "./services/items";
export * from "./services/status";
export * from "./services/concepts";
export * from "./services/requests";
export * from "./services/answers";
export * from "./services/topicRooms";
export * from "./services/students";

// Re-export Prisma types needed by web
export type { ItemKind, StatusState, RequestState, TopicRoomState } from "@prisma/client";

// LLM
export * from "./llm";

// @classync/core — public API
// All DB access must go through these exports. Never import @prisma/client directly from apps/.
//
// Re-exports are listed by name on purpose: the package is CommonJS for the Next/Vercel build, and
// esbuild/tsx only annotates NAMED re-exports for Node's ESM-from-CJS import. `export *` would
// leave the ESM bot unable to see any service (runtime "does not provide an export named" error).

export { prisma } from "./db";

// services/guilds
export {
  getOrCreateGuild,
  setAnnouncementChannel,
  addTaUser,
  getGuildByDiscordId,
  getGuildsForTa,
  isTa,
} from "./services/guilds";

// services/items
export {
  createItem,
  getItemsByGuild,
  getItemById,
  updateItem,
  getItemAggregate,
} from "./services/items";

// services/status
export {
  getMyStatus,
  setStatus,
  markReminded,
  getMyStatuses,
} from "./services/status";

// services/concepts
export {
  normalizeLabel,
  getOrCreateConcept,
  getConceptsForItem,
  getConceptById,
  getStuckCount,
  getDifficultyList,
  getHeatMapData,
} from "./services/concepts";

// services/requests
export {
  createHelpRequest,
  getOpenRequestsForConcept,
  getOpenRequestCount,
  markRequestsAnswered,
} from "./services/requests";

// services/answers
export {
  createAnswer,
  getPendingAnswers,
  stampDelivered,
  getLatestAnswerForConcept,
  getAnswersForGuild,
  getDeliveredAnswerCount,
} from "./services/answers";

// services/students
export {
  getOrCreateStudent,
  giveConsent,
  revokeAndDelete,
  hasConsented,
  getConsentedStudentCount,
} from "./services/students";

// services/matches
export {
  findProviders,
  createMatch,
  acceptMatch,
  declineOffer,
  resolveMatch,
  reportMatch,
  revealIdentity,
  getActiveMatchForUser,
  getMatchStudentId,
  expirePendingMatches,
  setHelperOptIn,
} from "./services/matches";
export type { ProviderCandidate, ActiveMatchView, ExpiredMatch } from "./services/matches";

// services/matchMetrics
export {
  getPeerMetrics,
} from "./services/matchMetrics";
export type { PeerMetrics } from "./services/matchMetrics";

// llm
export {
  parseAnnouncement,
} from "./llm";
export type { ParsedAnnouncement } from "./llm";

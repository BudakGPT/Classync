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
  setHelpForumChannel,
  claimGuildOwnership,
  transferGuildOwnership,
  removeTaUser,
  getGuildByDiscordId,
  getGuildById,
  getGuildsForTa,
  isTa,
} from "./services/guilds";

// services/items
export {
  createItem,
  parseJakartaDueAt,
  getItemsDueWithin,
  getItemsByGuild,
  getItemById,
  updateItem,
  getItemAggregate,
  setItemDiscordCategory,
} from "./services/items";

// services/status
export { getMyStatus, setStatus, markReminded, getMyStatuses, getMyStatusMap } from "./services/status";

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
  getAnsweredRequestsForDelivery,
  getTaQueue,
  getTaAnswerableConcepts,
} from "./services/requests";

// services/answers
export {
  createAnswer,
  getPendingAnswers,
  getAnswerDeliveryContext,
  stampDelivered,
  getLatestAnswerForConcept,
  getAnswersForGuild,
  getDeliveredAnswerCount,
} from "./services/answers";

// services/topicRooms
export {
  getOrCreateTopicRoom,
  getTopicRoomForConcept,
  getJoinableTopicRoom,
  claimTopicRoomProvisioning,
  releaseTopicRoomProvisioning,
  setTopicRoomChannel,
  addTopicRoomMember,
  isTopicRoomMember,
  getTopicRoomMembers,
  removeTopicRoomMember,
  closeTopicRoom,
  reopenTopicRoom,
  getTopicRoomByChannelId,
  getTopicRoomsForItem,
  deleteTopicRoom,
  getTopicRoomsForGuild,
} from "./services/topicRooms";

// services/students
export {
  getOrCreateStudent,
  getConsentedStudent,
  getReminderRecipients,
  giveConsent,
  revokeAndDelete,
  getStudentJoinedRoomChannels,
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
export { getPeerMetrics } from "./services/matchMetrics";
export type { PeerMetrics } from "./services/matchMetrics";

// Re-export Prisma enum types needed by web
export type { ItemKind, StatusState, RequestState, TopicRoomState, MatchState } from "@prisma/client";

// llm
export { parseAnnouncement } from "./llm";
export type { ParsedAnnouncement } from "./llm";

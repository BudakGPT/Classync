"use server";

import { prisma, createAnswer, markRequestsAnswered } from "@classync/core";
import type { Assignment, HelpCluster, ReusableAnswer, Person, ClassId, TaskState } from "@/lib/types";

export interface DbSyncPayload {
  connected: boolean;
  guild: {
    id: string;
    name: string;
    discordGuildId: string;
    announcementChannelId: string | null;
  } | null;
  assignments: Assignment[];
  helpClusters: HelpCluster[];
  answers: ReusableAnswer[];
  students: Person[];
}

export async function getDbSyncState(): Promise<DbSyncPayload> {
  try {
    const guild = await prisma.guild.findFirst({
      orderBy: { installedAt: "desc" },
    });

    if (!guild) {
      return {
        connected: true,
        guild: null,
        assignments: [],
        helpClusters: [],
        answers: [],
        students: [],
      };
    }

    // Fetch items with concepts, help requests, answers, and statuses
    const items = await prisma.item.findMany({
      where: { guildId: guild.id },
      include: {
        concepts: {
          include: {
            helpRequests: {
              include: { student: true },
            },
            answers: true,
          },
        },
        statuses: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch all answers
    const answers = await prisma.answer.findMany({
      where: { concept: { item: { guildId: guild.id } } },
      include: {
        concept: {
          include: { item: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch students
    const students = await prisma.student.findMany({
      where: { guildId: guild.id },
    });

    // Map DB items to Assignment[]
    const dbAssignments: Assignment[] = items.map((item) => {
      let category: Assignment["category"] = "Assignment";
      if (item.kind === "QUIZ") category = "Quiz";
      else if (item.kind === "READING") category = "Reading";
      else if (item.kind === "EXAM") category = "Quiz";

      const progress: Record<string, TaskState> = {};
      for (const st of item.statuses) {
        let taskState: TaskState = "not_started";
        if (st.state === "DONE") taskState = "completed";
        else if (st.state === "IN_PROGRESS") taskState = "in_progress";
        else if (st.state === "STUCK") taskState = "stuck";
        progress[st.studentId] = taskState;
      }

      return {
        id: `db-item-${item.id}`,
        title: item.title,
        classId: "A" as ClassId,
        category,
        due: item.dueAt ? item.dueAt.toISOString() : new Date(Date.now() + 86400000 * 3).toISOString(),
        createdAt: item.createdAt.toISOString(),
        createdBy: "farhan",
        description: item.description ?? "Task synchronized from Discord /ta command or announcement.",
        progress,
        helpClusterIds: item.concepts.map((c) => `db-concept-${c.id}`),
        notificationIds: [],
        isNew: true,
        dbItemId: item.id,
      };
    });

    // Map DB concepts to HelpCluster[]
    const dbHelpClusters: HelpCluster[] = [];
    for (const item of items) {
      for (const c of item.concepts) {
        const stuckCount = item.statuses.filter((s) => s.conceptId === c.id && s.state === "STUCK").length;
        const requesters = c.helpRequests.map((r) => r.student.discordUserId);
        const hasDeliveredAnswer = c.answers.some((a) => a.deliveredAt !== null);
        const hasPendingAnswer = c.answers.length > 0;
        const openRequests = c.helpRequests.filter((r) => r.state === "OPEN");

        const status: HelpCluster["status"] = hasDeliveredAnswer || (hasPendingAnswer && openRequests.length === 0)
          ? "answered"
          : "open";

        const priority: HelpCluster["priority"] =
          openRequests.length >= 3 ? "High" : openRequests.length >= 2 ? "Medium" : "Low";

        dbHelpClusters.push({
          id: `db-concept-${c.id}`,
          concept: c.label,
          classId: "A" as ClassId,
          assignmentId: `db-item-${item.id}`,
          reports: Math.max(stuckCount, requesters.length),
          requesterIds: requesters,
          firstReportAt: c.createdAt.toISOString(),
          priority,
          status,
          answeredAt: c.answers[0]?.deliveredAt ? c.answers[0].deliveredAt.toISOString() : c.answers[0]?.createdAt?.toISOString(),
          answerId: c.answers[0] ? `db-ans-${c.answers[0].id}` : undefined,
          sampleQuestion: `Kesulitan pada ${item.title}: "${c.label}"`,
          dbConceptId: c.id,
          dbGuildId: guild.id,
        });
      }
    }

    // Map DB answers to ReusableAnswer[]
    const dbAnswers: ReusableAnswer[] = answers.map((ans) => ({
      id: `db-ans-${ans.id}`,
      title: `Penjelasan: ${ans.concept.label}`,
      concept: ans.concept.label,
      body: ans.body,
      usedCount: Math.max(ans.deliveredCount, 1),
      helpfulPct: 100,
      authorId: "farhan",
      updatedAt: ans.createdAt.toISOString(),
      isNew: true,
      dbAnswerId: ans.id,
      deliveredAt: ans.deliveredAt ? ans.deliveredAt.toISOString() : null,
      deliveredCount: ans.deliveredCount,
    }));

    // Map DB students to Person[]
    const dbStudents: Person[] = students.map((s, idx) => ({
      id: s.discordUserId,
      name: `Mahasiswa (${s.discordUserId.slice(-4)})`,
      role: "Student",
      isAdmin: false,
      classId: "A" as ClassId,
      npm: `14081023${String(idx + 1).padStart(4, "0")}`,
      email: `student.${s.discordUserId.slice(-4)}@campus.ac.id`,
      discord: `<@${s.discordUserId}>`,
      verification: "Verified",
      presence: "online",
      status: "Active",
      joinedAt: s.consentedAt ? s.consentedAt.toISOString() : new Date().toISOString(),
      isNew: false,
    }));

    return {
      connected: true,
      guild: {
        id: guild.id,
        name: guild.name,
        discordGuildId: guild.discordGuildId,
        announcementChannelId: guild.announcementChannelId,
      },
      assignments: dbAssignments,
      helpClusters: dbHelpClusters,
      answers: dbAnswers,
      students: dbStudents,
    };
  } catch (err) {
    console.error("[db-sync] Error querying Neon database:", err);
    return {
      connected: false,
      guild: null,
      assignments: [],
      helpClusters: [],
      answers: [],
      students: [],
    };
  }
}

export async function submitAnswerAction(params: {
  conceptId: string;
  guildId?: string;
  authorUserId: string;
  body: string;
}) {
  try {
    const answer = await createAnswer({
      conceptId: params.conceptId,
      authorUserId: params.authorUserId,
      body: params.body,
    });
    await markRequestsAnswered(params.conceptId);
    return { success: true, answerId: answer.id };
  } catch (err) {
    console.error("[submitAnswerAction] Error:", err);
    return { success: false, error: String(err) };
  }
}

import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const db = new PrismaClient();

const STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

// Simple fractional position generator for seeding
function generatePosition(index: number): string {
  return String(index).padStart(10, "0");
}

async function main() {
  console.log("🌱 Starting seed...");

  // ── Clean existing data ───────────────────────────────────────────────────
  await db.auditLog.deleteMany();
  await db.task.deleteMany();
  await db.project.deleteMany();
  await db.membership.deleteMany();
  await db.workspace.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  console.log("🗑️  Cleaned existing data");

  // ── Create users ──────────────────────────────────────────────────────────
  const users = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      db.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          image: faker.image.avatar(),
        },
      })
    )
  );

  console.log(`👥 Created ${users.length} users`);

  // ── Create workspaces ─────────────────────────────────────────────────────
  const workspaces = await Promise.all(
    Array.from({ length: 3 }).map((_, i) =>
      db.workspace.create({
        data: {
          name: faker.company.name(),
          slug: faker.helpers.slugify(faker.company.name()).toLowerCase() + `-${i}`,
          ownerId: users[i].id,
          memberships: {
            create: users.map((user, idx) => ({
              userId: user.id,
              role: idx === i ? "OWNER" : "MEMBER",
            })),
          },
        },
      })
    )
  );

  console.log(`🏢 Created ${workspaces.length} workspaces`);

  // ── Create projects ───────────────────────────────────────────────────────
  const projects = await Promise.all(
    workspaces.flatMap((workspace) =>
      Array.from({ length: 3 }).map(() =>
        db.project.create({
          data: {
            name: faker.commerce.productName(),
            description: faker.lorem.sentence(),
            workspaceId: workspace.id,
          },
        })
      )
    )
  );

  console.log(`📁 Created ${projects.length} projects`);

  // ── Create 10,000 tasks ───────────────────────────────────────────────────
  console.log("📝 Creating 10,000 tasks...");

  const BATCH_SIZE = 500;
  const TOTAL_TASKS = 10000;
  let tasksCreated = 0;

  // Track position counter per workspace+status combination
  const positionCounters: Record<string, number> = {};

  for (let batch = 0; batch < TOTAL_TASKS / BATCH_SIZE; batch++) {
    const taskData = Array.from({ length: BATCH_SIZE }).map(() => {
      const workspace = faker.helpers.arrayElement(workspaces);
      const project = faker.helpers.arrayElement(
        projects.filter((p) => p.workspaceId === workspace.id)
      );
      const assignee = faker.helpers.arrayElement([...users, null]);
      const status = faker.helpers.arrayElement(STATUSES);
      const priority = faker.helpers.arrayElement(PRIORITIES);

      // Generate unique position per workspace+status
      const posKey = `${workspace.id}:${status}`;
      positionCounters[posKey] = (positionCounters[posKey] ?? 0) + 1;
      const position = generatePosition(positionCounters[posKey]);

      return {
        title: faker.hacker.phrase(),
        description: faker.helpers.maybe(() => faker.lorem.paragraph(), {
          probability: 0.6,
        }),
        status,
        priority,
        position,
        workspaceId: workspace.id,
        projectId: project.id,
        assigneeId: assignee?.id ?? null,
        createdById: faker.helpers.arrayElement(users).id,
        dueDate: faker.helpers.maybe(() => faker.date.future(), {
          probability: 0.4,
        }),
      };
    });

    await db.task.createMany({ data: taskData });
    tasksCreated += BATCH_SIZE;
    console.log(`  ✓ ${tasksCreated}/${TOTAL_TASKS} tasks created`);
  }

  // ── Create audit logs ─────────────────────────────────────────────────────
  console.log("📋 Creating audit logs...");

  const auditData = Array.from({ length: 500 }).map(() => {
    const workspace = faker.helpers.arrayElement(workspaces);
    const user = faker.helpers.arrayElement(users);
    const action = faker.helpers.arrayElement([
      "TASK_CREATED",
      "TASK_MOVED",
      "TASK_UPDATED",
      "TASK_DELETED",
      "MEMBER_INVITED",
    ] as const);

    return {
      action,
      entityType: "task",
      entityId: faker.string.uuid(),
      workspaceId: workspace.id,
      userId: user.id,
      metadata: {
        title: faker.hacker.phrase(),
        from: faker.helpers.arrayElement(STATUSES),
        to: faker.helpers.arrayElement(STATUSES),
      },
    };
  });

  await db.auditLog.createMany({ data: auditData });
  console.log(`  ✓ 500 audit logs created`);

  console.log("\n✅ Seed complete!");
  console.log(`   Users:       ${users.length}`);
  console.log(`   Workspaces:  ${workspaces.length}`);
  console.log(`   Projects:    ${projects.length}`);
  console.log(`   Tasks:       ${TOTAL_TASKS}`);
  console.log(`   Audit logs:  500`);
  console.log("\n⚠️  Note: Your own account was deleted.");
  console.log("   Log in again with Google to create a fresh account.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
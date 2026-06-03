# ProjectFlow — Query Performance Analysis

## Setup
- Database: PostgreSQL
- ORM: Prisma v6
- Dataset: 10,000 tasks across 3 workspaces, 9 projects, 5 users
- Tool: `EXPLAIN ANALYZE`

---

## Query 1 — Kanban Board (per column)

### SQL
```sql
SELECT * FROM tasks
WHERE "workspaceId" = $1
AND status = 'BACKLOG'
ORDER BY position ASC;
```

### Query Plan

```
Bitmap Index Scan on tasks_workspaceId_status_idx
Index Cond: (workspaceId = $1 AND status = 'BACKLOG')
Sort Key: position
Sort Method: quicksort  Memory: 365kB
```

### Result
| Metric | Value |
|---|---|
| Execution time | 3.5ms |
| Rows scanned | 695 |
| Index used | `tasks_workspaceId_status_idx` |
| Scan type | ✅ Bitmap Index Scan |

### Notes
- Composite index `(workspaceId, status)` is the key — without it PostgreSQL
  falls back to a full position index scan and filters 6,700 rows
- Query always includes `status` filter so the composite index is always hit
- `position` sort is done in memory after the index fetch (quicksort, 365kB)

---

## Query 2 — My Tasks

### SQL
```sql
SELECT * FROM tasks
WHERE "workspaceId" = $1
AND "assigneeId" = $2;
```

### Query Plan

```
Bitmap Index Scan on tasks_workspaceId_assigneeId_idx
Index Cond: (workspaceId = $1 AND assigneeId = $2)
```

### Result
| Metric | Value |
|---|---|
| Execution time | 1.3ms |
| Rows scanned | 581 |
| Index used | `tasks_workspaceId_assigneeId_idx` |
| Scan type | ✅ Bitmap Index Scan |

### Notes
- Composite index `(workspaceId, assigneeId)` hits directly
- No filtering or wasted row reads
- Fastest of the three queries

---

## Query 3 — Audit Log (paginated, newest first)

### SQL
```sql
SELECT * FROM audit_logs
WHERE "workspaceId" = $1
ORDER BY "createdAt" DESC
LIMIT 50;
```

### Query Plan

```
Index Scan using audit_logs_workspaceId_createdAt_idx on audit_logs
Index Cond: (workspaceId = $1)
```

### Result
| Metric | Value |
|---|---|
| Execution time | 0.34ms |
| Rows fetched | 50 |
| Index used | `audit_logs_workspaceId_createdAt_idx` |
| Scan type | ✅ Index Scan |

### Notes
- Composite index `(workspaceId, createdAt DESC)` means PostgreSQL reads
  rows in order — no sort step needed
- LIMIT 50 means only 50 rows are read from the index — extremely efficient
- Fastest query at 0.34ms

---

## Index Strategy Summary

| Index | Columns | Queries it powers |
|---|---|---|
| `tasks_workspaceId_status_idx` | `(workspaceId, status)` | Kanban board per column |
| `tasks_workspaceId_assigneeId_idx` | `(workspaceId, assigneeId)` | My tasks filter |
| `tasks_projectId_status_idx` | `(projectId, status)` | Project board view |
| `tasks_position_idx` | `(position)` | Order within column |
| `audit_logs_workspaceId_createdAt_idx` | `(workspaceId, createdAt DESC)` | Audit log viewer |
| `memberships_workspaceId_userId_idx` | `(workspaceId, userId)` | Membership verification |

---

## Key Architecture Decisions

### Fractional Indexing
Task positions use fractional string keys instead of integers.
A drag-and-drop reorder is always **one DB write** regardless of column size.
Integer positions would require updating every task below the insertion point — O(n).

### Composite Indexes
Every hot query filters by `workspaceId` first — this is the multi-tenant
boundary. All indexes are composite with `workspaceId` as the leading column
so PostgreSQL can use them for both filtering and ordering in a single pass.

### Async Audit Logging
Audit logs are written after the HTTP response is sent — the user gets
200 OK instantly and the log write happens in the background.
This keeps the move task API at ~3ms even with audit logging enabled.
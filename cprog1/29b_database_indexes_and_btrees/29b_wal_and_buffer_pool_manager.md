# Module 29b: Write-Ahead Logging (WAL) & Database Buffer Pool Managers

In Module 29, we built an on-disk B-Tree indexer. But what happens if the power cord is yanked while the database is writing to a 4KB disk page? (●'◡'●)
Without **Write-Ahead Logging (WAL)** and a **Buffer Pool Manager**, your database files would suffer catastrophic corruption! Let's deconstruct how SQLite, Postgres, and MySQL ensure **ACID Durability**! q(≧▽≦q)

---

## 1. The Buffer Pool Manager Architecture

Databases never read or write directly to raw files on every query. Instead, an in-memory **Buffer Pool** caches disk pages:

```
[ SQL Engine ]
       | (Request Page #42)
       v
+-------------------------------------------------------+
| In-Memory Buffer Pool (Array of 4KB Page Frames)      |
|   - Page Table: Hash map [page_id -> frame_id]        |
|   - Pin Count: How many queries are reading this page |
|   - Is Dirty: Has the page been modified in RAM?      |
|   - Eviction: Clock Sweep or LRU chooses clean victim |
+-------------------------------------------------------+
       | (Flushes dirty pages)
       v
[ Disk Storage File (e.g. database.db) ]
```

---

## 2. The Golden Rule of WAL (Write-Ahead Logging)

> **"Never write a dirty database page to disk until the corresponding log record describing the change is safely flushed to disk first!"**

```
Transaction (e.g. UPDATE balance SET money = 500 WHERE id = 1):
1. Append change record to WAL buffer: [LSN=101, Prev=100, Op=SET, Old=400, New=500]
2. Flush WAL log to disk (fsync).
3. Modify Page #7 in RAM Buffer Pool (Mark as Dirty, set page.LSN = 101).
4. Return "SUCCESS" to user! (Notice we didn't touch the main database file yet!)
```

If the server crashes immediately after step 4:
- On reboot, the database reads the WAL file and **Replays (Redos)** LSN 101 back into Page #7! Zero data lost! (o゜▽゜)o

---

## Hands-On Program

Open [`29b_wal_buffer_pool.c`](file:///c:/Users/kkhoie/Downloads/cprog1/29b_database_indexes_and_btrees/29b_wal_buffer_pool.c) to inspect buffer page pinning, dirty flushing, and sequential WAL append logging! (*^▽^*)

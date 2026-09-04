# Module 29: Databases & B-Tree Indexes (Working Backwards)

When you run `SELECT * FROM users WHERE id = 5000;` on a 10-million row database, it returns in 0.1 milliseconds! Why? (●'◡'●)

---

## 1. High-Level Concept: Database Indexes

```sql
CREATE INDEX idx_user_id ON users(id);
```

---

## 2. Low-Level Reality: 4 KB Page B-Trees on Disk

Why don't databases use Binary Search Trees?
Because every pointer hop in a binary tree would trigger a slow, separate disk read!

Instead, databases use **B-Trees where each node is formatted to fit an exact 4,096-byte (4 KB) Virtual Memory Page** (Module 13)!

```
[ Root B-Tree Node (Exact 4 KB Disk Page) ]
Keys:     [ 1000 | 5000 | 9000 ]
Offsets:  /      |      |      \
         v       v      v       v
      [ Page 1] [Page 2] [Page 3] [Page 4] (Each 4 KB)
```
A 3-level 4KB B-Tree can index **10,000,000 rows in just 3 disk page reads**! Pure engineering brilliance! q(≧▽≦q)

---

## Hands-On Program

Open [`29_page_btree_indexer.c`](file:///c:/Users/kkhoie/Downloads/cprog1/29_database_indexes_and_btrees/29_page_btree_indexer.c) to see a page-based B-Tree index resolver in pure C! (*^▽^*)

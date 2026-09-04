# Module 28: Hash Maps & Dictionaries (Working Backwards)

Python `dict` and JS `Map` give you instant O(1) key lookups.
Let's see what happens underneath the hood! (●'◡'●)

---

## 1. High-Level Concept: The Key-Value Dictionary

```python
user_scores = {"alice": 100, "bob": 200}
print(user_scores["alice"]) # 100
```

---

## 2. Low-Level Reality: Hash Math & Open Addressing

A Hash Map is an underlying contiguous C array of buckets:
1. **Hash the String:** `hash = hash_djb2("alice"); // e.g. 0x5821FA`
2. **Bitwise Modulo:** `index = hash & (capacity - 1);`
3. **Linear Probing:** If slot is occupied, check adjacent slots! This takes advantage of **64-byte CPU cache lines** (Module 10) for maximum speed! (o゜▽゜)o

---

## Hands-On Program

Open [`28_open_addressing_hashmap.c`](file:///c:/Users/kkhoie/Downloads/cprog1/28_hashmaps_and_dynamic_collections/28_open_addressing_hashmap.c) to see open-addressing hash maps with dynamic `realloc` resizing in C! (*^▽^*)

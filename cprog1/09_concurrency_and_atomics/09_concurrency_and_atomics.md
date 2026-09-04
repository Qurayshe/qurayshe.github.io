# Module 09: Concurrency, Threading & Atomic Operations

Multi-threading is awesome until two threads touch the same variable at the exact same picosecond! Let's talk about race conditions! (●'◡'●)

---

## 1. Why `counter++` is a Lie!

In C, `counter++` looks like one operation. But to the CPU silicon, it's actually **3 distinct assembly instructions**:
1. `MOV eax, [counter]` (Load from RAM into CPU register)
2. `INC eax`            (Add 1)
3. `MOV [counter], eax` (Write back to RAM)

```
Thread A: [Read 10] -------> [Inc to 11] --------------> [Write 11]
Thread B:        [Read 10] -----------> [Inc to 11] --------------> [Write 11] (LOST UPDATE! (╯°□°)╯︵ ┻━┻)
```
Both threads did an increment, but the result is 11 instead of 12!

---

## 2. The Fix: C11 Atomics (`<stdatomic.h>`)

Atomic operations execute as an indivisible hardware transaction on the CPU bus:
- `atomic_int counter;`
- `atomic_fetch_add(&counter, 1);`
- `atomic_compare_exchange_strong(&target, &expected, desired);` (CAS!)

---

## 3. Building a Spinlock with Compare-And-Swap (CAS)

A **Spinlock** loops in a tight poll until the lock is released:
```c
typedef atomic_bool spinlock_t;

void spinlock_lock(spinlock_t *lock) {
    while (atomic_exchange(lock, true)) {
        // Spin-wait! (o゜▽゜)o
    }
}
```

---

## Hands-On Program

Check out [`09_atomics_and_spinlocks.c`](file:///c:/Users/kkhoie/Downloads/cprog1/09_concurrency_and_atomics/09_atomics_and_spinlocks.c) for lock-free counters, CAS demonstrations, and custom spinlocks in action! (*^▽^*)

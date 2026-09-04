# Module 25: Garbage Collection Under the Hood (Working Backwards)

In Python, Java, and JavaScript, you never have to call `free()`. Memory just magically disappears!
How does the runtime know what memory to throw away? Let's build a Garbage Collector! (●'◡'●)

---

## 1. The High-Level Illusion: Automatic Memory

```javascript
function makeUser() {
    let user = { name: "Alice", id: 42 }; // Heap object
    return user.id;
} // 'user' is out of scope... GC cleans it up! (*^▽^*)
```

---

## 2. Low-Level Reality: Mark-and-Sweep GC

A Tracing Garbage Collector runs in two distinct phases:

### Phase 1: Mark Phase (Graph DFS from Stack Roots)
1. The GC scans the active **Stack Frame** (Module 02). Any pointer variable on the stack is a **Root**.
2. It walks the pointer tree starting from the roots and sets a header bit: `obj->is_marked = 1;`.

```
[ Active Stack Roots ]
         |
         v
    [ Object A (marked=1) ] ---> [ Object B (marked=1) ]
                                          |
                                          x  [ Object C (UNREACHABLE / marked=0) ]
```

### Phase 2: Sweep Phase (Heap Cleanup)
1. The GC walks the entire allocated heap list.
2. If `is_marked == 1`: Unmark it for the next round.
3. If `is_marked == 0`: **Unreachable orphan!** Call `free(obj)`! (o゜▽゜)o

> Why "Stop-The-World" Pauses Happen: (*/ω＼*)
> If another thread modifies a pointer while the GC is marking, the GC might miss a live object and delete it! So the runtime temporarily pauses all user threads!

---

## Hands-On Program

Open [`25_mark_and_sweep_gc.c`](file:///c:/Users/kkhoie/Downloads/cprog1/25_garbage_collection_internals/25_mark_and_sweep_gc.c) to see a full Mark-and-Sweep Garbage Collector running in pure C! q(≧▽≦q)

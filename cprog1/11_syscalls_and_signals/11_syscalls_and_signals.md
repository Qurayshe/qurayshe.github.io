# Module 11: OS System Calls & Signals

Your user code is locked inside a sandbox called Ring 3. Whenever you want to print to screen or save to disk, you must politely ask the OS Kernel! (●'◡'●)

---

## 1. User Space vs Kernel Space: Privilege Rings

```
+-------------------------------------------------------------+
| Ring 3: User Space (Your C App lives here!)                 |
|   - Blocked by hardware from touching physical disks or RAM |
+-------------------------------------------------------------+
                              |
              === [ SYSCALL Hardware Trap ] ===
                              |
+-------------------------------------------------------------+
| Ring 0: Kernel Space (OS Kernel reigns supreme!)            |
|   - Full unrestricted access to physical hardware!          |
+-------------------------------------------------------------+
```

### What Happens During `printf` / `write`:
1. `RAX` gets the syscall number, arguments go into `RDI`/`RSI`/`RDX`.
2. CPU runs `syscall` opcode -> switches privilege to Ring 0.
3. Kernel validates memory buffers and writes to physical hardware.
4. Kernel runs `sysret` -> drops back to Ring 3! (o゜▽゜)o

---

## 2. File Descriptors (FDs)

Every open file/socket is given an integer index into the kernel's file table:
- `0`: `stdin`
- `1`: `stdout`
- `2`: `stderr`

---

## 3. Asynchronous Signal Handling & Reentrancy

Signals are software interrupts from the OS (like `SIGINT` on `Ctrl+C`).

> Danger Zone: (*/ω＼*)
> NEVER call `malloc()` or `printf()` inside a signal handler! If the main thread was already in `malloc()`, calling it again from the signal handler causes a deadlock / heap corruption!
> Always use `volatile sig_atomic_t` for clean flag updates!

---

## Hands-On Program

Open [`11_signals_and_syscalls.c`](file:///c:/Users/kkhoie/Downloads/cprog1/11_syscalls_and_signals/11_signals_and_syscalls.c) to see clean signal handlers and graceful shutdown loops! (*^▽^*)

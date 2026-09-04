# Module 16b: High-Performance VM Dispatch Techniques (Direct Threading vs Switch)

In Module 16, we built a bytecode virtual machine with a classic `while(1) { switch(*ip++) { ... } }` loop. But did you know this single `switch` statement is the **#1 bottleneck** in interpreter performance? (●'◡'●)
Let's discover **Direct Threaded Code (Computed Goto)** and how modern language runtimes (like Python 3.11+ and LuaJIT) squeeze 2x-3x higher speed out of their bytecode loops! q(≧▽≦q)

---

## 1. The Switch Dispatch Bottleneck

```c
while (running) {
    switch (*ip++) {
        case OP_ADD: /* do add */ break;
        case OP_SUB: /* do sub */ break;
    }
}
```

Every single opcode execution must:
1. `break` back to the top of the `while` loop.
2. Fetch the next opcode.
3. Jump through the single central jump table.
4. **Branch Misprediction Hell**: The CPU's Branch Target Buffer (BTB) has only ONE jump site trying to predict where dozens of different opcodes will go next!

---

## 2. Direct Threaded Code (Computed `goto *`)

Using the GCC/Clang C extension **Labels as Values (`&&label`)**, every opcode handler ends with an immediate jump directly to the *next* instruction's handler, bypassing any central switch loop:

```c
#define DISPATCH() goto *dispatch_table[*ip++]

void run_vm(const uint8_t* ip) {
    static const void* dispatch_table[] = {
        [OP_ADD] = &&do_add,
        [OP_SUB] = &&do_sub,
        [OP_HALT] = &&do_halt
    };

    DISPATCH(); // Jump directly to the first opcode!

do_add:
    // ... perform add ...
    DISPATCH(); // Jumps straight to the next opcode! Zero loop overhead!

do_sub:
    // ... perform sub ...
    DISPATCH();

do_halt:
    return;
}
```

---

## 3. Why Hardware Branch Predictors Love Threaded Code

```
Switch Dispatch:
  [OP_ADD] ---> [ CENTRAL SWITCH JUMP ] (BTB Thrashing!) ---> [OP_SUB]

Direct Threading:
  [OP_ADD Handler] ------------ JUMP ------------> [OP_SUB Handler]
  (Each handler has its own dedicated hardware indirect branch predictor!)
```

---

## Hands-On Program

Open [`16b_threaded_code_vm.c`](file:///c:/Users/kkhoie/Downloads/cprog1/16b_vm_dispatch_techniques/16b_threaded_code_vm.c) to benchmark 50 million iterations of Switch Dispatch vs Direct Threaded Dispatch! (*^▽^*)

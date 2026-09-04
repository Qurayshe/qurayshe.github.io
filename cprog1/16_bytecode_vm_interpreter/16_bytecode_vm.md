# Module 16: Building a Bytecode Virtual Machine (Interpreter)

Ever wonder how Python, Java, or Lua actually execute code?
They compile source code into an array of byte instructions called **Bytecode**, and run a virtual CPU loop written in C! (●'◡'●)

---

## 1. Stack Machine Architecture

In a Stack VM, operations push and pop operands:
To calculate `(5 + 10) * 2`:
```
Bytecode:
1. OP_PUSH 5   -> Stack: [ 5 ]
2. OP_PUSH 10  -> Stack: [ 5, 10 ]
3. OP_ADD      -> Pops 10 & 5, pushes 15 -> Stack: [ 15 ]
4. OP_PUSH 2   -> Stack: [ 15, 2 ]
5. OP_MUL      -> Pops 2 & 15, pushes 30 -> Stack: [ 30 ]
6. OP_PRINT    -> Prints 30! q(≧▽≦q)
7. OP_HALT     -> Stop!
```

---

## 2. The Fetch-Decode-Execute Loop

```c
while (vm->running) {
    uint8_t opcode = *vm->ip++; // 1. FETCH
    switch (opcode) {           // 2. DECODE & EXECUTE
        case OP_PUSH: vm_push(vm, *vm->ip++); break;
        case OP_ADD:  vm_push(vm, vm_pop(vm) + vm_pop(vm)); break;
        case OP_HALT: vm->running = false; break;
    }
}
```

---

## Hands-On Program

Open [`16_stack_vm.c`](file:///c:/Users/kkhoie/Downloads/cprog1/16_bytecode_vm_interpreter/16_stack_vm.c) to run a complete, fully functional Bytecode Virtual Machine in C! (*^▽^*)

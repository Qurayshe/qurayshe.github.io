# Module 01: The Compilation Pipeline & Data Types

Ever wonder what actually happens when you hit compile and run? (●'◡'●) ♥︎
⇄              ◁◁  𝚰𝚰   ▷▷               ↻
   ⁰⁰'²⁵ ━━●━━───── ⁰²'⁰⁸
In high-level languages, a runtime engine does magic in the background. But in C, your plain text file goes through a four-stage meat grinder before turning into raw CPU electricity! Let's tear it open! q(≧▽≦q)

---

## 1. The 4 Stages of Compilation (The Meat Grinder!)

When you run `gcc main.c -o main`, GCC is actually a fancy wrapper orchestrating 4 distinct programs in a trenchcoat:

```
                  +-------------------------+
                  | Source Code: main.c     |
                  +-------------------------+
                               |
                               v
                     [ 1. PREPROCESSOR ]
                     (cpp / expands #include, #define,
                      strips all comments away!)
                               |
                               v
                  +-------------------------+
                  | Preprocessed: main.i    |
                  +-------------------------+
                               |
                               v
                      [ 2. COMPILER ]
                      (cc1 / transforms C code into
                       target CPU assembly mnemonics)
                               |
                               v
                  +-------------------------+
                  | Assembly: main.s        |
                  +-------------------------+
                               |
                               v
                      [ 3. ASSEMBLER ]
                      (as / translates assembly
                       into binary machine opcodes!)
                               |
                               v
                  +-------------------------+
                  | Object File: main.o     |
                  +-------------------------+
                               |
                               v
                        [ 4. LINKER ]
                        (ld / hooks up printf, libc,
                         and stitches final executable!)
                               |
                               v
                  +-------------------------+
                  | Executable: main (.exe) |
                  +-------------------------+
```

---

### What the File Extensions Mean:

| Extension                             | What it Stands For                   | File Format | What's Inside                                                                             |
| :------------------------------------ | :----------------------------------- | :---------- | :---------------------------------------------------------------------------------------- |
| **`.c`**                      | **C Source File**              | Plain Text  | Your handwritten C code (*^▽^*)                                                        |
| **`.i`**                      | **Intermediate (or Included)** | Plain Text  | Pure C code after macro expansion and header inclusion (`#include`). Comments are gone! |
| **`.s`** / **`.asm`** | **Symbolic Assembly**          | Plain Text  | Human-readable assembly language instructions (x86-64, ARM, etc.).                        |
| **`.o`** / **`.obj`** | **Object File**                | Binary      | Relocatable machine code (binary CPU bytes) with an unresolved symbol table.              |
| **`.exe`** / (ELF)            | **Executable Binary**          | Binary      | The finished runnable binary ready for the OS loader!                                     |

---

### Code Walkthrough: What Each File Looks Like

Let's take a super simple `main.c`:

```c
// main.c
#define MULTIPLIER 3

int compute(int x) {
    return x * MULTIPLIER;
}

int main(void) {
    int result = compute(10);
    return result;
}
```

---

#### 1. Preprocessed File (`main.i`)

Generated with: `gcc -E main.c -o main.i`
Notice how `#define MULTIPLIER 3` was literally copy-pasted into `3` and comments disappeared! (o゜▽゜)o

```c
# 1 "main.c"
# 1 "<built-in>"
# 1 "<command-line>"
# 1 "main.c"

int compute(int x) {
    return x * 3;
}

int main(void) {
    int result = compute(10);
    return result;
}
```

---

#### 2. Assembly File (`main.s`)

Generated with: `gcc -S main.c -o main.s`
Look at those sweet processor mnemonics! `imull $3` is doing our multiplication!

```assembly
	.file	"main.c"
	.text
	.globl	compute
	.type	compute, @function
compute:
	pushq	%rbp
	movq	%rsp, %rbp
	movl	%edi, -4(%rbp)
	movl	-4(%rbp), %eax
	imull	$3, %eax, %eax        # Multiplies input by 3!
	popq	%rbp
	ret

	.globl	main
	.type	main, @function
main:
	pushq	%rbp
	movq	%rsp, %rbp
	subq	$16, %rsp
	movl	$10, %edi
	call	compute               # Calls compute(10)
	movl	%eax, -4(%rbp)
	movl	-4(%rbp), %eax
	leave
	ret
```

---

#### 3. Object File (`main.o` or `main.obj`)

Generated with: `gcc -c main.s -o main.o`
This is raw binary machine code! If you open it in notepad it looks like alien soup, but disassembling it with `objdump -d main.o` reveals the exact hex bytes the CPU will execute:

```
00000000 <compute>:
   0:   55                      push   %rbp
   1:   48 89 e5                mov    %rsp,%rbp
   4:   89 7d fc                mov    %edi,-0x4(%rbp)
   7:   8b 45 fc                mov    -0x4(%rbp),%eax
   a:   6b c0 03                imul   $0x3,%eax,%eax
   d:   5d                      pop    %rbp
   e:   c3                      ret
```

---

#### 4. Final Executable (`main.exe` / `main`)

Generated with: `gcc main.o -o main`
The linker (`ld`) links libc startup routines (`_start`), ties external calls together, and spits out the final executable.

---

### Commands to Try It Yourself!

```bash
# Step by step:
gcc -E main.c -o main.i      # 1. Preprocess
gcc -S main.i -o main.s      # 2. Compile to assembly
gcc -c main.s -o main.o      # 3. Assemble to object
gcc main.o -o main.exe       # 4. Link to executable

# Or cheat and save all temp files in one shot! (¬‿¬)
gcc -save-temps main.c -o main.exe
```

---

## 2. Fundamental Data Types & Fixed-Width Types

In Python or JS, numbers are just abstract friendly objects. In C, every type has an exact width in physical RAM:

| Type          | Typical Size         | Typical Range (Signed)         | Format Specifier |
| :------------ | :------------------- | :----------------------------- | :--------------- |
| `char`      | 1 byte (8 bits)      | -128 to 127                    | `%c` / `%d`  |
| `short`     | 2 bytes (16 bits)    | -32,768 to 32,767              | `%hd`          |
| `int`       | 4 bytes (32 bits)    | -2.14 billion to +2.14 billion | `%d`           |
| `long long` | 8 bytes (64 bits)    | huge! (~9 quintillion)         | `%lld`         |
| `size_t`    | 8 bytes (64-bit CPU) | Unsigned object size           | `%zu`          |

> Pro-tip: Always `#include <stdint.h>` when byte size matters! `uint8_t`, `uint32_t`, `int64_t` are your best friends! (*/ω＼*)

---

## 3. Two's Complement (How negative numbers work!)

How does silicon store `-5`?

1. Start with `+5`: `0000 0101`
2. Flip all bits:   `1111 1010`
3. Add 1:           `1111 1011` (That's -5 in binary!)

Why? Because `5 + (-5)` using standard binary addition wraps around to `0000 0000` with zero extra CPU logic! Silicon engineers are geniuses! (*^▽^*)

---

## Hands-On Program

Go check out [`01_types_and_bits.c`](file:///c:/Users/kkhoie/Downloads/cprog1/01_compilation_and_memory/01_types_and_bits.c) and run it to see exact sizes and raw memory bit dumps live on your screen! (≧∇≦)ﾉ

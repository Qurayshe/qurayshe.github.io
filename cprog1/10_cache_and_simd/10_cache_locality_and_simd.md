# Module 10: CPU Cache Locality & Hardware Performance

CPUs run at ~4 GHz, but fetching data from main RAM takes ~200 clock cycles!
To stay blazing fast, CPUs use a hierarchy of super-fast caches! (●'◡'●)

---

## 1. The 64-Byte Cache Line

CPUs never fetch 1 byte alone. They always pull in an entire **64-byte Cache Line**!
When you read `arr[0]`, the next 15 integers are pulled into L1 cache for free! Reading `arr[1]` immediately afterward is an instantaneous **Cache Hit**! ╾━╤デ╦︻ (▀̿ĺ̯▀̿ ̿)

---

## 2. Row-Major vs Column-Major (The Classic Trap)

### Cache-Friendly (Row-by-Row):

```c
// Stride-1: Sequential, hits every byte in the 64B cache line! (*^▽^*)
for (int r = 0; r < ROWS; r++)
    for (int c = 0; c < COLS; c++)
        sum += matrix[r][c];
```

### Cache-Disastrous (Column-by-Column):

```c
// Stride-N: Jumps 16 KB each step, causing a CACHE MISS every iteration! (⊙_⊙;)
for (int c = 0; c < COLS; c++)
    for (int r = 0; r < ROWS; r++)
        sum += matrix[r][c];
```

Row-major traversal is often **5x to 20x faster** on modern hardware just because of cache lines!

---

## Hands-On Program

Run the benchmark in [`10_cache_locality_benchmark.c`](file:///c:/Users/kkhoie/Downloads/cprog1/10_cache_and_simd/10_cache_locality_benchmark.c) to see the live time difference on a 64 MB matrix! (≧∇≦)ﾉ

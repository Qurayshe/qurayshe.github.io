# Module 08: Binary I/O & Custom File Formats

Text files (JSON/CSV) are easy to read, but they're bloated and slow. Binary files are raw, compact, and lightning-fast! (●'◡'●)

---

## 1. Text vs. Binary

- **Text:** Number `12345678` takes 8 ASCII character bytes.
- **Binary:** Stored as a raw 4-byte `uint32_t` (`0x00BC614E`). Half the size, zero parsing required! (*^▽^*)

---

## 2. Anatomy of a Real-World Binary File

Every real format (PNG, ZIP, ELF) has a structure:

```
+-------------------------------------------------------------+
| FILE HEADER (Fixed Size)                                    |
|   - Magic Bytes: e.g. "DBIN" (0x4442494E)                   |
|   - Version: uint32_t                                       |
|   - Record Count: uint32_t                                  |
+-------------------------------------------------------------+
| PAYLOAD DATA (Array of binary structs)                      |
+-------------------------------------------------------------+
```

> Why Magic Numbers?
> A 4-byte magic number at offset 0 prevents your program from accidentally trying to parse an MP3 file as an image! (*/ω＼*)

---

## Hands-On Program

Open [`08_binary_file_records.c`](file:///c:/Users/kkhoie/Downloads/cprog1/08_binary_io_and_serialization/08_binary_file_records.c) to see binary header creation, record validation, and random-access seeking with `fseek`! q(≧▽≦q)

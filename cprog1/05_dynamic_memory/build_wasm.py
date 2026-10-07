"""
WASM Binary Generator for Memory Simulation Engine
Constructs a valid .wasm binary that executes the allocator directly in WebAssembly linear memory.
"""

def leb128_u(val):
    res = bytearray()
    while True:
        b = val & 0x7F
        val >>= 7
        if val != 0:
            b |= 0x80
        res.append(b)
        if val == 0:
            break
    return bytes(res)

def leb128_s(val):
    res = bytearray()
    more = True
    while more:
        b = val & 0x7F
        val >>= 7
        if (val == 0 and (b & 0x40) == 0) or (val == -1 and (b & 0x40) != 0):
            more = False
        else:
            b |= 0x80
        res.append(b)
    return bytes(res)

def i32_const(val):
    return bytes([0x41]) + leb128_s(val)

def make_section(sec_id, payload):
    return bytes([sec_id]) + leb128_u(len(payload)) + payload

def build_wasm():
    # 1. Type Section (1)
    types = [
        bytes([0x60, 0x00, 0x00]),                         # 0: () -> ()
        bytes([0x60, 0x02, 0x7F, 0x7F, 0x01, 0x7F]),       # 1: (i32, i32) -> i32
        bytes([0x60, 0x01, 0x7F, 0x01, 0x7F]),             # 2: (i32) -> i32
        bytes([0x60, 0x00, 0x01, 0x7F])                    # 3: () -> i32
    ]
    type_payload = leb128_u(len(types)) + b''.join(types)
    sec_type = make_section(1, type_payload)

    # 2. Function Section (3)
    func_types = [0, 1, 2, 1, 0, 2, 3, 3]
    func_payload = leb128_u(len(func_types)) + bytes(func_types)
    sec_func = make_section(3, func_payload)

    # 3. Memory Section (5)
    mem_payload = leb128_u(1) + bytes([0x01, 0x01, 0x01])
    sec_mem = make_section(5, mem_payload)

    # 4. Export Section (7)
    exports = [
        ("memory", 0x02, 0),
        ("init_memory", 0x00, 0),
        ("heap_malloc", 0x00, 1),
        ("heap_free", 0x00, 2),
        ("arena_alloc", 0x00, 3),
        ("arena_reset", 0x00, 4),
        ("get_byte", 0x00, 5),
        ("get_arena_offset", 0x00, 6),
        ("get_heap_syscalls", 0x00, 7)
    ]
    exp_bytes = bytearray([len(exports)])
    for name, kind, idx in exports:
        exp_bytes.extend(leb128_u(len(name)))
        exp_bytes.extend(name.encode('utf-8'))
        exp_bytes.append(kind)
        exp_bytes.extend(leb128_u(idx))
    sec_exp = make_section(7, bytes(exp_bytes))

    # 5. Code Section (10)
    codes = []

    # Func 0: init_memory() -> ()
    # Locals: i32 (idx = local 0)
    f0 = bytearray()
    f0.extend([0x01, 0x01, 0x7F])
    f0.extend(i32_const(0) + bytes([0x21, 0x00])) # local.set 0 (0)
    f0.extend([0x03, 0x40]) # loop
    # memory[local 0] = 0x2E ('.')
    f0.extend(bytes([0x20, 0x00]) + i32_const(0x2E) + bytes([0x3A, 0x00, 0x00]))
    # local 0 += 1
    f0.extend(bytes([0x20, 0x00]) + i32_const(1) + bytes([0x6A, 0x21, 0x00]))
    # if local 0 < 128, br 0
    f0.extend(bytes([0x20, 0x00]) + i32_const(128) + bytes([0x48, 0x0D, 0x00]))
    f0.append(0x0B) # end loop
    # memory[128] = 0 (arena_offset)
    f0.extend(i32_const(128) + i32_const(0) + bytes([0x36, 0x02, 0x00]))
    # memory[132] = 0 (syscalls)
    f0.extend(i32_const(132) + i32_const(0) + bytes([0x36, 0x02, 0x00]))
    f0.append(0x0B) # end func
    codes.append(leb128_u(len(f0)) + f0)

    # Func 1: heap_malloc(payload_len: i32, id_char: i32) -> start: i32
    # Locals: total_needed (2), start (3), consecutive (4), i (5)
    f1 = bytearray()
    f1.extend([0x01, 0x04, 0x7F])
    # memory[132] += 1 (inc syscalls)
    f1.extend(i32_const(132) + i32_const(132) + bytes([0x28, 0x02, 0x00]) + i32_const(1) + bytes([0x6A, 0x36, 0x02, 0x00]))
    # total_needed = payload_len + 1 (local 2)
    f1.extend(bytes([0x20, 0x00]) + i32_const(1) + bytes([0x6A, 0x21, 0x02]))
    # start = -1 (local 3)
    f1.extend(i32_const(-1) + bytes([0x21, 0x03]))
    # consecutive = 0 (local 4)
    f1.extend(i32_const(0) + bytes([0x21, 0x04]))
    # i = 0 (local 5)
    f1.extend(i32_const(0) + bytes([0x21, 0x05]))

    # search loop
    f1.extend([0x02, 0x40]) # block $break_search
    f1.extend([0x03, 0x40]) # loop $search_loop
    # if i >= 64, br 1 ($break_search)
    f1.extend(bytes([0x20, 0x05]) + i32_const(64) + bytes([0x4E, 0x0D, 0x01]))
    # check if memory[i] == '.' (46) or memory[i] == 'X' (88)
    f1.extend(bytes([0x20, 0x05, 0x2D, 0x00, 0x00]) + i32_const(46) + bytes([0x46]))
    f1.extend(bytes([0x20, 0x05, 0x2D, 0x00, 0x00]) + i32_const(88) + bytes([0x46, 0x72]))
    f1.extend([0x04, 0x40]) # if free or hole
    # consecutive += 1
    f1.extend(bytes([0x20, 0x04]) + i32_const(1) + bytes([0x6A, 0x21, 0x04]))
    # if consecutive == total_needed
    f1.extend(bytes([0x20, 0x04, 0x20, 0x02, 0x46]))
    f1.extend([0x04, 0x40]) # if match
    # start = i - total_needed + 1
    f1.extend(bytes([0x20, 0x05, 0x20, 0x02, 0x6B]) + i32_const(1) + bytes([0x6A, 0x21, 0x03]))
    f1.extend([0x0C, 0x03]) # br 3 ($break_search)
    f1.append(0x0B) # end match if
    f1.extend([0x05]) # else
    f1.extend(i32_const(0) + bytes([0x21, 0x04])) # consecutive = 0
    f1.append(0x0B) # end if/else

    # i += 1
    f1.extend(bytes([0x20, 0x05]) + i32_const(1) + bytes([0x6A, 0x21, 0x05]))
    f1.extend([0x0C, 0x00]) # br 0 ($search_loop)
    f1.append(0x0B) # end loop
    f1.append(0x0B) # end block

    # if start == -1, return -1
    f1.extend(bytes([0x20, 0x03]) + i32_const(-1) + bytes([0x46]))
    f1.extend([0x04, 0x40])
    f1.extend(i32_const(-1) + bytes([0x0F]))
    f1.append(0x0B)

    # memory[start] = 'H' (72)
    f1.extend(bytes([0x20, 0x03]) + i32_const(72) + bytes([0x3A, 0x00, 0x00]))
    # i = 1
    f1.extend(i32_const(1) + bytes([0x21, 0x05]))
    f1.extend([0x03, 0x40]) # loop
    # memory[start + i] = id_char
    f1.extend(bytes([0x20, 0x03, 0x20, 0x05, 0x6A, 0x20, 0x01, 0x3A, 0x00, 0x00]))
    # i += 1
    f1.extend(bytes([0x20, 0x05]) + i32_const(1) + bytes([0x6A, 0x21, 0x05]))
    # if i < total_needed, br 0
    f1.extend(bytes([0x20, 0x05, 0x20, 0x02, 0x48, 0x0D, 0x00]))
    f1.append(0x0B) # end loop

    f1.extend(bytes([0x20, 0x03, 0x0B])) # return start
    codes.append(leb128_u(len(f1)) + f1)

    # Func 2: heap_free(id_char: i32) -> freed_count: i32
    f2 = bytearray()
    f2.extend([0x01, 0x02, 0x7F])
    f2.extend(i32_const(0) + bytes([0x21, 0x01])) # i = 0
    f2.extend(i32_const(0) + bytes([0x21, 0x02])) # freed = 0
    f2.extend([0x03, 0x40]) # loop
    # if memory[i] == id_char
    f2.extend(bytes([0x20, 0x01, 0x2D, 0x00, 0x00, 0x20, 0x00, 0x46]))
    f2.extend([0x04, 0x40]) # if
    # if i > 0 and memory[i-1] == 'H' (72), memory[i-1] = 'X' (88)
    f2.extend(bytes([0x20, 0x01]) + i32_const(0) + bytes([0x4A]))
    f2.extend([0x04, 0x40])
    f2.extend(bytes([0x20, 0x01]) + i32_const(1) + bytes([0x6B, 0x2D, 0x00, 0x00]) + i32_const(72) + bytes([0x46]))
    f2.extend([0x04, 0x40])
    f2.extend(bytes([0x20, 0x01]) + i32_const(1) + bytes([0x6B]) + i32_const(88) + bytes([0x3A, 0x00, 0x00]))
    f2.append(0x0B)
    f2.append(0x0B)
    # memory[i] = 'X' (88)
    f2.extend(bytes([0x20, 0x01]) + i32_const(88) + bytes([0x3A, 0x00, 0x00]))
    f2.extend(bytes([0x20, 0x02]) + i32_const(1) + bytes([0x6A, 0x21, 0x02])) # freed += 1
    f2.append(0x0B) # end if
    # i += 1
    f2.extend(bytes([0x20, 0x01]) + i32_const(1) + bytes([0x6A, 0x21, 0x01]))
    f2.extend(bytes([0x20, 0x01]) + i32_const(64) + bytes([0x48, 0x0D, 0x00])) # if i < 64, br 0
    f2.append(0x0B) # end loop
    f2.extend(bytes([0x20, 0x02, 0x0B])) # return freed
    codes.append(leb128_u(len(f2)) + f2)

    # Func 3: arena_alloc(payload_len: i32, id_char: i32) -> offset: i32
    f3 = bytearray()
    f3.extend([0x01, 0x02, 0x7F])
    # old_offset = memory[128]
    f3.extend(i32_const(128) + bytes([0x28, 0x02, 0x00, 0x21, 0x02]))
    # if old_offset + payload_len > 64, return -1
    f3.extend(bytes([0x20, 0x02, 0x20, 0x00, 0x6A]) + i32_const(64) + bytes([0x4A]))
    f3.extend([0x04, 0x40])
    f3.extend(i32_const(-1) + bytes([0x0F]))
    f3.append(0x0B)
    # loop i = 0 .. payload_len - 1: memory[64 + old_offset + i] = id_char
    f3.extend(i32_const(0) + bytes([0x21, 0x03]))
    f3.extend([0x03, 0x40])
    f3.extend(i32_const(64) + bytes([0x20, 0x02, 0x6A, 0x20, 0x03, 0x6A, 0x20, 0x01, 0x3A, 0x00, 0x00]))
    f3.extend(bytes([0x20, 0x03]) + i32_const(1) + bytes([0x6A, 0x21, 0x03]))
    f3.extend(bytes([0x20, 0x03, 0x20, 0x00, 0x48, 0x0D, 0x00]))
    f3.append(0x0B)
    # memory[128] = old_offset + payload_len
    f3.extend(i32_const(128) + bytes([0x20, 0x02, 0x20, 0x00, 0x6A, 0x36, 0x02, 0x00]))
    f3.extend(bytes([0x20, 0x02, 0x0B])) # return old_offset
    codes.append(leb128_u(len(f3)) + f3)

    # Func 4: arena_reset() -> ()
    f4 = bytearray()
    f4.extend([0x01, 0x01, 0x7F])
    f4.extend(i32_const(0) + bytes([0x21, 0x00]))
    f4.extend([0x03, 0x40])
    f4.extend(i32_const(64) + bytes([0x20, 0x00, 0x6A]) + i32_const(0x2E) + bytes([0x3A, 0x00, 0x00]))
    f4.extend(bytes([0x20, 0x00]) + i32_const(1) + bytes([0x6A, 0x21, 0x00]))
    f4.extend(bytes([0x20, 0x00]) + i32_const(64) + bytes([0x48, 0x0D, 0x00]))
    f4.append(0x0B)
    # memory[128] = 0
    f4.extend(i32_const(128) + i32_const(0) + bytes([0x36, 0x02, 0x00]))
    f4.append(0x0B)
    codes.append(leb128_u(len(f4)) + f4)

    # Func 5: get_byte(addr: i32) -> i32
    f5 = bytearray([0x00])
    f5.extend(bytes([0x20, 0x00, 0x2D, 0x00, 0x00, 0x0B]))
    codes.append(leb128_u(len(f5)) + f5)

    # Func 6: get_arena_offset() -> i32
    f6 = bytearray([0x00])
    f6.extend(i32_const(128) + bytes([0x28, 0x02, 0x00, 0x0B]))
    codes.append(leb128_u(len(f6)) + f6)

    # Func 7: get_heap_syscalls() -> i32
    f7 = bytearray([0x00])
    f7.extend(i32_const(132) + bytes([0x28, 0x02, 0x00, 0x0B]))
    codes.append(leb128_u(len(f7)) + f7)

    code_payload = leb128_u(len(codes)) + b''.join(codes)
    sec_code = make_section(10, code_payload)

    # Header
    wasm = bytearray([0x00, 0x61, 0x73, 0x6D, 0x01, 0x00, 0x00, 0x00])
    wasm.extend(sec_type)
    wasm.extend(sec_func)
    wasm.extend(sec_mem)
    wasm.extend(sec_exp)
    wasm.extend(sec_code)

    return bytes(wasm)

if __name__ == '__main__':
    binary = build_wasm()
    out_path = 'cprog1/05_dynamic_memory/memory_sim.wasm'
    with open(out_path, 'wb') as f:
        f.write(binary)
    print(f"Generated {out_path} ({len(binary)} bytes)")


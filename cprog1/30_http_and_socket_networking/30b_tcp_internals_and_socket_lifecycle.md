# Module 30b: TCP Internals, Socket Lifecycles & Packet Framing

In Module 30, we parsed raw HTTP text. But TCP is a raw **Byte Stream with Zero Message Boundaries**! (●'◡'●)
If a client sends two separate messages:
1. `{"cmd": "LOGIN"}` (16 bytes)
2. `{"cmd": "LOGOUT"}` (17 bytes)

The server might receive them merged as one 33-byte chunk, or split into 10-byte fragments! (x_x)
Let's master **TCP Socket States, `TIME_WAIT`, `SO_REUSEADDR`, and Length-Prefixed Message Framing**! q(≧▽≦q)

---

## 1. The TCP 3-Way Handshake & 4-Way Teardown

```
Client                                                  Server
  |                                                        |
  | ------------ SYN (seq = 100) ------------------------> | (Server in LISTEN)
  | <----------- SYN-ACK (seq = 300, ack = 101) ---------- |
  | ------------ ACK (ack = 301) ------------------------> |
  |                  [ ESTABLISHED ]                       |
  |                                                        |
  | ------------ FIN (seq = 150) ------------------------> | (Client begins close)
  | <----------- ACK (ack = 151) ------------------------- | (Server: CLOSE_WAIT)
  | <----------- FIN (seq = 350) ------------------------- |
  | ------------ ACK (ack = 351) ------------------------> |
  | [ TIME_WAIT (2MSL: 60s) ]                              | (Server: CLOSED)
```

---

## 2. Why `SO_REUSEADDR` is Mandatory for Servers

When your server crashes or restarts, old sockets remain in the OS kernel's `TIME_WAIT` state for up to 60-120 seconds to catch delayed in-flight packets.
If you call `bind()` without `SO_REUSEADDR`, the OS will reject it with:
> **`bind(): Address already in use`** (x_x)

```c
int opt = 1;
setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
```

---

## 3. The 2 Classical Wire Framing Protocols

Because TCP does not preserve packet boundaries:

1. **Delimiter-based Framing** (e.g. HTTP `\r\n\r\n`, Redis `\r\n`):
   - Stream is scanned character-by-character for boundary markers.
2. **Length-Prefix Framing** (e.g. Protobuf, gRPC, WebSocket):
   - Every packet starts with a fixed-size header: `[ 4-Byte Payload Length (Big Endian) ] + [ Raw Payload Data ]`.

---

## Hands-On Program

Open [`30b_tcp_framing_protocol.c`](file:///c:/Users/kkhoie/Downloads/cprog1/30_http_and_socket_networking/30b_tcp_framing_protocol.c) to inspect a length-prefixed packet encoder and incremental stream chunk parser! (*^▽^*)

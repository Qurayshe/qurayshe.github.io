#define _GNU_SOURCE
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>

#if defined(_WIN32)
#include <winsock2.h>
#else
#include <arpa/inet.h>
#endif

/*
 * Module 30b: Length-Prefixed Wire Framing Protocol
 *
 * Demonstrates:
 * 1. Packing messages with 4-byte network-byte-order (Big Endian) length prefix
 * 2. Simulating fragmented TCP chunk delivery over streams
 * 3. Incremental buffer parsing and message frame assembly
 */

#pragma pack(push, 1)
typedef struct {
    uint32_t payload_len; // Network byte order (htonl)
} frame_header_t;
#pragma pack(pop)

// Encode a message into wire format
size_t encode_message(const char* text, uint8_t* out_buf, size_t max_len) {
    uint32_t text_len = strlen(text);
    if (sizeof(frame_header_t) + text_len > max_len) return 0;

    frame_header_t hdr;
    hdr.payload_len = htonl(text_len);

    memcpy(out_buf, &hdr, sizeof(frame_header_t));
    memcpy(out_buf + sizeof(frame_header_t), text, text_len);
    return sizeof(frame_header_t) + text_len;
}

// Simulates parsing an incoming streaming buffer with fragmented data
void parse_stream_chunks(const uint8_t* stream_data, size_t total_bytes) {
    printf("--- Simulating Incremental TCP Stream Parser ---\n");
    size_t offset = 0;
    int packet_num = 1;

    while (offset + sizeof(frame_header_t) <= total_bytes) {
        frame_header_t hdr;
        memcpy(&hdr, stream_data + offset, sizeof(frame_header_t));
        uint32_t payload_len = ntohl(hdr.payload_len);

        // Check if full payload has arrived
        if (offset + sizeof(frame_header_t) + payload_len > total_bytes) {
            printf("   [Incomplete Frame] Need %u bytes, stream only has %zu remaining.\n", 
                   payload_len, total_bytes - (offset + sizeof(frame_header_t)));
            break;
        }

        // Extract frame
        char msg_buf[256];
        memcpy(msg_buf, stream_data + offset + sizeof(frame_header_t), payload_len);
        msg_buf[payload_len] = '\0';

        printf("   [Packet %d Decoded] Length: %u bytes, Payload: \"%s\"\n", 
               packet_num++, payload_len, msg_buf);

        offset += sizeof(frame_header_t) + payload_len;
    }
}

int main(void) {
    printf("=== Module 30b: TCP Message Framing Protocol ===\n\n");

    uint8_t wire_buffer[512];
    size_t total_len = 0;

    // Pack 3 discrete messages into one continuous byte stream
    total_len += encode_message("AUTH_REQ token=secret123", wire_buffer + total_len, sizeof(wire_buffer) - total_len);
    total_len += encode_message("FETCH_USER id=42", wire_buffer + total_len, sizeof(wire_buffer) - total_len);
    total_len += encode_message("LOGOUT", wire_buffer + total_len, sizeof(wire_buffer) - total_len);

    printf("Encoded 3 messages into %zu raw bytes.\n\n", total_len);

    parse_stream_chunks(wire_buffer, total_len);

    printf("\n[SUCCESS] Module 30b executed cleanly! (*^▽^*)\n");
    return 0;
}

/**
 * Module 30: Zero-Copy Raw HTTP/1.1 Request Parser in C
 *
 * Concepts demonstrated:
 * 1. TCP socket stream framing and parsing delimiter tokens (\r\n).
 * 2. Zero-Copy String Views: Slicing HTTP method, path, and headers without malloc.
 * 3. Fast state machine parsing for production web servers (similar to Nginx / Node llhttp).
 */

#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_HEADERS 16

/* Non-owning string slice (Pointer + Length) */
typedef struct {
    const char *data;
    size_t len;
} StringSlice;

typedef struct {
    StringSlice name;
    StringSlice value;
} HttpHeader;

typedef struct {
    StringSlice method;
    StringSlice path;
    StringSlice version;
    HttpHeader headers[MAX_HEADERS];
    size_t header_count;
    StringSlice body;
} ParsedHttpRequest;

void print_slice(const char *label, StringSlice slice) {
    printf("%-16s: %.*s\n", label, (int)slice.len, slice.data);
}

/* Zero-copy in-place HTTP parser */
bool parse_http_request(const char *raw_stream, size_t stream_len, ParsedHttpRequest *req) {
    const char *ptr = raw_stream;
    const char *end = raw_stream + stream_len;
    req->header_count = 0;

    // 1. Parse HTTP Method (e.g. GET, POST)
    const char *method_start = ptr;
    while (ptr < end && *ptr != ' ') ptr++;
    if (ptr >= end) return false;
    req->method = (StringSlice){ .data = method_start, .len = (size_t)(ptr - method_start) };
    ptr++; // Skip space

    // 2. Parse URI Path (e.g. /api/users)
    const char *path_start = ptr;
    while (ptr < end && *ptr != ' ') ptr++;
    if (ptr >= end) return false;
    req->path = (StringSlice){ .data = path_start, .len = (size_t)(ptr - path_start) };
    ptr++; // Skip space

    // 3. Parse HTTP Version (e.g. HTTP/1.1)
    const char *ver_start = ptr;
    while (ptr < end && *ptr != '\r') ptr++;
    if (ptr >= end || *(ptr + 1) != '\n') return false;
    req->version = (StringSlice){ .data = ver_start, .len = (size_t)(ptr - ver_start) };
    ptr += 2; // Skip \r\n

    // 4. Parse Header Lines
    while (ptr < end && !(ptr[0] == '\r' && ptr[1] == '\n')) {
        const char *name_start = ptr;
        while (ptr < end && *ptr != ':') ptr++;
        if (ptr >= end) return false;
        StringSlice header_name = { .data = name_start, .len = (size_t)(ptr - name_start) };
        ptr++; // Skip ':'

        while (ptr < end && *ptr == ' ') ptr++; // Skip leading spaces
        const char *val_start = ptr;
        while (ptr < end && *ptr != '\r') ptr++;
        if (ptr >= end || *(ptr + 1) != '\n') return false;
        StringSlice header_val = { .data = val_start, .len = (size_t)(ptr - val_start) };
        ptr += 2; // Skip \r\n

        if (req->header_count < MAX_HEADERS) {
            req->headers[req->header_count++] = (HttpHeader){ .name = header_name, .value = header_val };
        }
    }

    ptr += 2; // Skip empty \r\n separator

    // 5. Remainder is the request Body payload
    req->body = (StringSlice){ .data = ptr, .len = (size_t)(end - ptr) };
    return true;
}

int main(void) {
    printf("====================================================\n");
    printf(" ZERO-COPY HTTP REQUEST PARSER                      \n");
    printf("====================================================\n");

    const char raw_http_payload[] =
        "POST /api/v1/checkout HTTP/1.1\r\n"
        "Host: api.store.com\r\n"
        "User-Agent: Mozilla/5.0\r\n"
        "Content-Type: application/json\r\n"
        "Content-Length: 26\r\n"
        "\r\n"
        "{\"item_id\": 42, \"qty\": 1}";

    printf("Incoming raw TCP socket buffer (%zu bytes):\n%s\n\n",
           sizeof(raw_http_payload) - 1, raw_http_payload);

    ParsedHttpRequest req;
    if (parse_http_request(raw_http_payload, sizeof(raw_http_payload) - 1, &req)) {
        printf("--- Parsed Request Object (Zero Memory Allocated) ---\n");
        print_slice("Method", req.method);
        print_slice("Path", req.path);
        print_slice("HTTP Version", req.version);
        printf("\nHeaders (%zu found):\n", req.header_count);
        for (size_t i = 0; i < req.header_count; i++) {
            printf("  [Header] %-15.*s = %.*s\n",
                   (int)req.headers[i].name.len, req.headers[i].name.data,
                   (int)req.headers[i].value.len, req.headers[i].value.data);
        }
        printf("\nBody Payload:\n  %.*s\n", (int)req.body.len, req.body.data);
    } else {
        printf("HTTP Parsing Error!\n");
    }

    return 0;
}

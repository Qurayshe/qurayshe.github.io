/**
 * Module 08: Binary File Format Serialization & Deserialization
 *
 * Concepts demonstrated:
 * 1. Designing a custom binary file container with Magic Number and Versioning.
 * 2. Serializing structured records using fwrite in "wb" mode.
 * 3. Validating headers and reading records using fread in "rb" mode.
 * 4. Fast random-access record lookup using fseek.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#define FILE_MAGIC 0x4442494E // ASCII for "DBIN" (Database Binary)
#define FORMAT_VERSION 1
#define DB_FILENAME "records.bin"

#pragma pack(push, 1)
/* File Header (12 Bytes) */
typedef struct {
    uint32_t magic;        // Must equal FILE_MAGIC
    uint32_t version;      // Schema version
    uint32_t record_count; // Total records in file
} FileHeader;

/* Data Record (40 Bytes) */
typedef struct {
    uint32_t id;
    char name[32];
    float balance;
} AccountRecord;
#pragma pack(pop)

void write_sample_database(const char *filename) {
    FILE *fp = fopen(filename, "wb");
    if (!fp) {
        perror("Failed to open file for writing");
        return;
    }

    AccountRecord records[] = {
        {101, "Alice Smith", 4500.50f},
        {102, "Bob Jones",   1250.00f},
        {103, "Charlie Day", 9820.75f}
    };
    uint32_t count = sizeof(records) / sizeof(records[0]);

    // 1. Write Header
    FileHeader header = {
        .magic = FILE_MAGIC,
        .version = FORMAT_VERSION,
        .record_count = count
    };
    fwrite(&header, sizeof(FileHeader), 1, fp);

    // 2. Write Records payload
    fwrite(records, sizeof(AccountRecord), count, fp);

    fclose(fp);
    printf("Successfully wrote %u records to '%s'\n\n", count, filename);
}

void read_and_validate_database(const char *filename) {
    FILE *fp = fopen(filename, "rb");
    if (!fp) {
        perror("Failed to open file for reading");
        return;
    }

    // 1. Read and Validate Header
    FileHeader header;
    if (fread(&header, sizeof(FileHeader), 1, fp) != 1) {
        fprintf(stderr, "Error reading file header\n");
        fclose(fp);
        return;
    }

    if (header.magic != FILE_MAGIC) {
        fprintf(stderr, "Error: Invalid file magic number! (Expected 0x%X, got 0x%X)\n",
                FILE_MAGIC, header.magic);
        fclose(fp);
        return;
    }

    printf("Header validated! Version: %u, Total Records: %u\n",
           header.version, header.record_count);

    // 2. Read all records sequentially
    AccountRecord rec;
    for (uint32_t i = 0; i < header.record_count; i++) {
        if (fread(&rec, sizeof(AccountRecord), 1, fp) == 1) {
            printf("  [Record %u] ID: %u | Name: %-15s | Balance: $%.2f\n",
                   i, rec.id, rec.name, rec.balance);
        }
    }

    // 3. Random Access: Jump directly to record index 1 using fseek
    long record_offset = (long)(sizeof(FileHeader) + 1 * sizeof(AccountRecord));
    fseek(fp, record_offset, SEEK_SET);

    AccountRecord direct_rec;
    fread(&direct_rec, sizeof(AccountRecord), 1, fp);
    printf("\nRandom Access (Seek to Index 1): ID %u, Name: %s\n",
           direct_rec.id, direct_rec.name);

    fclose(fp);
}

int main(void) {
    printf("====================================================\n");
    printf(" 1. BINARY FILE WRITING & HEADER CREATION           \n");
    printf("====================================================\n");
    write_sample_database(DB_FILENAME);

    printf("====================================================\n");
    printf(" 2. BINARY FILE READING, VALIDATION & SEEK          \n");
    printf("====================================================\n");
    read_and_validate_database(DB_FILENAME);

    // Cleanup generated file
    remove(DB_FILENAME);

    return 0;
}

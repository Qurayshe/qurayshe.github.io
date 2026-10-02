/**
 * 17c_paradigms_comparison.cpp
 * 
 * Deep-dive architectural comparison of 3 major C++ programming styles:
 *  1. CPL / "C-Style C++" (1980s-1990s Cfront / Procedural C with Classes)
 *  2. Google-Style C++ (Abseil conventions, -fno-exceptions, unique_ptr, StatusOr)
 *  3. Modern ISO C++ & Core Guidelines of '26 (C++20/C++23/C++26, Rule of Zero, std::expected, std::span)
 *
 * Compile:
 *   g++ -std=c++20 -O2 17c_paradigms_comparison.cpp -o 17c_paradigms
 */

#include <iostream>
#include <iomanip>
#include <cstdlib>
#include <cstring>
#include <cstdint>
#include <memory>
#include <string>
#include <string_view>
#include <span>
#include <vector>
#include <optional>

// ============================================================================
// PARADIGM 1: CPL / "C-STYLE C++" (1980s-1990s Cfront Lineage)
// Characteristics:
//  - Manual malloc/free or raw new/delete
//  - Classes used as glorified structs with manual Init() and Destroy()
//  - Sentinel return codes (-1, NULL, 0)
//  - Pointer out-parameters
//  - C-style casts
//  - Type-unsafe printf/scanf
// ============================================================================
namespace c_style {

#define C_STYLE_MAX_DIM 4096

struct PixelRGB {
    uint8_t r, g, b;
};

class CStyleImage {
public:
    PixelRGB* pixels;
    int width;
    int height;
    int is_allocated;

    // Manual initialization (like C init functions)
    int Init(int w, int h) {
        if (w <= 0 || h <= 0 || w > C_STYLE_MAX_DIM || h > C_STYLE_MAX_DIM) {
            return -1; // Sentinel error code
        }
        width = w;
        height = h;
        // Raw malloc with manual C-style cast
        pixels = (PixelRGB*)malloc(width * height * sizeof(PixelRGB));
        if (!pixels) {
            is_allocated = 0;
            return -2; // Out of memory
        }
        memset(pixels, 0, width * height * sizeof(PixelRGB));
        is_allocated = 1;
        return 0; // Success
    }

    // Manual destruction (must not forget to call!)
    void Destroy() {
        if (is_allocated && pixels != NULL) {
            free(pixels);
            pixels = NULL;
            is_allocated = 0;
            width = 0;
            height = 0;
        }
    }

    // Out-parameter style: returns error code, writes to *out_pixel
    int GetPixel(int x, int y, PixelRGB* out_pixel) {
        if (!is_allocated || !out_pixel || x < 0 || x >= width || y < 0 || y >= height) {
            return -1;
        }
        *out_pixel = pixels[y * width + x];
        return 0;
    }

    int SetPixel(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
        if (!is_allocated || x < 0 || x >= width || y < 0 || y >= height) {
            return -1;
        }
        int idx = y * width + x;
        pixels[idx].r = r;
        pixels[idx].g = g;
        pixels[idx].b = b;
        return 0;
    }
};

} // namespace c_style


// ============================================================================
// PARADIGM 2: GOOGLE-STYLE C++ (Abseil / Chromium System Guidelines)
// Characteristics:
//  - Exceptions strictly disabled (-fno-exceptions)
//  - Explicit ownership via std::unique_ptr (shared_ptr avoided)
//  - Error handling via Status / StatusOr emulation
//  - DISALLOW_COPY_AND_ASSIGN (= delete copy ops)
//  - Naming: trailing underscore for members (width_), kConstantName
//  - Output parameters passed via non-const pointer or return StatusOr
// ============================================================================
namespace google_style {

// Lightweight emulation of absl::Status and absl::StatusOr<T>
enum class StatusCode { kOk = 0, kInvalidArgument = 1, kOutOfMemory = 2, kOutOfRange = 3 };

class Status {
 public:
  Status() : code_(StatusCode::kOk), message_("") {}
  Status(StatusCode code, std::string_view message) : code_(code), message_(message) {}

  static Status Ok() { return Status(); }
  bool ok() const { return code_ == StatusCode::kOk; }
  StatusCode code() const { return code_; }
  std::string_view message() const { return message_; }

 private:
  StatusCode code_;
  std::string message_;
};

template <typename T>
class StatusOr {
 public:
  StatusOr(const Status& status) : status_(status), value_(std::nullopt) {}
  StatusOr(T value) : status_(Status::Ok()), value_(std::move(value)) {}

  bool ok() const { return status_.ok(); }
  const Status& status() const { return status_; }
  const T& value() const { return value_.value(); }
  T& value() { return value_.value(); }

 private:
  Status status_;
  std::optional<T> value_;
};

struct PixelRgba {
  uint8_t r = 0;
  uint8_t g = 0;
  uint8_t b = 0;
  uint8_t a = 255;
};

class GoogleImage {
 public:
  static constexpr size_t kMaxDimension = 4096;

  // Disallow copy construction and copy assignment (single exclusive ownership)
  GoogleImage(const GoogleImage&) = delete;
  GoogleImage& operator=(const GoogleImage&) = delete;

  // Movable
  GoogleImage(GoogleImage&&) noexcept = default;
  GoogleImage& operator=(GoogleImage&&) noexcept = default;

  // Static factory returning StatusOr (prevents half-initialized objects)
  static StatusOr<std::unique_ptr<GoogleImage>> Create(size_t width, size_t height) {
    if (width == 0 || height == 0 || width > kMaxDimension || height > kMaxDimension) {
      return Status(StatusCode::kInvalidArgument, "Invalid image dimensions");
    }
    return std::unique_ptr<GoogleImage>(new GoogleImage(width, height));
  }

  // Mutator returns Status
  Status SetPixel(size_t x, size_t y, PixelRgba pixel) {
    if (x >= width_ || y >= height_) {
      return Status(StatusCode::kOutOfRange, "Pixel coordinate out of range");
    }
    pixels_[y * width_ + x] = pixel;
    return Status::Ok();
  }

  // Accessor returns StatusOr<PixelRgba>
  StatusOr<PixelRgba> GetPixel(size_t x, size_t y) const {
    if (x >= width_ || y >= height_) {
      return Status(StatusCode::kOutOfRange, "Pixel coordinate out of range");
    }
    return pixels_[y * width_ + x];
  }

  size_t width() const { return width_; }
  size_t height() const { return height_; }
  const PixelRgba* data() const { return pixels_.get(); }

 private:
  // Private constructor to enforce static factory Create()
  GoogleImage(size_t width, size_t height)
      : width_(width),
        height_(height),
        pixels_(std::make_unique<PixelRgba[]>(width * height)) {}

  size_t width_;
  size_t height_;
  std::unique_ptr<PixelRgba[]> pixels_; // Explicit ownership, automatic zero-leak cleanup
};

} // namespace google_style


// ============================================================================
// PARADIGM 3: MODERN ISO C++ & CORE GUIDELINES '26
// Characteristics:
//  - Rule of Zero: No manual destructors, copy, or move operations
//  - Non-owning views: std::span<const T> and std::string_view
//  - Monadic error handling with std::expected (or standard optional)
//  - Lifetime safety: bounds checked or contracts [[contract: pre(...)]]
//  - Value semantics, zero heap overhead where possible
// ============================================================================
namespace iso_cpp26 {

struct PixelRgba {
    uint8_t r = 0, g = 0, b = 0, a = 255;
};

enum class ImageError { InvalidDimensions, OutOfBounds };

class IsoImage {
    size_t width_{0};
    size_t height_{0};
    std::vector<PixelRgba> pixels_{}; // Rule of Zero: vector handles memory, copy, move!

public:
    // Rule of Zero: Default copy/move/destructor are 100% compiler generated & leak-proof
    IsoImage() = default;

    explicit IsoImage(size_t w, size_t h)
        : width_(w), height_(h), pixels_(w * h) {}

    // Simulated C++26 Contract pre-condition validation
    [[nodiscard]] auto set_pixel(size_t x, size_t y, PixelRgba p) noexcept
        -> std::optional<ImageError> 
    {
        if (x >= width_ || y >= height_) {
            return ImageError::OutOfBounds;
        }
        pixels_[y * width_ + x] = p;
        return std::nullopt; // No error
    }

    // Zero-copy non-owning span view of row pixels
    [[nodiscard]] auto get_row(size_t y) const noexcept -> std::span<const PixelRgba> {
        if (y >= height_) return {};
        return std::span<const PixelRgba>(pixels_.data() + y * width_, width_);
    }

    [[nodiscard]] size_t width() const noexcept { return width_; }
    [[nodiscard]] size_t height() const noexcept { return height_; }
    [[nodiscard]] std::span<const PixelRgba> as_span() const noexcept { return pixels_; }
};

} // namespace iso_cpp26


// ============================================================================
// DEMONSTRATION & COMPARISON RUNNER
// ============================================================================
int main() {
    std::cout << "============================================================\n";
    std::cout << "C++ ARCHITECTURAL PARADIGM COMPARISON: C-STYLE vs GOOGLE vs ISO'26\n";
    std::cout << "============================================================\n\n";

    // 1. C-Style C++ Demo
    std::cout << "[1] C-Style C++ (CPL / Cfront 1980s Heritage):\n";
    {
        c_style::CStyleImage img;
        int err = img.Init(64, 64);
        if (err == 0) {
            img.SetPixel(10, 10, 255, 128, 0);
            c_style::PixelRGB px;
            if (img.GetPixel(10, 10, &px) == 0) {
                std::cout << "  Pixel (10,10): RGB(" << (int)px.r << ", " << (int)px.g << ", " << (int)px.b << ")\n";
            }
            img.Destroy(); // Crucial! Forgetting this causes a silent memory leak.
            std::cout << "  Status: Manual Init/Destroy lifecycle executed cleanly.\n";
        }
    }

    // 2. Google-Style C++ Demo
    std::cout << "\n[2] Google-Style C++ (Abseil / -fno-exceptions / StatusOr):\n";
    {
        auto image_or = google_style::GoogleImage::Create(64, 64);
        if (!image_or.ok()) {
            std::cout << "  Failed to create: " << image_or.status().message() << "\n";
        } else {
            auto image = std::move(image_or.value());
            auto status = image->SetPixel(10, 10, {255, 128, 0, 255});
            if (status.ok()) {
                auto px_or = image->GetPixel(10, 10);
                if (px_or.ok()) {
                    auto px = px_or.value();
                    std::cout << "  Pixel (10,10): RGBA(" << (int)px.r << ", " << (int)px.g << ", "
                              << (int)px.b << ", " << (int)px.a << ")\n";
                }
            }
            std::cout << "  Status: Exclusive std::unique_ptr ownership; zero manual cleanup needed.\n";
        }
    }

    // 3. Modern ISO C++ & Core Guidelines '26 Demo
    std::cout << "\n[3] Modern ISO C++26 & Core Guidelines (Rule of Zero / std::span):\n";
    {
        iso_cpp26::IsoImage img(64, 64);
        auto err = img.set_pixel(10, 10, {255, 128, 0, 255});
        if (!err) {
            auto row = img.get_row(10);
            auto px = row[10];
            std::cout << "  Pixel (10,10) via std::span: RGBA(" << (int)px.r << ", " << (int)px.g << ", "
                      << (int)px.b << ", " << (int)px.a << ")\n";
            std::cout << "  Total buffer span size: " << img.as_span().size() << " elements.\n";
            std::cout << "  Status: Rule of Zero compliance. Safe, expressive, zero-overhead.\n";
        }
    }

    std::cout << "\n============================================================\n";
    std::cout << "Comparison complete. All 3 paradigms demonstrated successfully!\n";
    return 0;
}

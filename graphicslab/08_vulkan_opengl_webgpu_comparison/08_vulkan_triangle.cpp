/**
 * 08_vulkan_triangle.cpp
 * 
 * Complete Annotated Structural Architecture of Vulkan 1.3
 * 
 * Contrasting with OpenGL's implicit global state, Vulkan requires explicit control:
 *  1. VkInstance & Validation Layers
 *  2. VkPhysicalDevice & Queue Families (Graphics/Compute/Transfer)
 *  3. VkDevice & VkQueue
 *  4. VkSwapchainKHR & VkImageViews
 *  5. VkRenderPass (Color attachments, Subpasses, Dependencies)
 *  6. VkPipelineLayout & VkPipeline (Immutable Pipeline State Object - PSO)
 *  7. VkCommandPool & VkCommandBuffer
 *  8. Explicit VRAM Memory Allocation & Staging Buffers
 *  9. Frame Synchronization: VkSemaphore (GPU-GPU) & VkFence (CPU-GPU)
 *
 * Requirements:
 *  - Vulkan SDK (<vulkan/vulkan.h>)
 */

#include <iostream>
#include <vector>
#include <string>

// Pseudo-declarations of canonical Vulkan structures for architecture demonstration
namespace vk_arch {

struct QueueFamilyIndices {
    int graphics_family = -1;
    int present_family = -1;
    bool is_complete() const { return graphics_family >= 0 && present_family >= 0; }
};

class VulkanTriangleApplication {
public:
    void run() {
        init_vulkan();
        render_frame();
        cleanup();
    }

private:
    void init_vulkan() {
        std::cout << "[Vulkan 1.3 Pipeline Lifecycle]\n";

        // Step 1: Create Vulkan Instance with Validation Layers
        std::cout << "  1. vkCreateInstance: Loading Vulkan driver & VK_LAYER_KHRONOS_validation\n";

        // Step 2: Enumerate and pick Physical Device (GPU)
        std::cout << "  2. vkEnumeratePhysicalDevices: Querying GPU features & Queue Families (Graphics/Present)\n";

        // Step 3: Create Logical Device and retrieve hardware Queues
        std::cout << "  3. vkCreateDevice: Instantiating VkDevice and retrieving VkQueue handles\n";

        // Step 4: Create Swapchain (Double/Triple buffering for screen presentation)
        std::cout << "  4. vkCreateSwapchainKHR: Initializing triple-buffering surface (VK_PRESENT_MODE_MAILBOX_KHR)\n";
        std::cout << "     vkCreateImageView: Creating 2D image views over swapchain images\n";

        // Step 5: Create Render Pass (Specifies attachments, load/store ops, subpass transitions)
        std::cout << "  5. vkCreateRenderPass: Configuring VK_ATTACHMENT_LOAD_OP_CLEAR and layout transitions\n";

        // Step 6: Create Graphics Pipeline (Immutable Pipeline State Object - PSO)
        std::cout << "  6. vkCreateGraphicsPipeline:\n";
        std::cout << "     - Loading SPIR-V binary shader modules (vert.spv, frag.spv)\n";
        std::cout << "     - Vertex Input State: Binding 0, Strides, Attribute locations\n";
        std::cout << "     - Input Assembly: VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST\n";
        std::cout << "     - Rasterizer State: Cull mode BACK, Front face CCW, Polygon mode FILL\n";
        std::cout << "     - Multisampling: 1 sample (no MSAA)\n";
        std::cout << "     - Color Blending: Blend disabled or standard alpha blending\n";
        std::cout << "     - vkCreatePipelineLayout: Push constants & Descriptor Set layouts\n";

        // Step 7: Create Framebuffers (One per swapchain image view)
        std::cout << "  7. vkCreateFramebuffer: Binding swapchain image views to render pass\n";

        // Step 8: Allocate Device Memory and Upload Vertex Buffer via Staging Buffer
        std::cout << "  8. Host-to-Device Memory Transfer:\n";
        std::cout << "     - vkCreateBuffer (Staging): Host-visible coherent RAM\n";
        std::cout << "     - vkMapMemory / memcpy / vkUnmapMemory\n";
        std::cout << "     - vkCreateBuffer (Device): VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT in fast VRAM\n";
        std::cout << "     - vkCmdCopyBuffer: High-speed DMA transfer over PCIe bus\n";

        // Step 9: Create Command Pool and Command Buffers
        std::cout << "  9. vkCreateCommandPool & vkAllocateCommandBuffers (VK_COMMAND_BUFFER_LEVEL_PRIMARY)\n";

        // Step 10: Create Synchronization Primitives
        std::cout << " 10. Synchronization Setup:\n";
        std::cout << "     - vkCreateSemaphore: image_available_semaphore (signals when swapchain has image)\n";
        std::cout << "     - vkCreateSemaphore: render_finished_semaphore (signals when GPU rendering is done)\n";
        std::cout << "     - vkCreateFence: in_flight_fence (blocks CPU until frame finishes in GPU)\n";
    }

    void render_frame() {
        std::cout << "\n[Vulkan Render Loop (Frame Execution)]\n";
        std::cout << "  A. vkWaitForFences & vkResetFences (Wait for previous frame to finish)\n";
        std::cout << "  B. vkAcquireNextImageKHR (Get next swapchain image index)\n";
        std::cout << "  C. vkResetCommandBuffer & vkBeginCommandBuffer:\n";
        std::cout << "     - vkCmdBeginRenderPass(render_pass, framebuffer[image_idx], clear_color)\n";
        std::cout << "     - vkCmdBindPipeline(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, graphics_pipeline)\n";
        std::cout << "     - vkCmdBindVertexBuffers(cmd, 0, 1, &vertex_buffer, &offsets)\n";
        std::cout << "     - vkCmdDraw(cmd, 3, 1, 0, 0) // Draw 3 vertices, 1 instance!\n";
        std::cout << "     - vkCmdEndRenderPass(cmd)\n";
        std::cout << "  D. vkEndCommandBuffer(cmd)\n";
        std::cout << "  E. vkQueueSubmit(graphics_queue, submit_info, in_flight_fence):\n";
        std::cout << "     Waits on image_available_semaphore, signals render_finished_semaphore\n";
        std::cout << "  F. vkQueuePresentKHR(present_queue, present_info):\n";
        std::cout << "     Hands completed image buffer to the operating system display compositor!\n";
    }

    void cleanup() {
        std::cout << "\n[Vulkan Teardown]\n";
        std::cout << "  vkDeviceWaitIdle: Ensuring GPU has completed all pending queue submissions.\n";
        std::cout << "  Explicit destruction of pipelines, render passes, buffers, memories, instances.\n";
    }
};

} // namespace vk_arch

int main() {
    std::cout << "============================================================\n";
    std::cout << "VULKAN 1.3 EXPLICIT GRAPHICS PIPELINE ARCHITECTURE\n";
    std::cout << "============================================================\n";

    vk_arch::VulkanTriangleApplication app;
    app.run();

    return 0;
}

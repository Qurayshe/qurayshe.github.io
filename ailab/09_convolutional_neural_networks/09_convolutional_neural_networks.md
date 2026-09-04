# Module 09: Convolutional Neural Networks (CNNs) & ResNet

Images possess fundamental geometric inductive biases: **local connectivity** (pixels close together are correlated) and **translation equivariance** (a cat is still a cat whether in the top-left or bottom-right corner). Standard MLPs fail on images because flattening an image destroys 2D spatial locality and causes parameter explosion. **Convolutional Neural Networks (CNNs)** solve this by sliding small, weight-shared parameter kernels across the spatial dimensions! ️

---

## 1. The 2D Cross-Correlation (Convolution) Operation

For an input feature map $X \in \mathbb{R}^{H \times W}$ and a learnable kernel $K \in \mathbb{R}^{k_h \times k_w}$:

$$(X * K)(i, j) = \sum_{m=0}^{k_h-1} \sum_{n=0}^{k_w-1} X(i + m, j + n) K(m, n)$$

```
     Input Image (5x5)          Kernel (3x3)          Output Map (3x3)
   [ 1  0  1  2  1 ]           [ 1  0 -1 ]              [ 4  2. ]
   [ 0  3  2  1  0 ]     *     [ 2  0 -2 ]      =       [... ]
   [ 2  1  0  3  2 ]           [ 1  0 -1 ]              [... ]
   [ 1  0  4  2  1 ]         (Sobel Edge Kernel)
   [ 0  2  1  0  3 ]
```

### Spatial Dimension Formulas
Given input spatial dimension $W_{\text{in}}$, kernel size $K$, padding $P$, and stride $S$:

$$W_{\text{out}} = \left\lfloor \frac{W_{\text{in}} - K + 2P}{S} \right\rfloor + 1$$

- **Padding $P$:** Prevents spatial shrinking at the borders (e.g. "same" padding preserves size when $P = (K - 1)/2$ for odd $K$).
- **Stride $S$:** Subsamples the feature map by stepping $S$ pixels at a time.

---

## 2. Multi-Channel Convolutions & Feature Hierarchies

Real images have channels (RGB, $C_{\text{in}} = 3$). A convolutional layer transforms $C_{\text{in}}$ channels to $C_{\text{out}}$ channels using a 4D weight tensor:
$$W \in \mathbb{R}^{C_{\text{out}} \times C_{\text{in}} \times K \times K}$$

```
 Layer 1 (Early): Small receptive field -> Edges, Corners, Gradients
 Layer 2 (Mid):   Larger receptive field -> Textures, Shapes, Grids
 Layer 3 (Deep):  Global receptive field -> Eyes, Wheels, Faces, Objects
```

### The `im2col` Matrix Multiplication Trick
Sliding nested loops in Python is slow. Production frameworks (cuDNN, PyTorch) unfold image patches into a 2D matrix (`im2col`), turning 2D convolutions into a single, blazing-fast GEMM (General Matrix Multiply) operation:
$$\text{Output} = \text{KernelMatrix} \times \text{UnfoldedPatches}$$

---

## 3. The Vanishing Gradient Problem & ResNet Skip Connections

As researchers stacked 20, 30, or 50 layers in plain CNNs (VGG), training accuracy unexpectedly degraded. Gradients exponentially decayed as they were multiplied across dozens of weight matrices:
$$\frac{\partial \mathcal{L}}{\partial A^{[0]}} = \prod_{l=1}^L \left( W^{[l]} \odot \sigma' \right)$$

### The Residual Breakthrough (He et al., 2015)
Kaiming He asked: "Can a deep model be at least as good as a shallow model plus identity mappings?"
Instead of forcing layers to learn the entire transformation $\mathcal{H}(\mathbf{x})$, ResNet introduces **skip connections (shortcuts)** so layers learn only the residual difference $\mathcal{F}(\mathbf{x})$:

$$\mathcal{H}(\mathbf{x}) = \mathcal{F}(\mathbf{x}) + \mathbf{x}$$

```
                x
              /   \
             |     [ Weight Layer 1 ]
             |            |
             |        [ ReLU ]
             |            |
             |     [ Weight Layer 2 ]
             |            |
             \-----> ( + )
                       |
                   [ ReLU ]
                       |
                   Output H(x)
```

### The Gradient Highway
Differentiating the residual block with respect to input $\mathbf{x}$:

$$\frac{\partial \mathcal{L}}{\partial \mathbf{x}} = \frac{\partial \mathcal{L}}{\partial \mathcal{H}} \frac{\partial \mathcal{H}}{\partial \mathbf{x}} = \frac{\partial \mathcal{L}}{\partial \mathcal{H}} \left( \frac{\partial \mathcal{F}}{\partial \mathbf{x}} + \mathbf{I} \right) = \frac{\partial \mathcal{L}}{\partial \mathcal{H}} \frac{\partial \mathcal{F}}{\partial \mathbf{x}} + \frac{\partial \mathcal{L}}{\partial \mathcal{H}}$$

Notice the constant $+\frac{\partial \mathcal{L}}{\partial \mathcal{H}}$ term! Even if the weights $\frac{\partial \mathcal{F}}{\partial \mathbf{x}}$ vanish to zero, the gradient flows directly through the identity skip highway unbroken! This single mathematical idea allowed networks to train reliably at 152+ layers and serves as the architectural foundation of **Transformers and Diffusion UNets** today.


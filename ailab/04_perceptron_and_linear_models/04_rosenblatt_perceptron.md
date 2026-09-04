# Module 04: The Rosenblatt Perceptron & Linear Separability

In 1958, Frank Rosenblatt created the **Perceptron** at Cornell Aeronautical Laboratory. It was hailed as the first algorithm capable of learning from sensory data—the electronic embryo of modern artificial neural networks. But it also triggered the first "AI Winter" when Marvin Minsky and Seymour Papert mathematically proved its fatal flaw in 1969. Let's dissect how it works!

---

## 1. The Biological & Mathematical Model

Inspired by the McCulloch-Pitts biological neuron (1943), the Perceptron computes a weighted sum of $d$ inputs, adds an offset bias $b$, and passes the pre-activation through a Heaviside step function:

$$z = \mathbf{w}^T \mathbf{x} + b = \sum_{i=1}^d w_i x_i + b$$

$$\hat{y} = f(z) = \begin{cases} +1 & \text{if } z \ge 0 \\ -1 & \text{if } z < 0 \end{cases}$$

```
   Inputs      Weights
     x1 ------->( w1 )\
     x2 ------->( w2 )--\   Summation      Step Function
.. ------->(.. )--->[ Σ w_i x_i + b ]--->[ f(z) ]---> Output (±1)
     xd ------->( wd )--/
                 ( b ) /
```

### Geometric Interpretation: The Separating Hyperplane
The equation $\mathbf{w}^T \mathbf{x} + b = 0$ defines a $(d-1)$-dimensional **hyperplane** in $\mathbb{R}^d$:
- Weight vector $\mathbf{w}$ is the normal vector (orthogonal) to the hyperplane.
- Bias $b$ dictates the offset of the hyperplane from the origin.
- Points where $\mathbf{w}^T \mathbf{x} + b > 0$ lie on one side (+1); points where $\mathbf{w}^T \mathbf{x} + b < 0$ lie on the other (-1).

---

## 2. The Perceptron Learning Rule

Unlike gradient descent (which requires smooth differentiable functions), the step function has zero derivative everywhere except $z = 0$. Rosenblatt used an intuitive error-correction rule:

For each misclassified sample $(\mathbf{x}_i, y_i)$:
$$\mathbf{w} \leftarrow \mathbf{w} + \eta y_i \mathbf{x}_i$$
$$b \leftarrow b + \eta y_i$$

Where $\eta \in (0, 1]$ is the learning rate.

### Why does this rule work?
If a sample was $+1$ but predicted $-1$, $\mathbf{w}^T \mathbf{x} < 0$. Updating $\mathbf{w}' = \mathbf{w} + \mathbf{x}$ changes the new dot product:
$$\mathbf{w}'^T \mathbf{x} = (\mathbf{w} + \mathbf{x})^T \mathbf{x} = \mathbf{w}^T \mathbf{x} + \|\mathbf{x}\|^2$$
Since $\|\mathbf{x}\|^2 > 0$, the new projection is pushed in the positive direction toward the correct label!

---

## 3. The Novikoff Perceptron Convergence Theorem

If the dataset $\mathcal{D}$ is **linearly separable** with geometric margin $\gamma = \min_i \frac{y_i (\mathbf{w}^* \cdot \mathbf{x}_i)}{\|\mathbf{w}^*\|} > 0$, and bounded by radius $R = \max_i \|\mathbf{x}_i\|_2$, then the Perceptron is **guaranteed to converge** to a separating hyperplane in at most:

$$k \le \left(\frac{R}{\gamma}\right)^2 \text{ mistakes}$$

---

## 4. The 1969 XOR Crisis & The First AI Winter

In their 1969 book *Perceptrons*, Marvin Minsky and Seymour Papert proved that a single-layer perceptron can **never** solve the exclusive-OR (XOR) problem.

| $x_1$ | $x_2$ | $x_1 \text{ AND } x_2$ | $x_1 \text{ OR } x_2$ | $x_1 \text{ XOR } x_2$ |
| :---: | :---: | :---: | :---: | :---: |
| 0 | 0 | 0 | 0 | **0** |
| 0 | 1 | 0 | 1 | **1** |
| 1 | 0 | 0 | 1 | **1** |
| 1 | 1 | 1 | 1 | **0** |

```
   Linear Separable (AND/OR)             Non-Linearly Separable (XOR)
        x2                                     x2
         |                                      |
       1 |  (+)     (+)                       1 |  (+)     (o)
         |       /                              |
         |      /                               |
       0 |  (o)/    (+)                       0 |  (o)     (+)
         +---------------> x1                   +---------------> x1
            0        1                             0        1
      [ A single straight line            [ No single line can separate
        separates (+) from (o) ]            the diagonal clusters! ]
```

Because no single linear hyperplane can slice $(0, 1)$ and $(1, 0)$ away from $(0, 0)$ and $(1, 1)$, single-layer linear models hit an insurmountable wall. Solving XOR required **hidden layers** and non-linear transformations—setting the stage for the Multi-Layer Perceptron (MLP) and backpropagation revolution.


/**
 * Simplified Math Explanations & Plain-English Intuition for AI Fundamentals
 * Breaks down complex mathematical machinery into clear visual analogies and takeaways.
 */

export const AI_SIMPLIFIED_MATH = {
  '00a_vector_spaces_and_transforms': {
    title: 'Vector Spaces & Linear Transformations',
    coreFormula: '$$T(\\mathbf{x}) = A\\mathbf{x} = \\sum_{j=1}^n x_j \\mathbf{a}_j \\quad \\text{and} \\quad \\text{proj}_{\\mathbf{v}}(\\mathbf{u}) = \\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\|\\mathbf{v}\\|^2} \\mathbf{v}$$',
    simpleExplanation: 'A vector space is a sandbox where you can stretch (scalar multiply) and combine (add) arrows without ever leaving the box. A matrix is just a machine that tilts, stretches, or rotates the grid lines of this sandbox while keeping the origin fixed and parallel lines parallel.',
    realWorldAnalogy: 'Think of graph paper made of rubber. If you pin down the origin (0,0) and stretch the paper diagonally or twist it by 45 degrees, grid squares distort into parallelograms, but straight lines remain straight. A matrix simply records where the unit marks (1,0) and (0,1) landed after the stretch!',
    svdInsight: 'Every linear layer in a neural network (e.g. y = Wx + b) is literally a geometric transformation that shears, rotates, and stretches input features so that downstream classifiers can separate complex clusters.'
  },

  '00b_linear_systems_and_determinants': {
    title: 'Linear Systems, Inverses & Determinants',
    coreFormula: '$$A\\mathbf{x} = \\mathbf{b} \\iff \\mathbf{x} = A^{-1}\\mathbf{b} \\quad \\text{and} \\quad \\det(A) = \\prod_{i=1}^n u_{ii} (-1)^s$$',
    simpleExplanation: 'A system of linear equations is asking: what exact mixture of columns in matrix A will reach target destination b? The determinant measures whether the matrix squashes an entire multi-dimensional space flat into a pancake or line. If det(A) = 0, the volume collapses to zero, information is permanently lost, and no inverse can undo the squash.',
    realWorldAnalogy: 'Imagine baking dough with an area of 1 square foot. A transformation with determinant 2 doubles the area to 2 square feet. A determinant of 0.5 halves it. A determinant of 0 runs a hydraulic press on the dough until it collapses into an infinitely thin crease—you can never reconstruct the original 3D bread from a 0-volume pancake!',
    svdInsight: 'Invertibility and condition numbers determine whether training neural networks will suffer from exploding or vanishing gradients. Normalizing flow architectures explicitly require cheap, non-zero determinants to track probability density.'
  },

  '00c_differential_equations_and_dynamics': {
    title: 'Differential Equations & Continuous Dynamics',
    coreFormula: '$$\\frac{d\\mathbf{y}}{dt} = \\mathbf{f}(t, \\mathbf{y}) \\quad \\text{and} \\quad \\mathbf{y}_{n+1} = \\mathbf{y}_n + \\frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$$',
    simpleExplanation: 'A differential equation gives you a velocity compass at every coordinate in space, telling you which direction to travel and how fast. An ODE solver is a hiker taking small steps along the direction of the compass to trace out the trajectory over time.',
    realWorldAnalogy: 'Euler integration is like driving a car at night with your eyes closed for 1 second, opening them to check your GPS, and adjusting your steering wheel. RK4 is like having an autopilot that peeks ahead 4 times during that single second, averaging the curve of the road so you never drift off the highway.',
    svdInsight: 'Residual Networks (ResNets) are literally Euler steps through continuous depth. Modern image generators like Stable Diffusion 3, Flux, and OpenAI Sora use Flow Matching to solve continuous ODE trajectories that turn Gaussian noise into photorealistic images in straight lines.'
  },

  '01_linear_algebra': {
    title: 'Linear Algebra & Tensors',
    coreFormula: '$$\\mathbf{u} \\cdot \\mathbf{v} = \\|\\mathbf{u}\\| \\|\\mathbf{v}\\| \\cos(\\theta) \\quad \\text{and} \\quad A = U \\Sigma V^T$$',
    simpleExplanation: 'Imagine shining a flashlight from one arrow onto another. The length of the shadow cast tells you how closely aligned they are. If the arrows are perpendicular (90°), the shadow is zero—they share zero information.',
    realWorldAnalogy: 'In vector search and LLM embeddings (like ChatGPT searching a knowledge base), every sentence is converted into a list of numbers. When you ask a question, the AI computes the dot product (cosine similarity) between your question and millions of documents in milliseconds to find the closest matches.',
    svdInsight: 'SVD (Singular Value Decomposition) compresses a giant data table into just the top few most important recipes or ingredients, discarding noise. It is the mathematical grandparent of modern LLM weight compression and LoRA fine-tuning.'
  },

  '02_calculus_and_autodiff': {
    title: 'Multivariate Calculus & Autodiff',
    coreFormula: '$$\\mathbf{w}_{t+1} = \\mathbf{w}_t - \\eta \\nabla \\mathcal{L}(\\mathbf{w}) \\quad \\text{and} \\quad \\frac{\\partial L}{\\partial x} = \\sum_{i} \\frac{\\partial L}{\\partial y_i} \\frac{\\partial y_i}{\\partial x}$$',
    simpleExplanation: 'Imagine you are blindfolded on a foggy mountain and want to reach the lowest valley. You feel the slope with your feet and take a step in the steepest downward direction. That is Gradient Descent!',
    realWorldAnalogy: 'The gradient (∇L) is simply a compass pointing uphill toward where the model makes more mistakes. We multiply by a small step size (learning rate η) and step in the opposite direction (-∇L) to reduce errors.',
    svdInsight: 'Reverse-mode automatic differentiation (backprop) is pure genius: instead of testing how 70 billion parameters affect the loss one-by-one from left to right, it starts at the final error and flows backward in ONE single pass, computing exact blame scores for every parameter at the same time.'
  },

  '03_probability_and_information_theory': {
    title: 'Probability & Information Theory',
    coreFormula: '$$H(P) = -\\sum_{x} P(x) \\log_2 P(x) \\quad \\text{and} \\quad D_{KL}(P \\parallel Q) = \\sum_{x} P(x) \\log \\frac{P(x)}{Q(x)}$$',
    simpleExplanation: 'Information measures surprise. If someone tells you the sun rose this morning, that carries zero surprise (zero entropy). If they tell you it snowed in the Sahara, that carries massive surprise (high entropy).',
    realWorldAnalogy: 'Cross-Entropy Loss measures how surprised an AI model is by the correct answer. If the model predicted the next word was 99% likely to be "coffee", its penalty is close to 0. If it predicted 0.01%, the penalty is huge.',
    svdInsight: 'KL Divergence is a mathematical ruler measuring the difference between two belief distributions. In RLHF and DPO alignment, it acts as a safety leash to prevent a fine-tuned chatbot from drifting too far from its original base knowledge.'
  },

  '04_perceptron_and_linear_models': {
    title: 'The Rosenblatt Perceptron',
    coreFormula: '$$z = \\mathbf{w}^T \\mathbf{x} + b \\quad \\text{with} \\quad \\mathbf{w} \\leftarrow \\mathbf{w} + \\eta \\, y \\, \\mathbf{x}$$',
    simpleExplanation: 'A single perceptron is like a straight ruler slicing a table of red and blue marbles into two groups. The weights (w) tilt the angle of the ruler, and the bias (b) slides the ruler left or right.',
    realWorldAnalogy: 'If a credit card company wants to approve (+1) or deny (-1) a transaction, it multiplies income, debt, and credit score by learned weights. If the total is above threshold, it says YES; otherwise NO.',
    svdInsight: 'The 1969 XOR Crisis: If red marbles are in the top-right and bottom-left, and blue marbles are in the other two corners, no single straight cut can ever separate them. That proved single-layer linear models have limits, forcing the invention of multi-layer neural networks.'
  },

  '05_logistic_regression_and_optimization': {
    title: 'Logistic Regression & Adam Optimizer',
    coreFormula: '$$\\sigma(z) = \\frac{1}{1 + e^{-z}} \\quad \\text{and} \\quad \\mathbf{w}_{t+1} = \\mathbf{w}_t - \\frac{\\eta}{\\sqrt{\\hat{\\mathbf{v}}_t} + \\epsilon} \\hat{\\mathbf{m}}_t$$',
    simpleExplanation: 'The sigmoid function is an S-shaped curve that squashes any number—no matter how giant or negative—into a clean probability percentage between 0% and 100%.',
    realWorldAnalogy: 'Adam is like rolling a heavy bowling ball down a bumpy hill. Momentum (first moment m) gives it inertia so it crashes through small potholes without getting stuck. Adaptive scaling (second moment v) pumps the brakes on steep directions and hits the gas on flat roads.',
    svdInsight: 'Adam is the undisputed standard optimizer in almost all modern AI training (GPT-4, LLaMA, Stable Diffusion) because it tunes its own learning rate for each individual parameter automatically.'
  },

  '06_support_vector_machines': {
    title: 'Support Vector Machines & Kernels',
    coreFormula: '$$\\text{Margin} = \\frac{2}{\\|\\mathbf{w}\\|_2} \\quad \\text{and} \\quad K(\\mathbf{x}, \\mathbf{z}) = \\exp\\left(-\\gamma \\|\\mathbf{x} - \\mathbf{z}\\|^2\\right)$$',
    simpleExplanation: 'Rather than just drawing any boundary that separates two groups, SVM builds the widest possible highway between them, keeping the road as far as possible from the nearest hazard points (the support vectors).',
    realWorldAnalogy: 'The Kernel Trick: Imagine blue dots arranged in a circle surrounded by an outer ring of red dots on a flat paper. You cannot separate them with a single straight line. But if you punch the center of the paper upward like a cone, the blue dots rise into 3D! Now a flat sheet of cardboard can easily slice between them.',
    svdInsight: 'Mercer\'s Theorem allows SVMs to compute distances in infinite-dimensional spaces using simple inner products—achieving non-linear boundaries without the computational cost of high dimensions.'
  },

  '07_multi_layer_perceptrons_and_backprop': {
    title: 'MLPs & Matrix Backpropagation',
    coreFormula: '$$A^{[l]} = \\text{GELU}\\left( A^{[l-1]} W^{[l]} + \\mathbf{b}^{[l]} \\right) \\quad \\text{and} \\quad \\frac{\\partial \\mathcal{L}}{\\partial W^{[l]}} = (A^{[l-1]})^T \\delta^{[l]}$$',
    simpleExplanation: 'Hidden layers act like origami folds. Each layer twists and bends the input coordinate space so that tangled, non-linear data becomes linearly separable by the final layer.',
    realWorldAnalogy: 'Why non-linear activations (ReLU / GELU) are crucial: If you stack 100 purely linear layers without non-linearities, 100 matrix multiplications collapse into just 1 single linear matrix! Activations are what allow networks to learn complex curves, languages, and patterns.',
    svdInsight: 'Matrix Backprop: Differentiating across batches aligns row-column matrix multiplications with the chain rule. One matrix multiply forward, one transposed multiply backward!'
  },

  '08_regularization_and_normalization': {
    title: 'Regularization & Normalization',
    coreFormula: '$$\\text{RMSNorm}(\\mathbf{x}) = \\frac{\\mathbf{x}}{\\sqrt{\\frac{1}{d}\\sum x_i^2 + \\epsilon}} \\odot \\boldsymbol{\\gamma} \\quad \\text{and} \\quad \\tilde{a} = \\frac{m \\odot a}{1 - p}$$',
    simpleExplanation: 'Deep networks have so many parameters they can easily memorize the answers like a student cramming cheat codes without understanding the concepts. Regularization forces them to learn true general rules.',
    realWorldAnalogy: 'Dropout is like benching random players on a soccer team during practice. Because nobody knows who will be missing on any given drill, every player is forced to learn real teamwork rather than relying on one superstar.',
    svdInsight: 'RMSNorm (used in LLaMA-3) scales activations by their root-mean-square without subtracting the mean. This saves 7% GPU memory bandwidth while keeping numbers from exploding across 100+ layers.'
  },

  '09_convolutional_neural_networks': {
    title: 'CNNs & ResNet Architecture',
    coreFormula: '$$(X * K)(i, j) = \\sum_{m} \\sum_{n} X(i+m, j+n) K(m, n) \\quad \\text{and} \\quad \\mathcal{H}(\\mathbf{x}) = \\mathcal{F}(\\mathbf{x}) + \\mathbf{x}$$',
    simpleExplanation: 'A convolution is like sliding a small 3x3 magnifying stencil across an image to detect features like edges and textures. Because the exact same stencil is used everywhere, it recognizes a cat whether it is in the top-left or bottom-right corner.',
    realWorldAnalogy: 'ResNet Skip Connections (The Express Elevator): In networks with 50+ layers, signals get lost walking down 50 flights of stairs. ResNet adds an elevator shaft where the original input x skips ahead and is added to the output. Even if the layers learn nothing, performance never degrades.',
    svdInsight: 'Skip connections solve vanishing gradients and form the architectural backbone of both Transformers and modern Diffusion image generators.'
  },

  '10_recurrent_neural_networks_and_lstms': {
    title: 'RNNs & LSTM Networks',
    coreFormula: '$$\\mathbf{C}_t = \\mathbf{f}_t \\odot \\mathbf{C}_{t-1} + \\mathbf{i}_t \\odot \\tilde{\\mathbf{C}}_t \\quad \\text{and} \\quad \\mathbf{h}_t = \\mathbf{o}_t \\odot \\tanh(\\mathbf{C}_t)$$',
    simpleExplanation: 'Plain RNNs suffer from extreme short-term memory: reading word 50, they have completely forgotten word 1 because their memory gets overwritten at every single step.',
    realWorldAnalogy: 'The LSTM Conveyor Belt: The cell state C_t is a conveyor belt passing through time. The Forget Gate throws away outdated facts; the Input Gate adds new important facts; the Output Gate reads out the current thought. Because facts are added rather than multiplied, memories can travel across hundreds of steps intact.',
    svdInsight: 'LSTMs dominated language processing from 1997 to 2017 until Transformers proved that processing all words simultaneously in parallel was faster and more scalable.'
  },

  '11_attention_and_transformers': {
    title: 'Attention & RoPE Embeddings',
    coreFormula: '$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}} + M\\right) V \\quad \\text{and} \\quad \\tilde{\\mathbf{q}}_m = R_{\\Theta, m} \\mathbf{q}_m$$',
    simpleExplanation: 'Attention works like a search engine lookup: Query is what a word is looking for; Key is what every other word advertises; Value is the actual informational content. Comparing Query against all Keys generates relevance weights to fetch a blended summary.',
    realWorldAnalogy: 'In the sentence "The animal didn\'t cross the street because it was too tired", Attention allows the word "it" to reach back and connect strongly to "animal" rather than "street".',
    svdInsight: 'Rotary Position Embeddings (RoPE) rotate query and key vectors in 2D pairs like clock hands. The angle difference between two words depends only on their relative distance apart, allowing models to handle long contexts seamlessly.'
  },

  '12_large_language_models_pretraining': {
    title: 'LLMs & KV-Caching',
    coreFormula: '$$\\mathcal{L}(\\theta) = -\\frac{1}{T}\\sum_{t=1}^T \\log P_\\theta(x_t \\mid x_{<t}) \\quad \\text{and} \\quad \\text{Cache}_K \\leftarrow [\\text{Cache}_K; \\mathbf{k}_t]$$',
    simpleExplanation: 'Foundation models do one thing at monumental scale: predict the single next word. By training on trillions of words from books, code, and websites, predicting the next word forces the model to learn grammar, logic, and common sense.',
    realWorldAnalogy: 'KV-Caching: If you are writing a 1,000-word essay, generating word 1,001 naively requires re-reading all 1,000 previous words from scratch. The KV-cache saves the memory states of past words in GPU VRAM so generating word 1,001 only takes one quick calculation!',
    svdInsight: 'KV-caching turns generation from an O(N²) quadratic bottleneck into a fast O(N) linear stream, making real-time chat interfaces possible.'
  },

  '13_peft_and_lora': {
    title: 'LoRA & PEFT Adapters',
    coreFormula: '$$\\Delta W = B \\cdot A \\quad (r \\ll d) \\quad \\text{and} \\quad W_{\\text{merged}} = W_0 + \\frac{\\alpha}{r} (B A)$$',
    simpleExplanation: 'Fine-tuning a 70B parameter model normally requires updating 70 billion dials. LoRA freezes the original 70 billion dials and attaches two tiny accessory dials that capture 99% of the benefit with 0.1% of the compute.',
    realWorldAnalogy: 'Instead of storing a 4096x4096 matrix (16.7 million numbers), LoRA decomposes it into two skinny matrices of rank 8 (4096x8 and 8x4096 = 65,536 numbers). That is a 99.6% parameter reduction!',
    svdInsight: 'Weight Merging: After fine-tuning, you simply multiply B @ A and add the numbers directly into the original base weights. In production, your model runs with zero additional latency or memory overhead.'
  },

  '14_alignment_rlhf_and_dpo': {
    title: 'Alignment: RLHF & DPO',
    coreFormula: '$$\\mathcal{L}_{\\text{DPO}} = -\\mathbb{E} \\left[ \\log \\sigma \\left( \\beta \\log \\frac{\\pi_\\theta(y_w)}{\\pi_{\\text{ref}}(y_w)} - \\beta \\log \\frac{\\pi_\\theta(y_l)}{\\pi_{\\text{ref}}(y_l)} \\right) \\right]$$',
    simpleExplanation: 'A raw pre-trained model knows how to write harmful content because the internet contains harmful content. Alignment steers models to be Helpful, Honest, and Harmless.',
    realWorldAnalogy: 'Classic RLHF used complicated trial-and-error reinforcement learning with four giant neural networks loaded at once. DPO mathematically proved you can bypass reinforcement learning entirely: just give the model pairs of (Preferred Answer vs Rejected Answer) and optimize it with a simple binary classification loss!',
    svdInsight: 'DPO eliminates training crashes, saves half your GPU VRAM, and is used to align modern models like LLaMA-3 and Mistral.'
  },

  '15_diffusion_and_flow_matching': {
    title: 'Diffusion & Flow Matching',
    coreFormula: '$$\\mathbf{x}_t = \\sqrt{\\bar{\\alpha}_t} \\mathbf{x}_0 + \\sqrt{1 - \\bar{\\alpha}_t} \\boldsymbol{\\epsilon} \\quad \\text{and} \\quad \\frac{d\\mathbf{x}_t}{dt} = \\mathbf{x}_1 - \\mathbf{x}_0$$',
    simpleExplanation: 'Diffusion works like sculpting from a block of marble. You start with pure static television noise (Gaussian noise) and train a neural network to peel away the noise step-by-step until a sharp image appears.',
    realWorldAnalogy: 'Flow Matching (The Straight-Line Revolution): Classic diffusion models follow windy, curved Brownian motion paths through noise space, taking 50 to 100 solver steps. Flow Matching connects noise to clean images in straight lines, enabling tools like Stable Diffusion 3 and Flux to create photorealistic images in just 4 to 8 steps.',
    svdInsight: 'Classifier-Free Guidance (CFG) lets you crank up a dial that pushes the image to adhere more strictly to your text prompt.'
  },

  '16_reasoning_and_inference_sota': {
    title: 'Reasoning & Speculative Decoding',
    coreFormula: '$$\\text{Accuracy} \\propto (\\text{Test-Time Compute})^\\beta \\quad \\text{and} \\quad \\alpha = \\min\\left(1, \\frac{P(\\tilde{x})}{Q(\\tilde{x})}\\right)$$',
    simpleExplanation: 'Older models blurt out the first token that comes to mind in milliseconds. Modern reasoning models (OpenAI o1/o3, DeepSeek-R1) spend compute thinking, trying multiple reasoning paths, checking their work, and backtracking if they make a mistake.',
    realWorldAnalogy: 'Speculative Decoding: A tiny 1B "intern" model drafts 4 words rapidly. The big 70B "professor" model verifies all 4 words simultaneously in one single parallel glance! If the intern was right, all 4 words are accepted at once—giving 2-3x faster inference with zero loss in output quality.',
    svdInsight: 'Process Reward Models (PRMs) grade every intermediate step of a math derivation instead of only checking the final answer, enabling Monte Carlo Tree Search (MCTS) over reasoning trees.'
  }
};



![鸭子下蛋问题](https://cdn.luogu.com.cn/upload/image_hosting/sxt967gy.png)

设定符号如下：

| 符号 | 含义 |
| ---------- | ------------------------ |
| $m_d$    | 鸭子的质量（不含蛋）               |
| $m_e$    | 鸭蛋的质量                    |
| $\rho_w$ | 水的密度                     |
| $\rho_e$ | 鸭蛋的密度，其中 $\rho_e > \rho_w$，因为它会下沉 |
| $V_e$    | 鸭蛋的体积                    |
| $V_{d1}$ | 鸭子在下蛋前排开的水体积             |
| $V_{d2}$ | 鸭子在下蛋后排开的水体积             |

---

### 下蛋前：

鸭子和蛋一起漂浮，满足阿基米德原理：

$$\rho_w g V_{d1} = (m_d + m_e) g$$

所以：

$$V_{d1} = \frac{m_d + m_e}{\rho_w}$$

---

### 下蛋后：

* 鸭子质量变为 $m_d$，仍漂浮：

  $$\rho_w g V_{d2} = m_d g \quad \Rightarrow \quad V_{d2} = \frac{m_d}{\rho_w}$$

* 鸭蛋沉底，排开与其体积相等的水：

  $$V_e = \frac{m_e}{\rho_e}$$

---

下蛋前总排水体积：
$$V_{\text{前}} = V_{d1}$$

下蛋后总排水体积：
$$V_{\text{后}} = V_{d2} + V_e$$

水面变化取决于两者大小比较：

$$\Delta V = V_{\text{后}} - V_{\text{前}} = \frac{m_d}{\rho_w} + \frac{m_e}{\rho_e} - \frac{m_d + m_e}{\rho_w}$$

化简：

$$\Delta V = m_e \left( \frac{1}{\rho_e} - \frac{1}{\rho_w} \right)$$

---

### 判断：

因为 $\rho_e > \rho_w$，所以：

$$\frac{1}{\rho_e} - \frac{1}{\rho_w} < 0$$

因此：

$$\Delta V < 0$$

也就是说，总排水体积**减少**，水面**下降**。

---

**结论：**

$$\boxed{\Delta V = m_e \left( \frac{1}{\rho_e} - \frac{1}{\rho_w} \right) < 0 \quad \Rightarrow \text{水面下降。}}$$
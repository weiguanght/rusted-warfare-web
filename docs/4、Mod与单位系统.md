这是整个架构中最庞大、也最灵活的部分。为了支持《铁锈战争》极度活跃的 Mod 社区，开发者实际上在 Java 引擎之上构建了一套**解释型语言环境**。

**第四部分：Mod 解析与自定义单位系统 (Modding & Custom Unit System)** 的逻辑拆解。

---

### 第四部分：Mod 解析与数据驱动架构

这部分代码的核心任务是：**将静态的文本文件（.ini）“翻译”成动态的游戏逻辑（Java对象）**。它允许非程序员通过修改配置文件，就能改变游戏底层的运行规则。

#### 1. 核心解析器：配置读取引擎 (The INI Configuration Engine)
在源码中（位于 `com.corrodinggames.rts.gameFramework.utility` 包下，以及 `custom` 包中的加载逻辑），有一个专门负责“阅读”文件的子系统。

* **INI 读取器 (GameIniReader)**：
    * **逻辑**：它不仅仅是简单的键值对读取，还实现了**继承与宏替换**。
    * **`copyFrom` (继承机制)**：当读取一个单位文件时，代码首先检查是否有 `copyFrom` 关键字。如果有，它会递归地先加载父级文件，然后用当前文件的属性覆盖父级属性。这允许 Mod 作者创建一个“基础坦克”模板，然后派生出几十种变体。
    * **变量替换**：它支持在加载阶段解析 `${...}` 格式的变量，允许在文件头部定义常量，在后续引用。

#### 2. 蓝图与实例分离 (Type vs Instance)
为了节省内存并提高效率，游戏采用了**享元模式 (Flyweight Pattern)** 的变体。

* **CustomUnitMetadata (类名 `l` 或 `CustomUnitType`) - “蓝图”**：
    * **角色**：这是 .ini 文件在内存中的直接映射。
    * **存储内容**：它存储了单位的静态数据，比如造价、最大血量、图片资源、开火音效。
    * **内存占用**：无论地图上有多少个“重型坦克”，内存中只有一份“重型坦克”的 `Metadata`。
* **CustomUnit (类名 `j` 或 `CustomUnit`) - “实体”**：
    * **角色**：这是地图上实际存在的、会动的坦克。
    * **存储内容**：它只存储动态数据，比如当前血量、当前位置、炮塔当前角度。
    * **关联**：每个 `CustomUnit` 内部都有一个指针指向它的 `CustomUnitMetadata`。当它需要知道“我的最大射程是多少”时，它会去查阅蓝图。

#### 3. 动态逻辑引擎：LogicBoolean (The Scripting Engine)
这是 Mod 系统中最复杂、最精彩的部分。为了让 Mod 能实现“当血量低于 50% 且在水上时变形”这样的复杂逻辑，开发者手写了一个简单的**表达式编译器**。

* **LogicBoolean (逻辑布尔值)**：
    * **职责**：将字符串形式的逻辑表达式编译成可执行的树状结构。
    * **工作流**：
        1.  **词法分析**：读取字符串 `self.hp < 100 and self.isOverWater()`。
        2.  **构建语法树**：将其转换为 Java 对象树。
            * 根节点：`AndLogic` (与运算)
            * 左子节点：`CompareLogic` (比较: hp < 100)
            * 右子节点：`FunctionLogic` (函数: isOverWater)
    * **运行时求值**：在游戏每一帧的 `update` 循环中，单位会调用这个树的根节点。根节点递归调用子节点，最终返回 `true` 或 `false`。
    * **支持的语法**：支持数学运算、逻辑运算、以及数百个内置函数（如 `distanceTo`, `resource`, `isAttacking`）。

#### 4. 自定义动作系统 (Action System)
除了修改属性，Mod 还可以定义“技能”。这通过解析 `[action_name]` 块来实现。

* **ActionDefinition (动作定义)**：
    * **触发条件**：`isVisible`, `isLocked` (绑定到 `LogicBoolean`)。
    * **成本检查**：`price` (不仅仅是钱，可以是任何自定义资源)。
    * **执行效果**：
        * `fireTurretXAtGround`: 强制开火。
        * `spawnUnits`: 生产单位。
        * `addResources`: 增减资源。
        * `convertTo`: 变身（切换为另一个 UnitType）。
        * `setUnitMemory`: 修改单位内部的自定义变量。

#### 5. 资源与内存变量系统 (Dynamic Resources)
为了支持复杂的 RPG 地图或塔防模式，代码实现了一套通用的变量系统。

* **CustomResource (自定义资源)**：
    * 不再局限于“金钱 (Credits)”，Mod 可以定义“法力值”、“弹药量”、“愤怒值”。
    * 代码在 `GameEngine` 中维护了一个动态的资源表。
* **Unit Memory (单位记忆)**：
    * 每个 `CustomUnit` 身上有一块类似于“寄存器”的存储空间。
    * Mod 可以通过逻辑写入 `setUnitMemory(slot=1, value=5)`，并在后续通过 `memory(slot=1)` 读取。这赋予了单位“记忆”以前发生过什么事情的能力。

---

### 第四部分逻辑总结图示

**从文本到游戏世界的全过程：**

1.  **Loading Phase (加载阶段)**：
    * 扫描 `units/` 目录 -> 发现 `heavy_tank.ini`。
    * **Parser** 逐行读取 -> 处理 `copyFrom` -> 替换变量。
    * **Compiler** 解析所有的 `autoTrigger` 和 `canAttack` 逻辑字符串 -> 编译为 `LogicBoolean` 对象树。
    * 加载图片 (.png) 和声音 (.wav) -> 存入 **AssetManager**。
    * 生成一个 **`CustomUnitMetadata` (蓝图)** 对象，注册到单位列表。

2.  **Runtime Phase (运行阶段)**：
    * 玩家点击“建造” -> **Factory** 查找蓝图。
    * **Instantiate** -> 创建一个新的 **`CustomUnit`**，链接到蓝图。
    * **Update Loop**：
        * 每帧检查 `[core] autoTrigger`：运行 `LogicBoolean` 树。
        * 如果结果为 `true` -> 执行定义的 Effect（如回血、变身）。
        * 检查 `[turret]` 逻辑 -> 依据蓝图的参数旋转炮塔。

---

### 全局架构总结 (Final Architecture Summary)

至此，我们已经完成了对《铁锈战争》四大核心板块的逻辑拆解：

1.  **引擎层 (Engine)**：提供了时间（循环）、空间（坐标系）和物质基础（对象池）。
2.  **实体层 (Entities)**：定义了单位的基本生存法则（移动、碰撞、继承）。
3.  **网络层 (Network)**：通过帧同步技术，让不同时空的玩家处于同一个逻辑时间轴上。
4.  **Mod 层 (Modding)**：通过解释器和蓝图系统，将硬编码的游戏规则开放给数据驱动，实现了无限的扩展性。

这套架构极其精简高效，没有使用庞大的第三方引擎（如 Unity/Unreal），而是直接基于 Java/Android API 构建，这也是它能在极低配置设备上运行万人同屏（大量单位）的根本原因。

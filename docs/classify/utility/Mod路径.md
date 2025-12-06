#Mod路径

在网页端（浏览器环境），**根本不存在“真实的物理文件路径”**（比如 `C:\Users\Downloads\test.rwmod`）。浏览器出于安全考虑，把网页运行在沙盒（Sandbox）里，网页代码无法知道用户硬盘上的文件结构。

因此，当用户上传 `.rwmod` 文件时，你需要在一个**虚拟文件系统 (VFS)** 中手动给它分配一个路径。

以下是具体的处理逻辑和推荐的路径设计：

### 1. 核心概念：`.rwmod` 本质是 ZIP
`.rwmod` 文件本质上就是一个将文件后缀改了名的 ZIP 压缩包。
* **读取方式**：使用 JS 库（如 `jszip`）解压。
* **存储方式**：解压后的文件内容（Blob 或 ArrayBuffer）存储在内存中（你的 VFS Map）。

### 2. 推荐的虚拟路径设计
为了兼容《铁锈战争》原版的引用逻辑（比如 `copyFrom: ROOT:units/tank.ini`），建议你采用以下虚拟路径结构：

* **根目录**：`/`
* **官方资源（内置）**：`/assets/`
* **Mod 挂载点**：`/mods/`

当你上传一个名为 `super_tank.rwmod` 的文件时，建议将其内容**挂载 (Mount)** 到：
`virtual:/mods/super_tank/`

### 3. 读取流程图解

1.  **上传**：用户选择 `super_tank.rwmod`。
2.  **解压**：浏览器通过 `JSZip` 读取文件。
    * 假设压缩包内部结构是：
        * `mod.info`
        * `units/tank.ini`
        * `units/tank.png`
3.  **映射 (Mounting)**：你的代码遍历解压出来的文件，把它们存入 VFS 字典：
    * `/mods/super_tank/mod.info` -> [文件内容]
    * `/mods/super_tank/units/tank.ini` -> [文件内容]
    * `/mods/super_tank/units/tank.png` -> [文件内容]

### 4. 代码实现提示 (Prompting)

你需要让 AI 写一段代码，处理文件上传、解压，并生成正确的虚拟路径。

**任务目标**：实现 `.rwmod` 文件的导入，并将其挂载到虚拟文件系统。

> **Prompt (rwmod 导入器)：**
> “我们现在需要实现网页端的模组导入功能。
> 请帮我写一个 `ModImporter` 类（TypeScript）。
>
> **前置条件**：
> 1. 我们使用 `jszip` 库来解压文件。
> 2. 假设我们已经有一个全局的 `VFS` 单例，有一个 `VFS.writeFile(virtualPath: string, data: ArrayBuffer)` 方法。
>
> **要求**：
> 1. 实现 `importRwmod(file: File)` 方法。
>    - 输入：浏览器 `<input type='file'>` 获取的 File 对象。
>    - 逻辑：
>      a. 获取文件名（去掉后缀），例如 `my_mod.rwmod` -> `my_mod`。这将作为 Mod 的唯一 ID (ModID)。
>      b. 使用 JSZip 加载这个文件。
>      c. 遍历 Zip 中的所有文件。
>      d. **构建虚拟路径**：格式为 `/mods/{ModID}/{ZipInternalPath}`。
>      e. 将文件内容读取为 ArrayBuffer，并调用 `VFS.writeFile` 存入。
>
> 2. **处理路径兼容性**：
>    - 确保路径分隔符统一为正斜杠 `/`。
>    - 忽略 Zip 里的 `__MACOSX` 文件夹或 `.DS_Store` 垃圾文件。
>
> 3. **返回结果**：
>    - 返回一个 Promise，解析出该 Mod 的挂载根路径（例如 `/mods/my_mod/`），以便后续加载器知道去哪里找 `mod.info`。”

### 5. 关于 `copyFrom` 和资源引用的注意事项

在游戏逻辑解析 ini 文件时，如果遇到资源引用，你需要根据当前文件的路径解析相对路径。

* **场景**：
    * 当前文件：`/mods/super_tank/units/tank.ini`
    * 内容：`image: body.png`
* **解析逻辑**：
    * 你需要把“当前目录” (`/mods/super_tank/units/`) + “引用路径” (`body.png`) 拼接。
    * 结果：`/mods/super_tank/units/body.png` -> 去 VFS 里找这个 Key。

* **场景（跨 Mod 引用/绝对路径）**：
    * 如果内容是：`copyFrom: ROOT:units/base.ini`
    * 你的 VFS 需要把 `ROOT:` 映射到游戏的内置资源目录（例如 `/assets/`）。

**总结**：在网页上，路径是你自己定义的字符串 Key。只要你的**导入器（存）**和**读取器（取）**对路径的拼接规则达成一致（统一用 `/mods/xxx/` 开头），游戏就能正常运行。

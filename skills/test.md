graph TD
    %% 定义样式
    classDef offchain fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef onchain fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef agent fill:#fff3e0,stroke:#e65100,stroke-width:2px;

    subgraph Data_Plane [数据平面 - 链下高效协作层]
        A[Agent A 请求者]:::agent
        B[Guardian Interceptor 哨兵拦截器]:::offchain
        C[Agent B 执行者]:::agent
        D[Observation Node 观测审计]:::offchain
    end

    subgraph Control_Plane [控制平面 - 链上可信治理层]
        E[Central Trust Authority 信任大脑]:::onchain
        F1[(Redis 实时信用缓存)]:::offchain
        F2[(Blockchain Ledger 链上信誉账本)]:::onchain
        G[Slashing Contract 惩罚裁决合约]:::onchain
    end

    %% 数据流向
    A -->|1. 发起请求| B
    B -->|2. 鉴权查询| F1
    F1 -.->|同步镜像| F2
    B -->|3. 判定通过| C
    C -->|4. 任务结果| A
    C -->|5. 行为日志| D
    D -->|6. 异步审计评分| E
    E -->|7. 更新信用/斩杀| G
    G -->|8. 写入分值| F2

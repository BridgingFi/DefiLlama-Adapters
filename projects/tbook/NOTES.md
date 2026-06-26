# TBook rcUSD Vault — DefiLlama TVL adapter 说明

iToken×TBook **L1** 交付:iToken 帮 TBook 把它的 Sui vault 上架 DefiLlama(换分发/联名),纯工程,不改 iToken 产品。

> 本 `NOTES.md` 仅供 BridgingFi/TBook 内部对齐用。**向上游 `DefiLlama/DefiLlama-Adapters` 提 PR 时只提 `index.js`,不要带这个文件。**

## 文件位置
- adapter:`projects/tbook/index.js`
- 协议元信息(名/logo/url/category/chain)由 DefiLlama 团队 / protocols 配置单独加;PR 里请求:**category = RWA 或 Yield**、**chain = Sui**、并打 **doublecounted** 标记(见下)。
- 提 PR 前在 checkout 里跑:`npm i && npm test -- tbook`。

## 链上实参(2026-06-26 经 Sui 主网 RPC 核实)
| | |
|---|---|
| 当前 package | `0x785b8af4bc52d199eedf63f46dd647ea15211fb70300f2fcfdb29c2e96397767` |
| 原始 package(类型里) | `0x9b149fa785d17c7f7d94c6132c21649cc13e73f55e0e8d6bf957f4dc208d22b6` |
| **vault 对象(shared)** | `0x43091ff2385069538025f44301e94ec7a7b09f3edb8a34e3fdb62d067fa5cd16` |
| 类型 | `<pkg>::vault::Vault<USDC, RCUSDP>` |
| USDC | `0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC` |
| rcUSDp | `0x4dea4916aa61f522aca69c4e7265b8e3bdd65d3947f4fb9aaa6d87e0dfac35fd::rcusdp::RCUSDP` |

**写稿时的实时余额**(vault 对象字段):
- `pending_deposit` = 236.68 USDC
- `claim_reserve` = 0 USDC
- `rcusdp_custody` = 354,707.44 rcUSDp
- `pending_redeem_rcusdp` = 0.79 rcUSDp
- `total_shares` = 354,809.48 · `share_price` = 0.99971 → NAV ≈ 354,707(与 custody 对得上)
- **⇒ TVL ≈ $354,944**

`vault_events` 里有多个不同地址存/赎,**真实多用户** → 能过 DefiLlama 的 "single/few-whale, no genuine users" 删除规则。

## 口径(methodology)
adapter 读一次 vault 对象,累加:
- `USDC = pending_deposit + claim_reserve`
- `rcUSDp = rcusdp_custody + pending_redeem_rcusdp`

合约有 `get_tvl` 视图,但直接读对象余额是 DefiLlama 标准、免 gas 的做法,且此处结果与 `get_tvl` 一致。

## 提 PR 时必须跟 reviewer 讲清的两个点
1. **doublecount(重复计数)**:TVL 约 99.9% 是 `rcUSDp`,代表存进 **R25**(已在 DefiLlama)。本 vault 是 R25 的 wrapper,rcUSDp 这条腿会重复计 R25。**协议要标 doublecounted**(adapter 已 `doublecounted: true`);剔除 R25 后的净新增只有那一小笔未结算 USDC。
2. **rcUSDp 定价**:若 DefiLlama 无法给 `rcUSDp` 定价,这条腿不显示,TVL 会塌成只剩 ~$236 USDC。rcUSDp 是 R25 的 ~$1 NAV token(peg 由 `share_price` 0.9997 佐证)。无定价时两条路:
   - 推动把 rcUSDp 接进 DefiLlama 价格库(R25/TBook 协调),**或**
   - 兜底:adapter 里把 rcUSDp 当 $1 stable,直接加到 USDC 键(`api.add(USDC, usdc + rcusdp)`)。仅在 peg 成立时有效,需注明。**优先走真实定价。**

## 这条合作的诚实读数
TBook 的 Sui vault TVL **很薄(~$355k)且几乎全是 R25 的 doublecount**。能上架,但产出的数字不大、也非净新增。**和 TBook 提前压平预期**:adapter 正确可提,但 DefiLlama 上那条线 modest;L1 对 iToken 的价值在**换来的分发/联名**,不在这个 TVL 数字本身。

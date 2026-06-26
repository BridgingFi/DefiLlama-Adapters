const { getObject } = require('../helper/chain/sui')

/*
 * TBook rcUSD Vault (Sui mainnet)
 *
 * Users deposit USDC and receive vault shares; the vault settles deposits into
 * rcUSDp (R25 Protocol) which it holds in custody, and lets users queue redeems
 * back to USDC. TVL = assets the vault contract holds on behalf of depositors:
 *   - USDC awaiting settlement (pending_deposit) + USDC reserved for redemptions (claim_reserve)
 *   - rcUSDp held in custody (rcusdp_custody) + rcUSDp queued for redemption (pending_redeem_rcusdp)
 *
 * On-chain (verified via mainnet RPC):
 *   package (current): 0x785b8af4bc52d199eedf63f46dd647ea15211fb70300f2fcfdb29c2e96397767
 *   vault object:      0x43091ff2385069538025f44301e94ec7a7b09f3edb8a34e3fdb62d067fa5cd16
 *   type: <pkg>::vault::Vault<USDC, RCUSDP>
 *
 * NOTE (doublecount): rcUSDp represents deposits into the R25 Protocol, which is
 * itself tracked on DefiLlama. This vault is therefore a wrapper over R25 — almost
 * all of its value is rcUSDp custody. List this protocol as doublecounted so the
 * rcUSDp leg is not added to ecosystem-wide TVL on top of R25. See NOTES.md.
 */

const VAULT = '0x43091ff2385069538025f44301e94ec7a7b09f3edb8a34e3fdb62d067fa5cd16'
const USDC = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'
const RCUSDP = '0x4dea4916aa61f522aca69c4e7265b8e3bdd65d3947f4fb9aaa6d87e0dfac35fd::rcusdp::RCUSDP'

async function tvl(api) {
  const { fields } = await getObject(VAULT)

  const usdc = BigInt(fields.pending_deposit) + BigInt(fields.claim_reserve)
  const rcusdp = BigInt(fields.rcusdp_custody) + BigInt(fields.pending_redeem_rcusdp)

  api.add(USDC, usdc.toString())
  api.add(RCUSDP, rcusdp.toString())
}

module.exports = {
  timetravel: false,
  doublecounted: true,
  methodology:
    'TVL is the value of assets held by the TBook rcUSD Vault on Sui: USDC pending settlement (pending_deposit) plus USDC reserved for redemptions (claim_reserve), plus the rcUSDp (R25 Protocol shares) held in custody (rcusdp_custody) plus rcUSDp queued for redemption (pending_redeem_rcusdp). Read directly from the vault object 0x43091ff2385069538025f44301e94ec7a7b09f3edb8a34e3fdb62d067fa5cd16. rcUSDp represents deposits into R25, so this protocol is flagged doublecounted.',
  sui: { tvl },
}

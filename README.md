# CarbonReward — Community Environmental Action Platform

> A production-ready Stellar dApp where organizations create environmental campaigns (like tree planting or beach cleanups), participants join and submit proof of work, and supervisors verify it to instantly reward participants with native XLM without middleman fees.

## 🚀 Quick Links
- **Live Platform**: [carbon-reward.vercel.app](https://carbon-reward.vercel.app/)
- **Demo Video**: [Placeholder]
- **Contract Deployment Address**: `CCOBDHZRQKRIMAJRQ3ULVPT6WUQYEHXIW25YIJBWIRKD75AXM3BMMP7P`
- **Example Successful Transaction (Claim Reward)**: [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/d9dfbfb868039e69470fcb1f0dcb85475b9a9f07e848721a18c8889c6e6f3785)
- **User Feedback Form**: [Placeholder]
- **User Feedback Responses**: [Placeholder]

---

## Why this exists

Local communities and environmental organizations often struggle to incentivize direct action. While people want to help clean beaches, plant trees, or maintain trails, volunteer rates remain low because organizations lack a transparent, trustless way to reward participants instantly.

Participants, on the other hand, don't trust promises of future rewards or complex, opaque points systems that take months to cash out.

CarbonReward solves this by natively locking XLM rewards into a smart contract that releases instantly upon verification. Organizations deposit XLM when creating a campaign. Users participate, submit proof of their work, and once the organization supervisor approves it, the user claims their XLM from the smart contract peer-to-peer. It's fast, completely transparent, and provides on-chain verifiable proof of environmental impact.

## How money actually moves

```
   Organization                                      Participant
       │  createCampaign()                              ▲
       ▼                                                │  claimReward()
┌──────────────────────┐                                │ 
│ Stellar Testnet      │  native XLM transfer           │
│ (Soroban Contract)   │                                │
└──────────────────────┘                                │
       │  transaction settles                           │
       └────────────────────────────────────────────────┘
```

- **Organization → Contract**: `createCampaign()` pulls XLM from the organization's Freighter wallet, executing a native Stellar payment operation to lock the funds in the Soroban smart contract.
- **Contract → Participant**: Once the participant's proof is verified by the organization, `claimReward()` allows the participant to pull their exact reward amount directly from the smart contract. 
- Every interaction produces a real `txHash` you can look up on [stellar.expert](https://stellar.expert/explorer/testnet).

## Architecture

```
frontend/   React + Vite + Tailwind CSS — responsive dashboards for orgs and participants
backend/    Node.js + Express + MongoDB — auth, campaign generation, proof verification API
contracts/  Soroban (Rust) — smart contract for holding and distributing XLM
```

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Wallet | Freighter |
| Blockchain | Stellar Testnet |
| Smart Contract | Soroban (Rust) |
| Deployment | Vercel (frontend) + Render (backend) |

## Product Screenshots

### Product UI
- **Dashboard Overview**:
  ![Dashboard Screenshot](./images/placeholder_dashboard.png)
  
### Mobile Responsive Design
- **Mobile View**: Fully responsive across all devices.
  ![Mobile Design](./images/placeholder_mobile.png)

### Analytics Dashboard
- **Live Telemetry**:
  ![Analytics Dashboard](./images/placeholder_analytics.png)

## Users Onboarded

Below is the list of users who actively tested the platform and provided feedback:

| User ID | Name | Email | Wallet Address | Feedback Summary |
|---|---|---|---|---|
| 1 | [Placeholder] | [Placeholder] | `[Placeholder]` | [Placeholder] |

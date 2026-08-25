# User Feedback Summary

## Overview
We collected feedback from 11 real users who beta tested the platform (9 Participants and 2 Organizations). Below is a synthesized summary of the feedback we received, categorized into key themes to guide our product roadmap.

## Key Themes & Takeaways

### 1. User Experience (UX) & Feedback Mechanisms
Several users highlighted the need for better system feedback during asynchronous actions:
- **Loading States**: Users requested loading spinners during image uploads to know the system is processing their request.
- **Action Feedback**: Adding a rejection reason text box was highly requested by organizations so they can explain to users why their proof was denied.
- **State Prevention**: Users double-clicked the 'Claim' button because of blockchain latency, suggesting we disable buttons during pending transactions.

### 2. Wallet & Web3 Onboarding
For many users, this was their first interaction with a Web3 dApp, leading to some friction:
- **Connection Issues**: The Freighter wallet disconnected on page refresh, requiring a more graceful connection persistence.
- **Gas Fees**: Participants experienced errors when trying to claim with a zero-balance wallet, indicating a need for a Faucet link or gasless transactions.
- **Crypto Literacy**: Some users didn't understand the USD value of XLM, suggesting a fiat-equivalent tooltip would improve the experience.

### 3. Platform Features & Enhancements
Users suggested new features to make the platform more engaging and efficient:
- **Organization Efficiency**: Organizations requested a batch-approval feature to quickly process dozens of submissions.
- **Campaign Clarity**: Showing a "Full" badge on campaigns that have reached capacity would save users from clicking into unavailable campaigns.
- **Discovery**: Adding category filters (e.g., Tree Planting, Recycling) would make browsing for campaigns much easier.
- **Gamification**: Participants want a dashboard to track their total lifetime environmental impact and rewards earned.

### 4. Smart Contract Mechanics
- **Refunds**: If a campaign ends early with fewer participants than expected, the leftover XLM currently gets stuck. A mechanism to return unallocated funds to the organization is needed.

---

## Action Plan
Based on this feedback, we have already implemented several quick-win UX improvements (such as the Faucet link, Full badges, and rejection reasons) which can be viewed in our `README.md` implementation table. The larger feature requests (like batch approvals and contract refunds) have been added to our backlog for Level 5.

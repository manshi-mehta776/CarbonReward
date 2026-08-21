export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">About CarbonReward</h1>
      <p className="mb-4 text-slate-600 dark:text-slate-300">
        CarbonReward is a decentralized platform that lets schools, universities, NGOs, municipalities
        and CSR programs run environmental campaigns — tree plantations, river cleanups, plastic collection
        drives and more — with supervisor-verified, blockchain-backed incentives.
      </p>
      <p className="text-slate-600 dark:text-slate-300">
        Built on Stellar using Soroban smart contracts, every verification and reward claim is recorded
        immutably, giving sponsors and organizations full transparency into how funds are distributed.
      </p>
    </div>
  );
}

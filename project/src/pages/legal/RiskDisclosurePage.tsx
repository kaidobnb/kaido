import React from 'react';
import Card from '../../components/ui/Card';

const RiskDisclosurePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Risk Disclosure</h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300">
              Last Updated: May 1, 2025
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">1. Introduction</h2>
            <p className="text-white">
              This Risk Disclosure statement is provided by Kaido.ai ("we," "our," or "us") to inform you of the
              risks associated with using our prediction market platform. Before using our services, you should carefully
              consider the risks described below.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">2. Cryptocurrency Risks</h2>
            <p className="text-white">
              <strong>Volatility:</strong> Cryptocurrencies, including BNB and KAIDO tokens, are highly volatile. The value
              of these assets can fluctuate significantly over short periods, which may result in substantial losses.
            </p>
            <p className="text-slate-300">
              <strong>Liquidity Risk:</strong> There may be times when it is difficult or impossible to liquidate a position.
              This can occur when there is insufficient trading activity or during market disruptions.
            </p>
            <p className="text-slate-300">
              <strong>Market Risk:</strong> The cryptocurrency market is relatively new and may be subject to manipulation
              or fraud. Market conditions can change rapidly and unpredictably.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">3. Blockchain and Technical Risks</h2>
            <p className="text-slate-300">
              <strong>Network Failures:</strong> Blockchain networks, including BNB Smart Chain, may experience delays, congestion,
              or complete failure. This could prevent transactions from being processed or confirmed in a timely manner.
            </p>
            <p className="text-slate-300">
              <strong>Smart Contract Risks:</strong> Our platform uses smart contracts, which may contain bugs, vulnerabilities,
              or other issues that could result in the loss of funds or other unexpected behavior.
            </p>
            <p className="text-slate-300">
              <strong>Wallet Security:</strong> If you lose access to your wallet or your private keys, you may permanently
              lose access to your assets. We cannot recover or reset your private keys or passwords.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">4. Prediction Market Risks</h2>
            <p className="text-slate-300">
              <strong>Outcome Uncertainty:</strong> Prediction markets involve uncertainty about future events. Even well-informed
              predictions can be incorrect due to unforeseen circumstances or changes in conditions.
            </p>
            <p className="text-slate-300">
              <strong>Market Manipulation:</strong> Participants may attempt to manipulate markets by spreading false information
              or engaging in deceptive trading practices.
            </p>
            <p className="text-slate-300">
              <strong>Resolution Disputes:</strong> There may be disagreements about the outcome of events or how markets should
              be resolved. Our resolution process is final, but may not always align with your interpretation of events.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">5. Regulatory and Legal Risks</h2>
            <p className="text-slate-300">
              <strong>Regulatory Changes:</strong> The regulatory environment for cryptocurrencies and prediction markets is
              evolving. Changes in laws or regulations may adversely affect our platform or your ability to use it.
            </p>
            <p className="text-slate-300">
              <strong>Jurisdictional Restrictions:</strong> The use of our platform may be restricted or prohibited in certain
              jurisdictions. Our platform is not available to users located in the United States due to regulatory considerations.
              It is your responsibility to comply with the laws and regulations in your jurisdiction.
            </p>
            <p className="text-slate-300">
              <strong>Tax Implications:</strong> Using our platform may have tax consequences. It is your responsibility to
              determine what taxes, if any, apply to your transactions and to report and remit the correct tax to the appropriate
              tax authority.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">6. AI-Related Risks</h2>
            <p className="text-slate-300">
              <strong>AI Limitations:</strong> Our platform uses artificial intelligence to generate and analyze predictions.
              AI systems have limitations and may produce inaccurate or biased results.
            </p>
            <p className="text-slate-300">
              <strong>Dependency on Data:</strong> AI systems depend on the quality and quantity of data they are trained on.
              Incomplete or biased data may lead to suboptimal predictions.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">7. Risk of Loss</h2>
            <p className="text-slate-300">
              You should only commit funds that you can afford to lose. Past performance is not indicative of future results.
              No prediction or forecasting system, including those using AI, can guarantee accurate results.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">8. Conclusion</h2>
            <p className="text-slate-300">
              By using our platform, you acknowledge that you have read and understood this Risk Disclosure statement and accept
              the risks involved. If you do not understand or are not willing to accept these risks, you should not use our platform.
            </p>
            <p className="text-slate-300">
              This Risk Disclosure statement is not exhaustive and does not disclose all the risks associated with using our platform.
              You should carefully consider whether using our platform is suitable for you in light of your circumstances and financial
              resources.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">9. Contact Information</h2>
            <p className="text-white">
              If you have any questions about this Risk Disclosure statement, please contact us at risk@kaido.ai.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RiskDisclosurePage;

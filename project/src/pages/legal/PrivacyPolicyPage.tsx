import React from 'react';
import Card from '../../components/ui/Card';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300">
              Last Updated: May 1, 2025
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">1. Introduction</h2>
            <p className="text-slate-300">
              At Kaido.ai ("we," "our," or "us"), we respect your privacy and are committed to protecting your
              personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our website, mobile application, or any of our services.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">2. Information We Collect</h2>
            <p className="text-slate-300">
              We may collect the following types of information:
            </p>
            <ul className="list-disc pl-6 text-slate-300 mb-4">
              <li><strong>Personal Information:</strong> Such as your name, email address, wallet address, and profile information.</li>
              <li><strong>Transaction Information:</strong> Information about your transactions on our platform, including prediction market participation.</li>
              <li><strong>Usage Information:</strong> Information about how you use our services, including log data, device information, and analytics data.</li>
              <li><strong>Communication Information:</strong> Records of your communications with us.</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-300">
              We may use your information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-slate-300 mb-4">
              <li>To provide, maintain, and improve our services</li>
              <li>To process transactions and manage your account</li>
              <li>To communicate with you about our services, updates, and promotions</li>
              <li>To personalize your experience and provide content and features that match your profile and interests</li>
              <li>To monitor and analyze usage patterns and trends</li>
              <li>To detect, prevent, and address technical issues, fraud, or illegal activities</li>
              <li>To comply with legal obligations</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">4. How We Share Your Information</h2>
            <p className="text-slate-300">
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-slate-300 mb-4">
              <li><strong>With Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf.</li>
              <li><strong>For Legal Reasons:</strong> We may share your information if we believe it is necessary to comply with a legal obligation, protect our rights or the rights of others, or prevent fraud or illegal activities.</li>
              <li><strong>With Your Consent:</strong> We may share your information with your consent or at your direction.</li>
              <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">5. Blockchain Transactions</h2>
            <p className="text-slate-300">
              Please note that transactions on the BNB Smart Chain blockchain are public and contain your wallet address and
              transaction details. This information is not controlled by us and is available to anyone who participates
              in the blockchain.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">6. Your Rights and Choices</h2>
            <p className="text-slate-300">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-slate-300 mb-4">
              <li>The right to access and receive a copy of your personal information</li>
              <li>The right to correct or update your personal information</li>
              <li>The right to request deletion of your personal information</li>
              <li>The right to restrict or object to the processing of your personal information</li>
              <li>The right to data portability</li>
            </ul>
            <p className="text-slate-300">
              To exercise these rights, please contact us at privacy@kaido.ai.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">7. Data Security</h2>
            <p className="text-slate-300">
              We implement appropriate technical and organizational measures to protect your personal information. 
              However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot 
              guarantee absolute security.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">8. Children's Privacy</h2>
            <p className="text-slate-300">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal 
              information from children under 18. If we learn that we have collected personal information from a child 
              under 18, we will take steps to delete that information.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">9. International Transfers</h2>
            <p className="text-slate-300">
              Your information may be transferred to, stored, and processed in countries other than the country in which 
              you reside. By using our services, you consent to the transfer of your information to countries that may 
              have different data protection laws than your country.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-slate-300">
              We may update this Privacy Policy from time to time. If we make material changes, we will provide notice 
              through our services or by other means. Your continued use of our services after the changes take effect 
              constitutes your acceptance of the modified Privacy Policy.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">11. Contact Information</h2>
            <p className="text-slate-300">
              If you have any questions about this Privacy Policy, please contact us at privacy@kaidobnb.xyz.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;

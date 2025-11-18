import React from 'react';
import Card from '../../components/ui/Card';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300">
              Last Updated: May 1, 2025
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">1. Introduction</h2>
            <p className="text-slate-300">
              Welcome to Kaido.ai ("we," "our," or "us"). By accessing or using our website, mobile application,
              or any of our services, you agree to be bound by these Terms of Service. Please read these terms carefully.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">2. Eligibility</h2>
            <p className="text-slate-300">
              You must be at least 18 years old to use our services. By using our services, you represent and warrant
              that you are at least 18 years old and have the legal capacity to enter into these terms. If you are
              using our services on behalf of an entity, you represent and warrant that you have the authority to bind
              that entity to these terms.
            </p>
            <p className="text-slate-300">
              <strong>Geographic Restrictions:</strong> Our services are not available to users located in the United States
              due to regulatory considerations. By using our services, you represent and warrant that you are not
              accessing or using our platform from the United States or any other jurisdiction where such access or
              use would be illegal or prohibited.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">3. Account Registration</h2>
            <p className="text-slate-300">
              To access certain features of our services, you may need to register for an account. You agree to provide
              accurate, current, and complete information during the registration process and to update such information
              to keep it accurate, current, and complete. You are responsible for safeguarding your account credentials
              and for all activities that occur under your account.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">4. Prediction Markets</h2>
            <p className="text-slate-300">
              Kaido.ai provides a platform for prediction markets on the BNB Smart Chain. Users can create,
              participate in, and resolve prediction markets using our services. All transactions are executed on the
              BNB Smart Chain and are subject to network fees and conditions.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">5. User Conduct</h2>
            <p className="text-slate-300">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-slate-300 mb-4">
              <li>Use our services for any illegal purpose or in violation of any local, state, national, or international law</li>
              <li>Violate or encourage others to violate the rights of third parties, including intellectual property rights</li>
              <li>Engage in any activity that could harm, disable, overburden, or impair our services</li>
              <li>Attempt to gain unauthorized access to our services or systems</li>
              <li>Use our services to manipulate markets or engage in fraudulent activities</li>
              <li>Create prediction markets that involve illegal activities, hate speech, or harmful content</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">6. Intellectual Property</h2>
            <p className="text-slate-300">
              Our services and all content and materials included on our services, including but not limited to text,
              graphics, logos, button icons, images, audio clips, digital downloads, data compilations, and software,
              are the property of Kaido.ai or our licensors and are protected by copyright, trademark, and other
              intellectual property laws.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">7. Disclaimers</h2>
            <p className="text-slate-300">
              Our services are provided "as is" and "as available" without any warranties of any kind, either express
              or implied. We do not guarantee that our services will be uninterrupted, secure, or error-free. We are
              not responsible for the accuracy, reliability, or availability of any information or content provided
              through our services.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">8. Limitation of Liability</h2>
            <p className="text-slate-300">
              To the maximum extent permitted by law, Kaido.ai and its affiliates, officers, directors, employees,
              and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages,
              including but not limited to loss of profits, data, use, or goodwill, arising out of or in connection with
              these terms or your use of our services.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">9. Indemnification</h2>
            <p className="text-slate-300">
              You agree to indemnify, defend, and hold harmless Kaido.ai and its affiliates, officers, directors,
              employees, and agents from and against any and all claims, liabilities, damages, losses, costs, expenses,
              or fees (including reasonable attorneys' fees) that arise from or relate to your use of our services or
              violation of these terms.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">10. Modifications</h2>
            <p className="text-slate-300">
              We reserve the right to modify these terms at any time. If we make material changes to these terms, we
              will provide notice through our services or by other means. Your continued use of our services after the
              changes take effect constitutes your acceptance of the modified terms.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">11. Governing Law</h2>
            <p className="text-slate-300">
              These terms and your use of our services shall be governed by and construed in accordance with the laws
              of the jurisdiction in which Kaido.ai is established, without regard to its conflict of law provisions.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6 mb-4">12. Contact Information</h2>
            <p className="text-slate-300">
              If you have any questions about these terms, please contact us at legal@kaido.ai.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TermsOfServicePage;

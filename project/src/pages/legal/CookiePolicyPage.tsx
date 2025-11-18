import React from 'react';
import Card from '../../components/ui/Card';

const CookiePolicyPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Cookie Policy</h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300">
              Last Updated: May 1, 2025
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">1. Introduction</h2>
            <p className="text-white">
              This Cookie Policy explains how Kaido.ai ("we," "our," or "us") uses cookies and similar technologies
              on our website and mobile application. By using our services, you consent to the use of cookies as described 
              in this policy.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">2. What Are Cookies?</h2>
            <p className="text-slate-300">
              Cookies are small text files that are stored on your device when you visit a website. They are widely used 
              to make websites work more efficiently and provide information to the website owners. Cookies can be "session 
              cookies" (which expire when you close your browser) or "persistent cookies" (which remain on your device for 
              a set period or until you delete them).
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">3. Types of Cookies We Use</h2>
            <p className="text-slate-300">
              We use the following types of cookies:
            </p>
            <ul className="list-disc pl-6 text-slate-300 mb-4">
              <li><strong>Essential Cookies:</strong> These cookies are necessary for our services to function properly. They enable core functionality such as security, network management, and account access. You cannot opt out of these cookies.</li>
              <li><strong>Preference Cookies:</strong> These cookies allow us to remember choices you make and provide enhanced, personalized features. They may be set by us or by third-party providers whose services we have added to our pages.</li>
              <li><strong>Analytics Cookies:</strong> These cookies help us understand how visitors interact with our services by collecting and reporting information anonymously. They help us improve our services and user experience.</li>
              <li><strong>Marketing Cookies:</strong> These cookies are used to track visitors across websites. They are used to display ads that are relevant and engaging for individual users.</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">4. Third-Party Cookies</h2>
            <p className="text-slate-300">
              We may allow third parties to place cookies on your device when you use our services. These third parties 
              may include analytics providers, advertising networks, and social media platforms. These third parties may 
              use cookies, web beacons, and similar technologies to collect information about your use of our services 
              and other websites.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">5. How We Use Cookies</h2>
            <p className="text-slate-300">
              We use cookies for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-slate-300 mb-4">
              <li>To authenticate users and prevent fraudulent use of user accounts</li>
              <li>To remember information about your preferences and settings</li>
              <li>To understand how you use our services and improve them</li>
              <li>To provide personalized content and advertising</li>
              <li>To measure the effectiveness of our marketing campaigns</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">6. Your Cookie Choices</h2>
            <p className="text-slate-300">
              Most web browsers allow you to control cookies through their settings. You can typically find these settings 
              in the "options" or "preferences" menu of your browser. You can also delete cookies that have already been 
              set and block new cookies from being set.
            </p>
            <p className="text-slate-300">
              Please note that if you choose to block or delete cookies, you may not be able to access certain features 
              of our services, and your user experience may be limited.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">7. Similar Technologies</h2>
            <p className="text-slate-300">
              In addition to cookies, we may use other similar technologies, such as:
            </p>
            <ul className="list-disc pl-6 text-slate-300 mb-4">
              <li><strong>Web Beacons:</strong> Small graphic images that allow us to monitor user behavior and track page visits.</li>
              <li><strong>Local Storage:</strong> A type of web storage that allows websites to store data locally on your device.</li>
              <li><strong>Pixels:</strong> Small code snippets that allow us to track user behavior and conversions.</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">8. Updates to This Cookie Policy</h2>
            <p className="text-slate-300">
              We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our 
              business practices. If we make material changes, we will provide notice through our services or by other 
              means. Your continued use of our services after the changes take effect constitutes your acceptance of 
              the modified Cookie Policy.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6 mb-4">9. Contact Information</h2>
            <p className="text-slate-300">
              If you have any questions about this Cookie Policy, please contact us at privacy@kaido.ai.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookiePolicyPage;

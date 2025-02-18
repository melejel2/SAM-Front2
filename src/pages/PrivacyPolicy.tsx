import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-6">
        Last Updated: Thursday, 22 August 2024
      </p>
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p>
            Welcome to Purchasing Administrative Management (SAM). This Privacy
            Policy explains how we collect, use, and share information when you
            use our app ("App"). We are committed to protecting your privacy and
            ensuring that your personal information is handled responsibly.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
              <strong>Personal Information:</strong> We collect information you
              provide directly, such as your name, email address, phone number,
              and billing/shipping address when you create an account or
              interact with our support team.
            </li>
            <li>
              <strong>Account Information:</strong> Details related to your
              account, including order history, procurement details, site data,
              and preferences.
            </li>
            <li>
              <strong>Device Information:</strong> Data about the device you use
              to access the App, such as device type, operating system, unique
              identifiers, and network information.
            </li>
            <li>
              <strong>Usage Data:</strong> We may collect information about your
              interactions with the App, including requisitions, purchase
              orders, deliveries, and stock management activities.
            </li>
            <li>
              <strong>Support Chat Data:</strong> Content from your interactions
              with our support team for troubleshooting and service improvement
              purposes.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
              To provide, maintain, and improve the App’s core functionality,
              including requisition processing, stock management, and purchase
              orders.
            </li>
            <li>
              To customize your experience by showing relevant features and
              options based on your activity.
            </li>
            <li>
              To communicate with you about orders, delivery statuses, and
              procurement-related activities.
            </li>
            <li>
              To monitor usage trends and analyze how users engage with the App
              to improve functionality.
            </li>
            <li>
              To ensure security and compliance with applicable legal
              obligations.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">4. Sharing Your Information</h2>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
              <strong>Service Providers:</strong> We may share your information
              with third-party service providers assisting us with App
              operations, data storage, or order processing, under strict
              confidentiality agreements.
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose your
              information if required by law or in response to legal requests.
            </li>
            <li>
              <strong>Business Transfers:</strong> In the case of a business
              transaction such as a merger, your information may be transferred.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">5. Your Choices</h2>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
              <strong>Access and Update:</strong> You can review and update your
              account information within the App.
            </li>
            <li>
              <strong>Opt-Out:</strong> You can opt out of receiving marketing
              communications by following instructions in emails or contacting
              support.
            </li>
            <li>
              <strong>Account Deletion:</strong> You can request deletion of
              your account by contacting us. Certain information may be retained
              for operational or legal purposes.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">6. Security</h2>
          <p>
            We implement appropriate security measures to protect your data.
            However, no system is completely secure, so please be mindful of the
            information you share.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">7. Children’s Privacy</h2>
          <p>
            The App is not intended for children under 13, and we do not
            knowingly collect information from children under 13. If we become
            aware of such data, it will be deleted promptly.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">
            8. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this policy periodically. Changes will be posted on
            this page with the "Last Updated" date revised accordingly. Please
            check for updates.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">9. Contact Us</h2>
          <p>
            If you have any questions or concerns regarding this policy, please
            contact us at:
          </p>
          <a href="mailto:support@karamentreprises.com">
            Email: support@karamentreprises.com
          </a>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

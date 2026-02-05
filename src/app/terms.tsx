// FamilyForge Terms of Service Page
// Web-only legal page with parent-friendly language

import { View, Text, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  FileText,
  Check,
  AlertCircle,
  Ban,
  Scale,
  RefreshCw,
  MessageCircle,
} from "lucide-react-native";

export default function TermsPage() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0a1f" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: isWide ? 80 : 24,
          paddingVertical: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 32,
            alignSelf: "flex-start",
          }}
        >
          <ArrowLeft size={20} color="#8b5cf6" />
          <Text style={{ color: "#8b5cf6", fontSize: 15, fontWeight: "600" }}>
            Back
          </Text>
        </Pressable>

        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: "rgba(139, 92, 246, 0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <FileText size={32} color="#8b5cf6" />
          </View>
          <Text
            style={{
              color: "#ffffff",
              fontSize: isWide ? 40 : 32,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Terms of Service
          </Text>
          <Text style={{ color: "#64748b", fontSize: 14 }}>
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* Content Container */}
        <View style={{ maxWidth: 800, alignSelf: "center", width: "100%" }}>
          {/* Introduction */}
          <View
            style={{
              backgroundColor: "rgba(139, 92, 246, 0.1)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 32,
              borderLeftWidth: 4,
              borderLeftColor: "#8b5cf6",
            }}
          >
            <Text
              style={{
                color: "#e2e8f0",
                fontSize: 16,
                lineHeight: 26,
              }}
            >
              Welcome to FamilyForge! These terms govern your use of our app and
              services. We've tried to keep this document readable and
              fair—because we believe legal agreements shouldn't require a law
              degree to understand.
            </Text>
          </View>

          {/* Section: Agreement */}
          <Section
            icon={Check}
            title="Acceptance of Terms"
            content={`By downloading, installing, or using FamilyForge, you agree to these Terms of Service and our Privacy Policy. If you're creating an account on behalf of a family or household, you confirm you have the authority to bind all family members to these terms.

If you disagree with any part of these terms, please do not use our service. We want you here, but only if you're comfortable with how we operate.`}
          />

          {/* Section: The Service */}
          <Section
            icon={AlertCircle}
            title="What FamilyForge Provides"
            content={`FamilyForge is a family management platform that helps parents:

• Create and manage child profiles
• Assign tasks, routines, and learning activities
• Track progress and reward achievements
• Coordinate with co-parents and caregivers
• Receive reports and notifications

We strive to keep the service available and reliable, but we can't guarantee uninterrupted access. Maintenance, updates, and unforeseen issues may occasionally affect availability.`}
          />

          {/* Section: Your Account */}
          <View style={{ marginBottom: 40 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "rgba(139, 92, 246, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertCircle size={22} color="#8b5cf6" />
              </View>
              <Text
                style={{ color: "#ffffff", fontSize: 22, fontWeight: "700" }}
              >
                Your Account Responsibilities
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {[
                "Provide accurate information when creating your account",
                "Keep your password secure and confidential",
                "Notify us immediately if you suspect unauthorized access",
                "Be responsible for all activity under your account",
                "Ensure children using the app do so with appropriate supervision",
              ].map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                    backgroundColor: "rgba(30, 25, 50, 0.4)",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <Check size={18} color="#4ade80" style={{ marginTop: 2 }} />
                  <Text
                    style={{
                      color: "#cbd5e1",
                      fontSize: 15,
                      lineHeight: 24,
                      flex: 1,
                    }}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Section: Prohibited Uses */}
          <View style={{ marginBottom: 40 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ban size={22} color="#ef4444" />
              </View>
              <Text
                style={{ color: "#ffffff", fontSize: 22, fontWeight: "700" }}
              >
                What You Cannot Do
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {[
                "Share your account credentials with others",
                "Use the service for any illegal or harmful purpose",
                "Attempt to access other users' accounts or data",
                "Reverse engineer or copy our software",
                "Upload malicious content or attempt to disrupt the service",
                "Use automated systems to access the service without permission",
                "Violate the privacy or rights of other users",
              ].map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    borderRadius: 12,
                    padding: 16,
                    borderLeftWidth: 3,
                    borderLeftColor: "rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <Ban size={18} color="#ef4444" style={{ marginTop: 2 }} />
                  <Text
                    style={{
                      color: "#cbd5e1",
                      fontSize: 15,
                      lineHeight: 24,
                      flex: 1,
                    }}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Section: Content */}
          <Section
            icon={FileText}
            title="Your Content"
            content={`You retain ownership of all content you create in FamilyForge—child profiles, tasks, notes, and any other data you add.

By using the service, you grant us a limited license to store, process, and display your content solely to provide the service to you. We will never sell your content or use it for advertising.

You are responsible for ensuring any content you upload doesn't violate laws or rights of others. We reserve the right to remove content that violates these terms.`}
          />

          {/* Section: Subscriptions */}
          <Section
            icon={RefreshCw}
            title="Subscriptions & Payment"
            content={`FamilyForge may offer free and premium subscription tiers. If you subscribe to a paid plan:

• Payment is charged at the start of each billing period
• Subscriptions auto-renew unless you cancel before the renewal date
• You can cancel anytime through your app store account settings
• Refunds are handled according to the policies of Apple App Store or Google Play Store
• We may change prices with 30 days notice before your next billing cycle

We reserve the right to modify or discontinue features, though we'll try to give reasonable notice for significant changes.`}
          />

          {/* Section: Termination */}
          <Section
            icon={AlertCircle}
            title="Account Termination"
            content={`You can delete your account at any time through the app settings. Upon deletion, we will remove your personal data as described in our Privacy Policy.

We may suspend or terminate accounts that violate these terms, engage in abusive behavior, or pose risks to other users. We'll provide notice when possible, but may act immediately for serious violations.`}
          />

          {/* Section: Disclaimers */}
          <View style={{ marginBottom: 40 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "rgba(234, 179, 8, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Scale size={22} color="#eab308" />
              </View>
              <Text
                style={{ color: "#ffffff", fontSize: 22, fontWeight: "700" }}
              >
                Disclaimers & Limitations
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(234, 179, 8, 0.05)",
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(234, 179, 8, 0.2)",
              }}
            >
              <Text
                style={{
                  color: "#cbd5e1",
                  fontSize: 15,
                  lineHeight: 26,
                }}
              >
                FamilyForge is provided "as is" without warranties of any kind.
                While we work hard to maintain reliability and security, we
                cannot guarantee the service will be error-free or
                uninterrupted.
                {"\n\n"}
                FamilyForge is a tool to assist with family management, not a
                substitute for parental judgment, professional advice, or
                supervision. We are not responsible for any outcomes resulting
                from how you use the app.
                {"\n\n"}
                To the maximum extent permitted by law, our liability is limited
                to the amount you've paid us in the past 12 months.
              </Text>
            </View>
          </View>

          {/* Section: Changes */}
          <Section
            icon={RefreshCw}
            title="Changes to These Terms"
            content={`We may update these terms as our service evolves. For significant changes, we'll notify you via email or in-app notification at least 30 days before they take effect.

Continued use of FamilyForge after changes take effect constitutes acceptance of the updated terms. If you disagree with any changes, you should stop using the service and delete your account.`}
          />

          {/* Section: Governing Law */}
          <Section
            icon={Scale}
            title="Governing Law"
            content={`These terms are governed by the laws of the jurisdiction where FamilyForge operates. Any disputes will be resolved through binding arbitration or in the courts of that jurisdiction, except where prohibited by local law.

Nothing in these terms affects your statutory rights as a consumer that cannot be waived or limited by contract.`}
          />

          {/* Contact Section */}
          <View
            style={{
              backgroundColor: "rgba(30, 25, 50, 0.5)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 40,
              borderWidth: 1,
              borderColor: "rgba(139, 92, 246, 0.2)",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <MessageCircle size={24} color="#8b5cf6" />
              <Text
                style={{ color: "#ffffff", fontSize: 20, fontWeight: "700" }}
              >
                Questions?
              </Text>
            </View>
            <Text
              style={{
                color: "#cbd5e1",
                fontSize: 15,
                lineHeight: 26,
              }}
            >
              We're happy to clarify anything in these terms.
              {"\n\n"}
              Email:{" "}
              <Text style={{ color: "#8b5cf6" }}>legal@familyforge.app</Text>
              {"\n\n"}
              We believe in fair, transparent terms and are always open to
              feedback.
            </Text>
          </View>

          {/* Acknowledgment */}
          <View
            style={{
              alignItems: "center",
              padding: 24,
              marginBottom: 40,
            }}
          >
            <Text
              style={{
                color: "#64748b",
                fontSize: 14,
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              By using FamilyForge, you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Service.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Section Component
function Section({
  icon: Icon,
  title,
  content,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  content: string;
}) {
  return (
    <View style={{ marginBottom: 40 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: "rgba(139, 92, 246, 0.15)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={22} color="#8b5cf6" />
        </View>
        <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "700" }}>
          {title}
        </Text>
      </View>
      <Text
        style={{
          color: "#cbd5e1",
          fontSize: 15,
          lineHeight: 26,
        }}
      >
        {content}
      </Text>
    </View>
  );
}

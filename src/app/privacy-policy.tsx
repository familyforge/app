// FamilyForge Privacy Policy Page
// Web-only legal page with parent-friendly language

import { View, Text, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Shield, Lock, Eye, UserCheck, Trash2, Mail } from "lucide-react-native";

export default function PrivacyPolicyPage() {
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
            <Shield size={32} color="#8b5cf6" />
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
            Privacy Policy
          </Text>
          <Text style={{ color: "#64748b", fontSize: 14 }}>
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
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
              At FamilyForge, we understand that your family's privacy is
              precious. This policy explains in plain language how we collect,
              use, and protect your data. We've designed our app with families in
              mind, and that means treating your information with the care it
              deserves.
            </Text>
          </View>

          {/* Section: What We Collect */}
          <Section
            icon={Eye}
            title="What We Collect"
            items={[
              {
                title: "Account Information",
                description:
                  "Email address, name, and parenting role (mother/father) to personalize your experience.",
              },
              {
                title: "Family Data",
                description:
                  "Child profiles (names, ages, avatars), tasks, routines, rewards, and learning assignments you create.",
              },
              {
                title: "Usage Data",
                description:
                  "How you interact with the app to help us improve features and fix issues.",
              },
              {
                title: "Device Information",
                description:
                  "Device type and operating system for technical support and compatibility.",
              },
            ]}
          />

          {/* Section: How We Use It */}
          <Section
            icon={UserCheck}
            title="How We Use Your Data"
            items={[
              {
                title: "To Provide the Service",
                description:
                  "Manage your family's tasks, track progress, and send helpful reminders.",
              },
              {
                title: "To Personalize",
                description:
                  "Customize content, suggestions, and reports based on your family's needs.",
              },
              {
                title: "To Communicate",
                description:
                  "Send essential notifications, weekly reports, and occasional updates (which you can control).",
              },
              {
                title: "To Improve",
                description:
                  "Analyze anonymous patterns to make FamilyForge better for all families.",
              },
            ]}
          />

          {/* Section: How We Protect It */}
          <Section
            icon={Lock}
            title="How We Protect Your Data"
            items={[
              {
                title: "Encryption",
                description:
                  "All data is encrypted in transit (HTTPS) and at rest using industry-standard protocols.",
              },
              {
                title: "Secure Infrastructure",
                description:
                  "We use trusted cloud providers with SOC 2 compliance and regular security audits.",
              },
              {
                title: "Access Controls",
                description:
                  "Only authorized team members can access user data, and only when necessary.",
              },
              {
                title: "No Selling",
                description:
                  "We never sell your personal information to third parties. Ever.",
              },
            ]}
          />

          {/* Section: Your Rights */}
          <Section
            icon={Trash2}
            title="Your Rights & Control"
            items={[
              {
                title: "Access Your Data",
                description:
                  "Request a copy of all data we have about you and your family.",
              },
              {
                title: "Correct Inaccuracies",
                description:
                  "Update or fix any incorrect information in your account.",
              },
              {
                title: "Delete Everything",
                description:
                  "Request complete deletion of your account and all associated data.",
              },
              {
                title: "Export Your Data",
                description:
                  "Download your data in a portable format (GDPR-compliant).",
              },
              {
                title: "Opt Out",
                description:
                  "Control which emails and notifications you receive, including marketing.",
              },
            ]}
          />

          {/* Section: Children's Privacy */}
          <View style={{ marginBottom: 40 }}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 22,
                fontWeight: "700",
                marginBottom: 16,
              }}
            >
              Children's Privacy
            </Text>
            <Text
              style={{
                color: "#cbd5e1",
                fontSize: 15,
                lineHeight: 26,
              }}
            >
              FamilyForge is designed for parents to manage their family. We do
              not knowingly collect personal information directly from children
              under 13. Child profiles are created and managed by parents, and
              children's data is only accessible to authorized family members.
              {"\n\n"}
              If you believe we have inadvertently collected data from a child
              without parental consent, please contact us immediately and we
              will delete it.
            </Text>
          </View>

          {/* Section: Third Parties */}
          <View style={{ marginBottom: 40 }}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 22,
                fontWeight: "700",
                marginBottom: 16,
              }}
            >
              Third-Party Services
            </Text>
            <Text
              style={{
                color: "#cbd5e1",
                fontSize: 15,
                lineHeight: 26,
              }}
            >
              We use trusted third-party services for:
            </Text>
            <View style={{ marginTop: 16, gap: 12 }}>
              {[
                "Authentication (secure login)",
                "Cloud storage (data hosting)",
                "Email delivery (notifications)",
                "Analytics (anonymous usage patterns)",
              ].map((item, index) => (
                <View
                  key={index}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#8b5cf6",
                    }}
                  />
                  <Text style={{ color: "#94a3b8", fontSize: 15 }}>{item}</Text>
                </View>
              ))}
            </View>
            <Text
              style={{
                color: "#cbd5e1",
                fontSize: 15,
                lineHeight: 26,
                marginTop: 16,
              }}
            >
              These partners are contractually required to protect your data and
              only use it for the services we've specified.
            </Text>
          </View>

          {/* Section: Cookies */}
          <View style={{ marginBottom: 40 }}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 22,
                fontWeight: "700",
                marginBottom: 16,
              }}
            >
              Cookies & Tracking
            </Text>
            <Text
              style={{
                color: "#cbd5e1",
                fontSize: 15,
                lineHeight: 26,
              }}
            >
              Our mobile apps do not use cookies. On our website, we use
              essential cookies for login functionality and optional analytics
              cookies to understand how visitors use our site. You can disable
              non-essential cookies through your browser settings.
            </Text>
          </View>

          {/* Section: Updates */}
          <View style={{ marginBottom: 40 }}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 22,
                fontWeight: "700",
                marginBottom: 16,
              }}
            >
              Policy Updates
            </Text>
            <Text
              style={{
                color: "#cbd5e1",
                fontSize: 15,
                lineHeight: 26,
              }}
            >
              We may update this Privacy Policy as our practices evolve. For
              significant changes, we'll notify you via email or in-app
              notification before they take effect. Continued use of FamilyForge
              after changes constitutes acceptance of the updated policy.
            </Text>
          </View>

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
              <Mail size={24} color="#8b5cf6" />
              <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: "700" }}>
                Contact Us
              </Text>
            </View>
            <Text
              style={{
                color: "#cbd5e1",
                fontSize: 15,
                lineHeight: 26,
              }}
            >
              Have questions about your privacy? We're here to help.
              {"\n\n"}
              Email:{" "}
              <Text style={{ color: "#8b5cf6" }}>privacy@familyforge.app</Text>
              {"\n\n"}
              We aim to respond to all privacy inquiries within 48 hours.
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
  items,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  items: Array<{ title: string; description: string }>;
}) {
  return (
    <View style={{ marginBottom: 40 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
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

      <View style={{ gap: 16 }}>
        {items.map((item, index) => (
          <View
            key={index}
            style={{
              backgroundColor: "rgba(30, 25, 50, 0.4)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text
              style={{
                color: "#e2e8f0",
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 6,
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                color: "#94a3b8",
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              {item.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

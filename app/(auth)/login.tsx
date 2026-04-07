import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import SafeScreenWrapper from "@/common/components/SafeScreenWrapper";
import AuthInput from "@/common/components/AuthInput";
import AuthButton from "@/common/components/AuthButton";
import { useLogin } from "@/modules/auth/hooks/useLogin";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { Colors } from "@/common/constants/colors";
import { isLoginFieldError } from "@/modules/auth/errors/LoginFieldError";

const loginIcon = require("@/assets/images/auth/login.jpg");

export default function LoginScreen() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [choosingTenant, setChoosingTenant] = useState(false);

  const { login, loading, error } = useLogin();
  const {
    isAuthenticated,
    pendingTenantChoice,
    loginWithTenant,
    clearPendingTenantChoice,
  } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(protected)/home");
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");

    try {
      await login(email, password);
    } catch (err: unknown) {
      if (isLoginFieldError(err)) {
        if (err.field === "email") {
          setEmailError(err.message);
        } else {
          setPasswordError(err.message);
        }
      }
    }
  };

  const handleChooseSchool = async (tenantId: string) => {
    setChoosingTenant(true);
    try {
      await loginWithTenant(tenantId);
      router.replace("/(protected)/home");
    } catch {
      // Error surfaced by auth
    } finally {
      setChoosingTenant(false);
    }
  };

  if (pendingTenantChoice?.tenants?.length) {
    return (
      <SafeScreenWrapper backgroundColor={Colors.background}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{t("whichSchool")}</Text>
              <Text style={styles.subtitle}>{t("tenantSubtitle")}</Text>
            </View>
            <TouchableOpacity
              style={styles.backLink}
              onPress={clearPendingTenantChoice}
              disabled={choosingTenant}
              accessibilityRole="button"
              accessibilityLabel={t("backToLogin")}
            >
              <Text style={styles.forgotPasswordText}>{t("backToLogin")}</Text>
            </TouchableOpacity>
            {choosingTenant ? (
              <ActivityIndicator size="large" style={styles.tenantLoader} color={Colors.primary} />
            ) : (
              <View style={styles.tenantList}>
                {pendingTenantChoice.tenants.map((tenant) => (
                  <TouchableOpacity
                    key={tenant.id}
                    style={styles.tenantItem}
                    onPress={() => handleChooseSchool(tenant.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={tenant.name}
                  >
                    <Text style={styles.tenantName}>{tenant.name}</Text>
                    {tenant.subdomain ? (
                      <Text style={styles.tenantSubdomain}>{tenant.subdomain}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeScreenWrapper>
    );
  }

  return (
    <SafeScreenWrapper backgroundColor={Colors.background}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.illustrationContainer}>
            <Image
              source={loginIcon}
              style={styles.illustration}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{t("welcomeBack")}</Text>
            <Text style={styles.subtitle}>{t("signInSubtitle")}</Text>
          </View>

          <View style={styles.form}>
            <AuthInput
              label={t("emailLabel")}
              placeholder={t("emailPlaceholder")}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon="mail-outline"
              error={emailError}
            />

            <AuthInput
              label={t("passwordLabel")}
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              autoComplete="password"
              icon="lock-closed-outline"
              error={passwordError}
            />

            <View style={styles.forgotPasswordContainer}>
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("forgotPassword")}>
                  <Text style={styles.forgotPasswordText}>{t("forgotPassword")}</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <AuthButton
              title={t("signIn")}
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("noAccountPrefix")} </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("signUp")}>
                  <Text style={styles.linkText}>{t("signUp")}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  illustration: {
    width: 200,
    height: 200,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  loginButton: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginBottom: 16,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    flexWrap: "wrap",
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  backLink: {
    marginBottom: 24,
  },
  tenantList: {
    gap: 12,
  },
  tenantItem: {
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tenantName: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
  },
  tenantSubdomain: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tenantLoader: {
    marginTop: 24,
  },
});

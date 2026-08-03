import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { CustomInput } from '../../components/CustomInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { COLORS } from '../../constants/theme';
import { Mail, Lock, ShieldCheck } from 'lucide-react-native';

export const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('admin@acmeenterprise.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logoImg} 
          resizeMode="contain" 
        />
        <Text style={styles.subtitle}>Enterprise Workforce & Talent Platform</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardHeader}>Sign In to Account</Text>

        <CustomInput
          label="Work Email or Username"
          placeholder="admin@company.com or username"
          value={email}
          onChangeText={setEmail}
          icon={Mail}
          autoCapitalize="none"
        />

        <CustomInput
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          icon={Lock}
          secureTextEntry
        />

        <PrimaryButton
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          style={styles.loginBtn}
        />

        <View style={styles.demoButtons}>
          <Text style={styles.demoTitle}>Quick Demo Switcher:</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => {
                setEmail('admin@acmeenterprise.com');
                setPassword('password123');
              }}
            >
              <Text style={styles.demoChipText}>Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => {
                setEmail('hr@acmeenterprise.com');
                setPassword('password123');
              }}
            >
              <Text style={styles.demoChipText}>HR Lead</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => {
                setEmail('employee@acmeenterprise.com');
                setPassword('password123');
              }}
            >
              <Text style={styles.demoChipText}>Employee</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have a company account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')}>
          <Text style={styles.registerLink}>Register Organization</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImg: {
    width: 240,
    height: 75,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  loginBtn: {
    marginTop: 12,
  },
  demoButtons: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  demoTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});

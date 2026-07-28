import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { CustomInput } from '../../components/CustomInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { COLORS } from '../../constants/theme';
import { User, Mail, Lock, Building, ArrowLeft } from 'lucide-react-native';

export const RegisterScreen = ({ navigation }) => {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('Admin');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !companyName) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, companyName, role });
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Could not register organization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>


      <Text style={styles.title}>Register Organization</Text>
      <Text style={styles.subtitle}>Setup company account & HR workspace in seconds</Text>

      <View style={styles.formCard}>
        <CustomInput
          label="Full Name"
          placeholder="e.g. John Doe"
          value={name}
          onChangeText={setName}
          icon={User}
        />

        <CustomInput
          label="Company Name"
          placeholder="e.g. Acme Enterprise"
          value={companyName}
          onChangeText={setCompanyName}
          icon={Building}
        />

        <CustomInput
          label="Work Email"
          placeholder="john@acme.com"
          value={email}
          onChangeText={setEmail}
          icon={Mail}
          keyboardType="email-address"
        />

        <CustomInput
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          icon={Lock}
          secureTextEntry
        />

        <Text style={styles.roleLabel}>Account Role</Text>
        <View style={styles.roleRow}>
          {['Admin', 'HR', 'Manager', 'Employee'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleChip, role === r && styles.roleChipActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <PrimaryButton
          title="Create Workspace"
          onPress={handleRegister}
          loading={loading}
          style={styles.submitBtn}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  roleChip: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: '#ffffff',
  },
  submitBtn: {
    marginTop: 8,
  },
});

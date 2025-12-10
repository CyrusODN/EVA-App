import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  FileText,
  BookOpen,
  Brain,
  Pill,
  Stethoscope,
  GraduationCap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import Header from '../../components/header';
import PrimaryButton from '../../components/primaryButton';
import { useNavigation } from '@react-navigation/native';
import { textStyles } from '../../constants/textStyles';

interface Plan {
  id: number;
  name: string;
  billingModel: string;
  subscribedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'pending';
}

interface SubPlan {
  nameKey: string;
  price: string;
  featureKeys: string[];
}

interface AvailablePlan {
  nameKey: string;
  descriptionKey: string;
  price: string;
  periodKey: string;
  icon: React.ComponentType<any>;
  featureKeys: string[];
  subPlans?: SubPlan[];
}

// Mock data for subscribed plans
const MOCK_PLANS: Plan[] = [
  {
    id: 1,
    name: 'Remedius Notes - Full Package',
    billingModel: 'Yearly',
    subscribedAt: '15/03/2025',
    expiresAt: '15/03/2026',
    status: 'active',
  },
  {
    id: 2,
    name: 'Remedius Research - Scholar',
    billingModel: 'Yearly',
    subscribedAt: '15/03/2025',
    expiresAt: '15/03/2026',
    status: 'active',
  },
];

// Available plans data
const AVAILABLE_PLANS_DATA: AvailablePlan[] = [
  {
    nameKey: 'aiTools.notes.title',
    descriptionKey: 'aiTools.notes.description',
    price: '299.99',
    periodKey: 'common.month',
    icon: FileText,
    featureKeys: [
      'aiTools.notes.features.0',
      'aiTools.notes.features.1',
      'aiTools.notes.features.2',
    ],
    subPlans: [
      {
        nameKey: 'pricing.subplans.notes.patientVisits.name',
        price: '149.99',
        featureKeys: [
          'pricing.subplans.notes.patientVisits.features.0',
          'pricing.subplans.notes.patientVisits.features.1',
          'pricing.subplans.notes.patientVisits.features.2',
        ],
      },
      {
        nameKey: 'pricing.subplans.notes.meetings.name',
        price: '99.99',
        featureKeys: [
          'pricing.subplans.notes.meetings.features.0',
          'pricing.subplans.notes.meetings.features.1',
          'pricing.subplans.notes.meetings.features.2',
        ],
      },
    ],
  },
  {
    nameKey: 'aiTools.discharge.title',
    descriptionKey: 'aiTools.discharge.description',
    price: '199.99', // Przykładowa cena
    periodKey: 'common.month',
    icon: BookOpen, // Zmieniono ikonę dla Discharge na BookOpen
    featureKeys: [
      'aiTools.discharge.features.0',
      'aiTools.discharge.features.1',
      'aiTools.discharge.features.2',
    ],
  },
  {
    nameKey: 'aiTools.research.title',
    descriptionKey: 'aiTools.research.description',
    price: '399.99',
    periodKey: 'common.month',
    icon: GraduationCap,
    featureKeys: [
      'aiTools.research.features.0',
      'aiTools.research.features.1',
      'aiTools.research.features.2',
    ],
    subPlans: [
      {
        nameKey: 'pricing.subplans.research.scholar.name',
        price: '149.99',
        featureKeys: [
          'pricing.subplans.research.scholar.features.0',
          'pricing.subplans.research.scholar.features.1',
          'pricing.subplans.research.scholar.features.2',
        ],
      },
      {
        nameKey: 'pricing.subplans.research.protocol.name',
        price: '149.99',
        featureKeys: [
          'pricing.subplans.research.protocol.features.0',
          'pricing.subplans.research.protocol.features.1',
          'pricing.subplans.research.protocol.features.2',
        ],
      },
      {
        nameKey: 'pricing.subplans.research.pro.name',
        price: '199.99',
        featureKeys: [
          'pricing.subplans.research.pro.features.0',
          'pricing.subplans.research.pro.features.1',
          'pricing.subplans.research.pro.features.2',
        ],
      },
    ],
  },
  {
    nameKey: 'aiTools.pharmacopedia.title',
    descriptionKey: 'aiTools.pharmacopedia.description',
    price: '149.99',
    periodKey: 'common.month',
    icon: Pill,
    featureKeys: [
      'aiTools.pharmacopedia.features.0',
      'aiTools.pharmacopedia.features.1',
      'aiTools.pharmacopedia.features.2',
    ],
  },
  {
    nameKey: 'aiTools.consult.title',
    descriptionKey: 'aiTools.consult.description',
    price: '199.99', // Przykładowa cena
    periodKey: 'common.month',
    icon: Stethoscope,
    featureKeys: [
      'aiTools.consult.features.0',
      'aiTools.consult.features.1',
      'aiTools.consult.features.2',
    ],
  },
  {
    nameKey: 'aiTools.report.title',
    descriptionKey: 'aiTools.report.description',
    price: '149.99', // Przykładowa cena
    periodKey: 'common.month',
    icon: FileText, // Użyto FileText dla Report
    featureKeys: [
      'aiTools.report.features.0',
      'aiTools.report.features.1',
      'aiTools.report.features.2',
    ],
  },
  // DODANY PLAN: Remedius Pathfinder
  {
    nameKey: 'aiTools.pathfinder.title',
    descriptionKey: 'aiTools.pathfinder.description',
    price: '179.99', // Przykładowa cena
    periodKey: 'common.month',
    icon: Brain, // Użyto ikony Brain dla Pathfinder
    featureKeys: [
      'aiTools.pathfinder.features.0',
      'aiTools.pathfinder.features.1',
      'aiTools.pathfinder.features.2',
    ],
  },
];

const statusTranslationKeys = {
  active: 'subscription.status.active',
  expired: 'subscription.status.expired',
  pending: 'subscription.status.pending',
};

const Subscription = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    'monthly',
  );

  const getYearlyPrice = (monthlyPrice: string) => {
    const price = parseFloat(monthlyPrice);
    if (isNaN(price)) return monthlyPrice;
    return (price * 10).toFixed(2);
  };

  const handleSubscribe = (planId?: string) => {
    console.log(`Subscribing to plan: ${planId}, period: ${billingPeriod}`);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return {
          backgroundColor: '#dcfce7',
          color: '#166534',
        };
      case 'expired':
        return {
          backgroundColor: '#fecaca',
          color: '#991b1b',
        };
      case 'pending':
        return {
          backgroundColor: '#fef3c7',
          color: '#92400e',
        };
      default:
        return {
          backgroundColor: colors.primaryContainer,
          color: colors.darkPrimary,
        };
    }
  };

  const SubscribedPlanCard = ({ plan }: { plan: Plan }) => (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <Text variant="titleMedium" style={styles.planName}>
          {plan.name}
        </Text>
        <View style={[styles.statusBadge, getStatusStyle(plan.status)]}>
          <Text
            variant="labelSmall"
            style={[
              styles.statusText,
              { color: getStatusStyle(plan.status).color },
            ]}
          >
            {t(statusTranslationKeys[plan.status])}
          </Text>
        </View>
      </View>
      <View style={styles.planDetails}>
        <View style={styles.planDetailRow}>
          <Text variant="bodySmall" style={styles.planDetailLabel}>
            {t('subscription.table.billingModel')}:
          </Text>
          <Text variant="bodySmall" style={styles.planDetailValue}>
            {plan.billingModel}
          </Text>
        </View>
        <View style={styles.planDetailRow}>
          <Text variant="bodySmall" style={styles.planDetailLabel}>
            {t('subscription.table.subscribedAt')}:
          </Text>
          <Text variant="bodySmall" style={styles.planDetailValue}>
            {plan.subscribedAt}
          </Text>
        </View>
        <View style={styles.planDetailRow}>
          <Text variant="bodySmall" style={styles.planDetailLabel}>
            {t('subscription.table.expiresAt')}:
          </Text>
          <Text variant="bodySmall" style={styles.planDetailValue}>
            {plan.expiresAt}
          </Text>
        </View>
      </View>
    </View>
  );

  const AvailablePlanCard = ({ plan }: { plan: AvailablePlan }) => {
    const IconComponent = plan.icon;
    const isExpanded = expandedPlan === plan.nameKey;
    const currentPrice =
      billingPeriod === 'yearly' ? getYearlyPrice(plan.price) : plan.price;
    const currentPeriodKey =
      billingPeriod === 'yearly' ? 'common.year' : 'common.month';

    return (
      <View style={styles.availablePlanCard}>
        <View style={styles.availablePlanHeader}>
          <View style={styles.planIconContainer}>
            <IconComponent size={24} color="white" />
          </View>
          <View style={styles.planTitleContainer}>
            <Text variant="titleMedium" style={styles.availablePlanTitle}>
              {t(plan.nameKey)}
            </Text>
            <Text variant="bodySmall" style={styles.availablePlanDescription}>
              {t(plan.descriptionKey)}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text variant="headlineSmall" style={styles.price}>
              ${currentPrice}
            </Text>
            <Text variant="bodySmall" style={styles.period}>
              {t('common.per')} {t(currentPeriodKey)}
            </Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {plan.featureKeys.map((featureKey, idx) => (
            <View key={idx} style={styles.featureRow}>
              <CheckCircle2 size={16} color={colors.lightGreen} />
              <Text variant="bodySmall" style={styles.featureText}>
                {t(featureKey)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actionsContainer}>
          {plan.subPlans && (
            <TouchableOpacity
              style={styles.viewToolsButton}
              onPress={() => setExpandedPlan(isExpanded ? null : plan.nameKey)}
            >
              <Text variant="labelMedium" style={styles.viewToolsText}>
                {t('pricing.viewTools')}
              </Text>
              {isExpanded ? (
                <ChevronUp size={16} color={colors.darkPrimary} />
              ) : (
                <ChevronDown size={16} color={colors.darkPrimary} />
              )}
            </TouchableOpacity>
          )}
          <PrimaryButton
            text={t('pricing.subscribe')}
            onPress={() => handleSubscribe(plan.nameKey)}
            width={120}
          />
        </View>

        {/* Expanded sub-plans */}
        {isExpanded && plan.subPlans && (
          <View style={styles.subPlansContainer}>
            {plan.subPlans.map((subPlan, idx) => {
              const subPlanPrice =
                billingPeriod === 'yearly'
                  ? getYearlyPrice(subPlan.price)
                  : subPlan.price;

              return (
                <View key={idx} style={styles.subPlanCard}>
                  <Text variant="titleSmall" style={styles.subPlanName}>
                    {t(subPlan.nameKey)}
                  </Text>
                  <Text variant="bodyMedium" style={styles.subPlanPrice}>
                    ${subPlanPrice}
                  </Text>
                  <Text variant="bodySmall" style={styles.subPlanPeriod}>
                    {t('common.per')} {t(currentPeriodKey)}
                  </Text>
                  <View style={styles.subPlanFeatures}>
                    {subPlan.featureKeys.map((featureKey, fidx) => (
                      <View key={fidx} style={styles.subPlanFeatureRow}>
                        <CheckCircle2 size={12} color={colors.lightGreen} />
                        <Text
                          variant="bodySmall"
                          style={styles.subPlanFeatureText}
                        >
                          {t(featureKey)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <PrimaryButton
                    text={t('pricing.subscribe')}
                    onPress={() =>
                      handleSubscribe(`${plan.nameKey}-${subPlan.nameKey}`)
                    }
                    width={100}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const BillingPeriodTabs = () => (
    <View style={styles.tabsContainer}>
      <View style={styles.tabsWrapper}>
        <TouchableOpacity
          style={[
            styles.tab,
            billingPeriod === 'monthly' && styles.selectedTab,
          ]}
          onPress={() => setBillingPeriod('monthly')}
        >
          <Text
            variant="labelMedium"
            style={[
              styles.tabText,
              billingPeriod === 'monthly' && styles.selectedTabText,
            ]}
          >
            {t('pricing.billing.monthly')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, billingPeriod === 'yearly' && styles.selectedTab]}
          onPress={() => setBillingPeriod('yearly')}
        >
          <Text
            variant="labelMedium"
            style={[
              styles.tabText,
              billingPeriod === 'yearly' && styles.selectedTabText,
            ]}
          >
            {t('pricing.billing.yearly')}
          </Text>
          <View style={styles.saveTextContainer}>
            <Text variant="labelSmall" style={styles.saveText}>
              {t('pricing.billing.saveText')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={t('subscription.title')}
        subtitle={t('subscription.subtitle')}
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Current Subscriptions */}
        {MOCK_PLANS.length > 0 && (
          <View style={styles.section}>
            <Text variant="headlineMedium" style={textStyles.sectionTitle}>
              {t('subscription.title')}
            </Text>
            {MOCK_PLANS.map(plan => (
              <SubscribedPlanCard key={plan.id} plan={plan} />
            ))}
          </View>
        )}

        {/* Available Plans */}
        <View style={styles.section}>
          <Text variant="headlineMedium" style={textStyles.sectionTitle}>
            {t('subscription.availablePlansTitle')}
          </Text>

          {/* Billing Period Tabs */}
          <BillingPeriodTabs />

          {AVAILABLE_PLANS_DATA.map((plan, index) => (
            <AvailablePlanCard key={index} plan={plan} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'SFProDisplay-Bold',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planName: {
    flex: 1,
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  planDetails: {
    gap: 8,
  },
  planDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planDetailLabel: {
    color: colors.subText,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  planDetailValue: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  availablePlanCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  availablePlanHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  availablePlanTitle: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
    marginBottom: 4,
  },
  availablePlanDescription: {
    color: colors.subText,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'SFProDisplay-Bold',
  },
  period: {
    color: colors.subText,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginLeft: 8,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewToolsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  viewToolsText: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginRight: 4,
  },
  subPlansContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
  },
  subPlanCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  subPlanName: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
    marginBottom: 4,
  },
  subPlanPrice: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'SFProDisplay-Bold',
  },
  subPlanPeriod: {
    color: colors.subText,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginBottom: 8,
  },
  subPlanFeatures: {
    marginBottom: 12,
  },
  subPlanFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subPlanFeatureText: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginLeft: 6,
    flex: 1,
    fontSize: 12,
  },
  tabsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  selectedTab: {
    backgroundColor: colors.lightGreen,
  },
  tabText: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  selectedTabText: {
    color: colors.surface,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },
  saveTextContainer: {
    marginLeft: 8,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveText: {
    color: '#166534',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    fontSize: 10,
  },
});

export default Subscription;

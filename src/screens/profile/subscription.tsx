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
  Stethoscope,
  GraduationCap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import Header from '../../components/header';
import { useNavigation } from '@react-navigation/native';
import { textStyles } from '../../constants/textStyles';
import { useTheme } from '../../constants/theme';

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
  featured?: boolean;
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

// Available plans data with featured flag
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
      {
        nameKey: 'pricing.subplans.notes.lectures.name',
        price: '99.99',
        featureKeys: [
          'pricing.subplans.notes.lectures.features.0',
          'pricing.subplans.notes.lectures.features.1',
          'pricing.subplans.notes.lectures.features.2',
        ],
      },
    ],
    featured: true,
  },
  {
    nameKey: 'aiTools.research.title',
    descriptionKey: 'aiTools.research.description',
    price: '299.99',
    periodKey: 'common.month',
    icon: GraduationCap,
    featureKeys: [
      'aiTools.research.features.0',
      'aiTools.research.features.1',
      'aiTools.research.features.2',
    ],
    subPlans: [
      {
        nameKey: 'pricing.subplans.research.assistant.name',
        price: '149.99',
        featureKeys: [
          'pricing.subplans.research.assistant.features.0',
          'pricing.subplans.research.assistant.features.1',
          'pricing.subplans.research.assistant.features.2',
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
    ],
    featured: true,
  },
  {
    nameKey: 'clinicalTools.title',
    descriptionKey: 'clinicalTools.subtitle',
    price: '249.99',
    periodKey: 'common.month',
    icon: Stethoscope,
    featureKeys: [
      'clinicalTools.features.0',
      'clinicalTools.features.1',
      'clinicalTools.features.2',
    ],
    subPlans: [
      {
        nameKey: 'clinicalTools.pharmacopedia.title',
        price: '99.99',
        featureKeys: [
          'clinicalTools.pharmacopedia.features.0',
          'clinicalTools.pharmacopedia.features.1',
          'clinicalTools.pharmacopedia.features.2',
        ],
      },
      {
        nameKey: 'clinicalTools.consult.title',
        price: '149.99',
        featureKeys: [
          'clinicalTools.consult.features.0',
          'clinicalTools.consult.features.1',
          'clinicalTools.consult.features.2',
        ],
      },
    ],
  },
  {
    nameKey: 'aiTools.report.title',
    descriptionKey: 'aiTools.report.description',
    price: '149.99',
    periodKey: 'common.month',
    icon: ClipboardList,
    featureKeys: [
      'aiTools.report.features.0',
      'aiTools.report.features.1',
      'aiTools.report.features.2',
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
  const { colors: themeColors, isDark } = useTheme();
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
          backgroundColor: 'rgba(70, 183, 198, 0.1)',
          color: colors.darkPrimary,
        };
    }
  };

  const SubscribedPlanCard = ({ plan }: { plan: Plan }) => (
    <View
      style={[
        styles.planCard,
        {
          backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF',
          borderColor: isDark ? themeColors.borderNormal : colors.borderColor,
        },
      ]}>
      <View style={styles.planHeader}>
        <Text
          variant="titleMedium"
          style={[
            styles.planName,
            { color: isDark ? themeColors.textPrimary : colors.darkPrimary },
          ]}>
          {plan.name}
        </Text>
        <View style={[styles.statusBadge, getStatusStyle(plan.status)]}>
          <Text
            variant="labelSmall"
            style={[
              styles.statusText,
              { color: getStatusStyle(plan.status).color },
            ]}>
            {t(statusTranslationKeys[plan.status])}
          </Text>
        </View>
      </View>
      <View style={styles.planDetails}>
        <View style={styles.planDetailRow}>
          <Text
            variant="bodySmall"
            style={[
              styles.planDetailLabel,
              { color: isDark ? themeColors.textSecondary : colors.subText },
            ]}>
            {t('subscription.table.billingModel')}:
          </Text>
          <Text
            variant="bodySmall"
            style={[
              styles.planDetailValue,
              { color: isDark ? themeColors.textPrimary : colors.darkPrimary },
            ]}>
            {plan.billingModel}
          </Text>
        </View>
        <View style={styles.planDetailRow}>
          <Text
            variant="bodySmall"
            style={[
              styles.planDetailLabel,
              { color: isDark ? themeColors.textSecondary : colors.subText },
            ]}>
            {t('subscription.table.subscribedAt')}:
          </Text>
          <Text
            variant="bodySmall"
            style={[
              styles.planDetailValue,
              { color: isDark ? themeColors.textPrimary : colors.darkPrimary },
            ]}>
            {plan.subscribedAt}
          </Text>
        </View>
        <View style={styles.planDetailRow}>
          <Text
            variant="bodySmall"
            style={[
              styles.planDetailLabel,
              { color: isDark ? themeColors.textSecondary : colors.subText },
            ]}>
            {t('subscription.table.expiresAt')}:
          </Text>
          <Text
            variant="bodySmall"
            style={[
              styles.planDetailValue,
              { color: isDark ? themeColors.textPrimary : colors.darkPrimary },
            ]}>
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
      <View
        style={[
          styles.availablePlanCard,
          {
            backgroundColor: isDark ? themeColors.layer2 : '#FFFFFF',
            borderColor: isDark ? themeColors.borderNormal : colors.borderColor,
            shadowColor: isDark ? themeColors.accentPrimary : '#000',
          },
        ]}>
        <View style={styles.availablePlanHeader}>
          <View
            style={[
              styles.planIconContainer,
              { backgroundColor: themeColors.accentPrimary },
            ]}>
            <IconComponent size={18} color="white" />
          </View>
          <View style={styles.planTitleContainer}>
            <Text
              variant="titleSmall"
              style={[
                styles.availablePlanTitle,
                {
                  color: isDark ? themeColors.textPrimary : colors.darkPrimary,
                },
              ]}>
              {t(plan.nameKey)}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.availablePlanDescription,
                { color: isDark ? themeColors.textSecondary : colors.subText },
              ]}>
              {t(plan.descriptionKey)}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text
              variant="titleMedium"
              style={[
                styles.price,
                {
                  color: isDark ? themeColors.textPrimary : colors.darkPrimary,
                },
              ]}>
              ${currentPrice}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.period,
                { color: isDark ? themeColors.textSecondary : colors.subText },
              ]}>
              {t('common.per')} {t(currentPeriodKey)}
            </Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {plan.featureKeys.map((featureKey, idx) => (
            <View key={idx} style={styles.featureRow}>
              <CheckCircle2 size={14} color={themeColors.accentPrimary} />
              <Text
                variant="bodySmall"
                style={[
                  styles.featureText,
                  {
                    color: isDark
                      ? themeColors.textPrimary
                      : colors.darkPrimary,
                  },
                ]}>
                {t(featureKey)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actionsContainer}>
          {plan.subPlans && (
            <TouchableOpacity
              style={[
                styles.viewToolsButton,
                {
                  borderColor: isDark
                    ? themeColors.borderNormal
                    : colors.borderColor,
                  backgroundColor: isDark ? 'transparent' : '#FFFFFF',
                },
              ]}
              onPress={() => setExpandedPlan(isExpanded ? null : plan.nameKey)}>
              <Text
                variant="labelMedium"
                style={[
                  styles.viewToolsText,
                  {
                    color: isDark
                      ? themeColors.textPrimary
                      : colors.darkPrimary,
                  },
                ]}>
                {t('pricing.viewTools')}
              </Text>
              {isExpanded ? (
                <ChevronUp
                  size={14}
                  color={isDark ? themeColors.textPrimary : colors.darkPrimary}
                />
              ) : (
                <ChevronDown
                  size={14}
                  color={isDark ? themeColors.textPrimary : colors.darkPrimary}
                />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              {
                borderColor: isDark
                  ? plan.featured
                    ? themeColors.accentPrimary
                    : themeColors.borderNormal
                  : colors.borderColor,
                backgroundColor: plan.featured
                  ? themeColors.accentPrimary
                  : isDark
                  ? 'transparent'
                  : '#FFFFFF',
              },
            ]}
            onPress={() => handleSubscribe(plan.nameKey)}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.subscribeButtonText,
                {
                  color: plan.featured
                    ? '#FFFFFF'
                    : isDark
                    ? themeColors.textPrimary
                    : colors.darkPrimary,
                },
              ]}>
              {t('pricing.subscribe')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Expanded sub-plans */}
        {isExpanded && plan.subPlans && (
          <View
            style={[
              styles.subPlansContainer,
              {
                borderTopColor: isDark
                  ? themeColors.borderSubtle
                  : colors.borderColor,
              },
            ]}>
            {plan.subPlans.map((subPlan, idx) => {
              const subPlanPrice =
                billingPeriod === 'yearly'
                  ? getYearlyPrice(subPlan.price)
                  : subPlan.price;

              return (
                <View
                  key={idx}
                  style={[
                    styles.subPlanCard,
                    {
                      backgroundColor: isDark ? themeColors.layer1 : '#F8FAFC',
                      borderColor: isDark
                        ? themeColors.borderSubtle
                        : colors.borderColor,
                    },
                  ]}>
                  <Text
                    variant="titleSmall"
                    style={[
                      styles.subPlanName,
                      {
                        color: isDark
                          ? themeColors.textPrimary
                          : colors.darkPrimary,
                      },
                    ]}>
                    {t(subPlan.nameKey)}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.subPlanPrice,
                      {
                        color: isDark
                          ? themeColors.textPrimary
                          : colors.darkPrimary,
                      },
                    ]}>
                    ${subPlanPrice}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.subPlanPeriod,
                      {
                        color: isDark
                          ? themeColors.textSecondary
                          : colors.subText,
                      },
                    ]}>
                    {t('common.per')} {t(currentPeriodKey)}
                  </Text>
                  <View style={styles.subPlanFeatures}>
                    {subPlan.featureKeys.map((featureKey, fidx) => (
                      <View key={fidx} style={styles.subPlanFeatureRow}>
                        <CheckCircle2
                          size={12}
                          color={themeColors.accentPrimary}
                        />
                        <Text
                          variant="bodySmall"
                          style={[
                            styles.subPlanFeatureText,
                            {
                              color: isDark
                                ? themeColors.textPrimary
                                : colors.darkPrimary,
                            },
                          ]}>
                          {t(featureKey)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.subPlanSubscribeButton,
                      {
                        borderColor: isDark
                          ? themeColors.borderNormal
                          : colors.borderColor,
                        backgroundColor: isDark ? 'transparent' : '#FFFFFF',
                      },
                    ]}
                    onPress={() =>
                      handleSubscribe(`${plan.nameKey}-${subPlan.nameKey}`)
                    }
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.subPlanSubscribeButtonText,
                        {
                          color: isDark
                            ? themeColors.textPrimary
                            : colors.darkPrimary,
                        },
                      ]}>
                      {t('pricing.subscribe')}
                    </Text>
                  </TouchableOpacity>
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
      <View
        style={[
          styles.tabsWrapper,
          {
            backgroundColor: isDark ? themeColors.layer1 : '#F8FAFC',
            borderColor: isDark ? themeColors.borderNormal : colors.borderColor,
          },
        ]}>
        <TouchableOpacity
          style={[
            styles.tab,
            billingPeriod === 'monthly' && {
              backgroundColor: themeColors.accentPrimary,
            },
          ]}
          onPress={() => setBillingPeriod('monthly')}>
          <Text
            variant="labelMedium"
            style={[
              styles.tabText,
              {
                color:
                  billingPeriod === 'monthly'
                    ? '#FFFFFF'
                    : isDark
                    ? themeColors.textPrimary
                    : colors.darkPrimary,
              },
            ]}>
            {t('pricing.billing.monthly')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            billingPeriod === 'yearly' && {
              backgroundColor: themeColors.accentPrimary,
            },
          ]}
          onPress={() => setBillingPeriod('yearly')}>
          <Text
            variant="labelMedium"
            style={[
              styles.tabText,
              {
                color:
                  billingPeriod === 'yearly'
                    ? '#FFFFFF'
                    : isDark
                    ? themeColors.textPrimary
                    : colors.darkPrimary,
              },
            ]}>
            {t('pricing.billing.yearly')}
          </Text>
          {billingPeriod === 'yearly' && (
            <View style={styles.saveTextContainer}>
              <Text variant="labelSmall" style={styles.saveText}>
                {t('pricing.billing.saveText')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? themeColors.canvas : '#FFFFFF' },
      ]}
      edges={['top']}>
      <Header
        title={t('subscription.title')}
        subtitle={t('subscription.subtitle')}
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? themeColors.canvas : '#F8FAFC' },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Current Subscriptions */}
        {MOCK_PLANS.length > 0 && (
          <View style={styles.section}>
            <Text
              variant="titleLarge"
              style={[
                textStyles.sectionTitle,
                {
                  color: isDark ? themeColors.textPrimary : colors.darkPrimary,
                },
              ]}>
              {t('subscription.title')}
            </Text>
            {MOCK_PLANS.map((plan) => (
              <SubscribedPlanCard key={plan.id} plan={plan} />
            ))}
          </View>
        )}

        {/* Available Plans */}
        <View style={styles.section}>
          <Text
            variant="titleLarge"
            style={[
              textStyles.sectionTitle,
              { color: isDark ? themeColors.textPrimary : colors.darkPrimary },
            ]}>
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
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  section: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  sectionTitle: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'SFProDisplay-Bold',
    marginBottom: 12,
    fontSize: 20,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  planName: {
    flex: 1,
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
    marginRight: 8,
    fontSize: 15,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    fontSize: 11,
  },
  planDetails: {
    gap: 6,
  },
  planDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planDetailLabel: {
    color: colors.subText,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    fontSize: 13,
  },
  planDetailValue: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    fontSize: 13,
  },
  availablePlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  availablePlanHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#46B7C6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  availablePlanTitle: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
    marginBottom: 2,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  availablePlanDescription: {
    color: colors.subText,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'SFProDisplay-Bold',
    fontSize: 18,
  },
  period: {
    color: colors.subText,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    fontSize: 11,
  },
  featuresContainer: {
    marginBottom: 12,
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginLeft: 8,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  viewToolsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  viewToolsText: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginRight: 4,
    fontSize: 13,
  },
  subscribeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderColor,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  subscribeButtonFeatured: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subscribeButtonText: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
    fontSize: 13,
  },
  subscribeButtonTextFeatured: {
    color: '#FFFFFF',
  },
  subPlansContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
    gap: 8,
  },
  subPlanCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  subPlanName: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
    marginBottom: 4,
    fontSize: 14,
  },
  subPlanPrice: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'SFProDisplay-Bold',
    fontSize: 16,
  },
  subPlanPeriod: {
    color: colors.subText,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginBottom: 8,
    fontSize: 11,
  },
  subPlanFeatures: {
    marginBottom: 10,
    gap: 4,
  },
  subPlanFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subPlanFeatureText: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginLeft: 6,
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  subPlanSubscribeButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.borderColor,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  subPlanSubscribeButtonText: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
    fontSize: 12,
  },
  tabsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: wp(35),
  },
  selectedTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.darkPrimary,
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    fontSize: 14,
  },
  selectedTabText: {
    color: '#FFFFFF',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },
  saveTextContainer: {
    marginLeft: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveText: {
    color: '#166534',
    fontFamily:
      Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    fontSize: 9,
  },
});

export default Subscription;

import React from 'react';
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
import { Download } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import Header from '../../components/header';
import PrimaryButton from '../../components/primaryButton';
import { useNavigation } from '@react-navigation/native';
import { images } from '../../constants/images';

interface Transaction {
  id: number;
  user: string;
  email: string;
  serviceKeys: string[];
  amount: string;
  date: string;
}

const MOCK_TRANSACTIONS_DATA: Transaction[] = [
  {
    id: 1,
    user: 'Jan Nowak',
    email: 'jannowak@gmail.com',
    serviceKeys: ['aiTools.notes.title', 'aiTools.consult.title', 'aiTools.research.title'],
    amount: '220.00 PLN',
    date: '15/03/2025',
  },
  {
    id: 2,
    user: 'Jan Nowak',
    email: 'jannowak@gmail.com',
    serviceKeys: ['aiTools.research.title', 'aiTools.discharge.title'],
    amount: '350.00 PLN',
    date: '14/01/2025',
  },
  {
    id: 3,
    user: 'Jan Nowak',
    email: 'jannowak@gmail.com',
    serviceKeys: ['aiTools.consult.title', 'aiTools.pharmacopedia.title'],
    amount: '280.50 PLN',
    date: '13/01/2025',
  },
];

const Transactions = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handleExport = () => {
    console.log('Export transactions');
    // Implement export functionality
  };

  const TransactionCard = ({ transaction }: { transaction: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionNumber}>
          <Text variant="labelMedium" style={styles.numberLabel}>
            #{transaction.id}
          </Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text variant="titleMedium" style={styles.amountText}>
            {transaction.amount}
          </Text>
        </View>
      </View>

      <View style={styles.transactionUser}>
        <Text variant="titleMedium" style={styles.userName}>
          {transaction.user}
        </Text>
        <Text variant="bodySmall" style={styles.userEmail}>
          {transaction.email}
        </Text>
      </View>

      <View style={styles.servicesContainer}>
        <Text variant="bodySmall" style={styles.servicesLabel}>
          {t('transactions.table.services')}:
        </Text>
        <View style={styles.servicesTags}>
          {transaction.serviceKeys.map((serviceKey, index) => (
            <View key={index} style={styles.serviceTag}>
              <Text variant="labelSmall" style={styles.serviceTagText}>
                {t(serviceKey)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.transactionFooter}>
        <Text variant="bodySmall" style={styles.dateLabel}>
          {t('transactions.table.date')}:
        </Text>
        <Text variant="bodySmall" style={styles.dateText}>
          {transaction.date}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={t('transactions.title')}
        subtitle={t('transactions.subtitle')}
        onLeftPress={() => navigation.goBack()}
        rightIcon={true}
        rightIconSource={images.downloadIcon}
        onRightPress={handleExport}
      />
      
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.transactionsSection}>
            
            {MOCK_TRANSACTIONS_DATA.length > 0 ? (
              <View style={styles.transactionsList}>
                {MOCK_TRANSACTIONS_DATA.map((transaction) => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No transactions found
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
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
  scrollContainer: {
    flex: 1,
  },
  exportSection: {
    padding: 16,
    alignItems: 'center',
  },
  transactionsSection: {
    padding: 16,
  },
  sectionTitle: {
    color: colors.darkPrimary,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'SFProDisplay-Bold',
    marginBottom: 16,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderColor,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionNumber: {
    backgroundColor: colors.lightGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  numberLabel: {
    color: colors.surface,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
  },
  transactionAmount: {},
  amountText: {
    color: colors.darkPrimary,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Bold' : 'SFProDisplay-Bold',
  },
  transactionUser: {
    marginBottom: 12,
  },
  userName: {
    color: colors.darkPrimary,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Semibold' : 'SFProDisplay-Semibold',
    marginBottom: 2,
  },
  userEmail: {
    color: colors.subText,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  servicesContainer: {
    marginBottom: 12,
  },
  servicesLabel: {
    color: colors.subText,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    marginBottom: 8,
  },
  servicesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceTag: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  serviceTagText: {
    color: '#1E40AF',
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    fontSize: 11,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    color: colors.subText,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  dateText: {
    color: colors.darkPrimary,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.subText,
    fontFamily: Platform.OS === 'ios' ? 'SFProDisplay-Regular' : 'SFProDisplay-Regular',
    textAlign: 'center',
  },
});

export default Transactions;
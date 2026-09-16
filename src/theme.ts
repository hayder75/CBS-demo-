import type { ThemeConfig } from 'antd';

export const colors = {
  primary: '#0e7a5f',
  primaryStrong: '#0a5f4a',
  primarySoft: '#e7f4ef',
  accent: '#f79009',
  info: '#2e90fa',
  success: '#12b76a',
  danger: '#f04438',
  warning: '#f79009',
  text: '#101828',
  text2: '#475467',
  text3: '#98a2b3',
  border: '#eaecf0',
  border2: '#f2f4f7',
  bg: '#f6f7f9',
  card: '#ffffff',
} as const;

export const chartPalette = [
  '#0e7a5f',
  '#f79009',
  '#2e90fa',
  '#7a5af8',
  '#12b76a',
  '#f04438',
  '#13c2c2',
  '#ee46bc',
];

export const cbsTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorInfo: colors.info,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.danger,
    colorText: colors.text,
    colorTextSecondary: colors.text2,
    colorTextTertiary: colors.text3,
    colorBorder: colors.border,
    colorBorderSecondary: colors.border2,
    colorBgLayout: colors.bg,
    borderRadius: 8,
    borderRadiusLG: 12,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 13,
    controlHeight: 38,
    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
    boxShadowSecondary: '0 4px 16px rgba(16, 24, 40, 0.06)',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      bodyBg: colors.bg,
      siderBg: '#ffffff',
      headerHeight: 64,
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: colors.primary,
      itemSelectedColor: '#ffffff',
      itemColor: colors.text2,
      itemHoverBg: colors.border2,
      itemBorderRadius: 10,
      itemHeight: 42,
      activeBarWidth: 0,
      itemMarginInline: 0,
    },
    Card: {
      borderRadiusLG: 12,
      paddingLG: 20,
      headerFontSize: 15,
      colorBorderSecondary: colors.border,
    },
    Table: {
      headerBg: '#fafbfc',
      headerColor: colors.text2,
      headerSplitColor: 'transparent',
      borderColor: colors.border2,
      rowHoverBg: '#f8fafc',
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
      fontSize: 13,
    },
    Button: {
      primaryShadow: '0 2px 6px rgba(14, 122, 95, 0.24)',
      defaultBorderColor: colors.border,
      defaultColor: colors.text2,
      fontWeight: 600,
    },
    Input: {
      activeShadow: '0 0 0 3px rgba(14, 122, 95, 0.12)',
    },
    Tag: {
      borderRadiusSM: 999,
    },
    Tabs: {
      inkBarColor: colors.primary,
      itemSelectedColor: colors.primary,
      titleFontSize: 13,
    },
    Statistic: {
      contentFontSize: 28,
    },
    Progress: {
      defaultColor: colors.primary,
    },
  },
};

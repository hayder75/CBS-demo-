import { Select, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useI18n } from '../i18n/I18nContext';
import type { Lang } from '../i18n/translations';

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <Space size={6}>
      <GlobalOutlined style={{ color: '#98a2b3' }} />
      <Select<Lang>
        size="small"
        value={lang}
        onChange={setLang}
        aria-label={t('common.language')}
        options={[
          { value: 'en', label: t('common.english') },
          { value: 'am', label: t('common.amharic') },
        ]}
        style={{ width: 120 }}
      />
    </Space>
  );
}

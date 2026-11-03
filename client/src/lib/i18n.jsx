import { createContext, useContext, useEffect, useState } from 'react';

const UR = {
  'Sign in': 'سائن اِن', 'Sign up': 'اکاؤنٹ بنائیں', 'Sign out': 'سائن آؤٹ', 'Start symptom check': 'علامات کی جانچ شروع کریں',
  'New symptom check': 'نئی جانچ', 'Overview': 'جائزہ', 'Appointments': 'اپائنٹمنٹس', 'Send': 'بھیجیں', 'Type your answer…': 'اپنا جواب لکھیں…',
  'Symptom check': 'علامات کی جانچ', 'Live intake summary': 'براہِ راست خلاصہ', 'Book a doctor': 'ڈاکٹر بُک کریں', 'Confirm booking': 'بکنگ کی تصدیق کریں',
  'Email': 'ای میل', 'Password': 'پاسورڈ', 'Full name': 'پورا نام', 'Phone': 'فون', 'Language': 'زبان', 'Home': 'ہوم',
  'Severe pain, fainting or breathlessness? Call emergency services now.': 'شدید درد، بے ہوشی یا سانس کی دشواری ہو تو فوراً ایمرجنسی پر کال کریں۔',
  'Welcome back': 'خوش آمدید', 'Create your account': 'اپنا اکاؤنٹ بنائیں', 'Tell us how you feel. We point you to the right care, fast.': 'اپنی حالت بتائیں۔ ہم آپ کو درست علاج تک جلدی پہنچاتے ہیں۔',
};
const Ctx = createContext({ lang: 'en', setLang() {}, t: (s) => s });
export const useLang = () => useContext(Ctx);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('mt_lang') || 'en');
  useEffect(() => {
    localStorage.setItem('mt_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  }, [lang]);
  const t = (s) => (lang === 'ur' ? UR[s] || s : s);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

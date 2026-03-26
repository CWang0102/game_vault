import { CheckCircle, XCircle } from 'lucide-react';
import styles from './Toast.module.css';

export default function Toast({ message, type = 'success' }) {
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <Icon size={18} className={styles.icon} />
      <span>{message}</span>
    </div>
  );
}

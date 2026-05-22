import styles from './SemanticBadge.module.css';

type SemanticBadgeTone =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

interface SemanticBadgeProps {
  label: string;
  tone?: SemanticBadgeTone;
  icon?: string;
  className?: string;
}

export default function SemanticBadge({
  label,
  tone = 'neutral',
  icon,
  className = '',
}: SemanticBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]} ${className}`.trim()}>
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {label}
    </span>
  );
}

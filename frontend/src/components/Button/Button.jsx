import styles from './Button.module.css';

const Button = ({ children, noBorder=true, handleClick}) => {
  return(
    <button
      onClick={handleClick}
      className={`${styles.btn} ${noBorder ? styles.noBorderAndOutline : ''}`}
    >
      {children}
    </button>
  );
}
export default Button;
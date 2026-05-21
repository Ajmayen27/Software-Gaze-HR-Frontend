import React from 'react';

const Input = React.forwardRef(({ label, error, icon: Icon, className = '', ...props }, ref) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', display: 'flex' }}>
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={`input-field ${error ? 'input-error' : ''}`}
          style={{ paddingLeft: Icon ? '40px' : '12px' }}
          {...props}
        />
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

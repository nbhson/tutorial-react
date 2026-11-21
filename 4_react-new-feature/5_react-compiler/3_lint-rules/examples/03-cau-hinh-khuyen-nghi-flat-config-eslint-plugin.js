// eslint.config.js
import reactHooks from 'eslint-plugin-react-hooks';
export default [{
  plugins: { 'react-hooks': reactHooks },
  rules: {
    'react-hooks/immutability': 'error', // không mutate props/state/render inputs
    'react-hooks/purity': 'error',       // render thuần, không side-effect
    'react-hooks/refs': 'error',         // không đọc/ghi ref trong render
    'react-hooks/rules-of-hooks': 'error',
  },
}];

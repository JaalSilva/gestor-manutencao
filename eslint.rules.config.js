import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  firebaseRulesPlugin.configs['flat/recommended'],
  {
    files: ["DRAFT_firestore.rules", "firestore.rules"],
  }
];

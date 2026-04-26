import firebaseConfig from "../../firebase-applet-config.json" assert { type: "json" };

/**
 * Esse arquivo deve ser importado antes de qualquer outra dependência do Firebase.
 * Ele força a identidade do projeto no nível de variáveis de ambiente para o gRPC/SDK.
 */

const projectId = firebaseConfig.projectId;

if (!projectId) {
  console.error("[ENV SETUP] CRITICAL: firebaseConfig.projectId não encontrado!");
} else {
  // Define variáveis de ambiente para o gRPC e SDKs do Google Cloud
  process.env.GOOGLE_CLOUD_PROJECT = projectId;
  process.env.GCLOUD_PROJECT = projectId;
  
  // Também definimos uma variável customizada para facilitar a auditoria
  process.env.FIREBASE_PROJECT_ID = projectId;
  
  console.log("[ENV SETUP] Identidade do projeto forçada:", projectId);
}

// Exportar para garantir que o import não seja removido por otimizações de bundle/tree-shaking
export const initializedEnv = true;

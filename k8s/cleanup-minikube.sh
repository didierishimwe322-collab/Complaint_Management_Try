#!/usr/bin/env bash
set -euo pipefail

# Namespace to remove
NAMESPACE="cmss"

# Safety: detect current kubectl context
CURRENT_CTX="$(kubectl config current-context 2>/dev/null || true)"

if [[ -z "${CURRENT_CTX}" ]]; then
  echo "ERROR: no kubectl context found." >&2
  exit 1
fi

# Allow proceed if context contains 'minikube' or FORCE=true set
if [[ "${CURRENT_CTX}" != *minikube* && "${FORCE:-}" != "true" ]]; then
  cat <<EOF
Current kubectl context is '${CURRENT_CTX}', not Minikube.
To proceed anyway set FORCE=true in environment, e.g.
  FORCE=true ./k8s/cleanup-minikube.sh
Aborting.
EOF
  exit 1
fi

echo "Using kubectl context: ${CURRENT_CTX}"
echo "Deleting namespace '${NAMESPACE}' and resources..."

# First attempt to delete namespace (this will remove most resources inside it)
kubectl delete namespace "${NAMESPACE}" --ignore-not-found=true

# Also attempt to delete any leftover resources defined in k8s/ (safe with --ignore-not-found)
kubectl delete -f k8s/namespace.yaml --ignore-not-found=true || true
kubectl delete -f k8s/mysql-secret.yaml --ignore-not-found=true || true
kubectl delete -f k8s/deployment.yaml --ignore-not-found=true || true
kubectl delete -f k8s/service.yaml --ignore-not-found=true || true
kubectl delete -f k8s/hpa.yaml --ignore-not-found=true || true
kubectl delete -f k8s/ingress.yaml --ignore-not-found=true || true

# Wait for namespace to terminate (best-effort)
echo "Waiting up to 60s for namespace to terminate..."
for i in {1..12}; do
  if ! kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
    echo "Namespace '${NAMESPACE}' removed."
    break
  fi
  sleep 5
done

if kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
  echo "Warning: namespace '${NAMESPACE}' still exists. Check 'kubectl get events -n ${NAMESPACE}' and 'kubectl describe namespace ${NAMESPACE}'." >&2
fi

# Optional: remove image from minikube if IMAGE env var provided and minikube present
if command -v minikube >/dev/null 2>&1 && [[ -n "${IMAGE:-}" ]]; then
  echo "Removing image '${IMAGE}' from Minikube image cache..."
  if minikube image rm "${IMAGE}"; then
    echo "Image '${IMAGE}' removed from Minikube."
  else
    echo "Failed to remove image '${IMAGE}' (it may not exist in minikube)." >&2
  fi
fi

echo "Cleanup finished."
